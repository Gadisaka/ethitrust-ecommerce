const crypto = require("crypto");
const Order = require("../models/Order");
const PaymentTransaction = require("../models/PaymentTransaction");
const EscrowEvent = require("../models/EscrowEvent");
const Dispute = require("../models/Dispute");
const { notify } = require("../utils/notifications");
const logger = require("../utils/logger");

const EVENT_ORDER_STATUS = {
  "escrow.invited": "ESCROW_INVITED",
  "escrow.active": "ESCROW_ACTIVE",
  "escrow.submitted": "SELLER_PROCESSING",
  "escrow.completed": "ESCROW_COMPLETED",
  "escrow.disputed": "DISPUTED",
  "escrow.cancelled": "CANCELLED",
  "escrow.expired": "EXPIRED",
};

const ESCROW_STATUS_BY_EVENT = {
  "escrow.invited": "invited",
  "escrow.active": "active",
  "escrow.submitted": "submitted",
  "escrow.completed": "completed",
  "escrow.disputed": "disputed",
  "escrow.cancelled": "cancelled",
  "escrow.expired": "expired",
};

function deriveEventId(payload, rawBody) {
  const fromPayload =
    payload?.id ||
    payload?.event_id ||
    payload?.data?.event_id ||
    payload?.data?.id;
  if (fromPayload) return String(fromPayload);

  const event = payload?.event || "unknown";
  const escrowId =
    payload?.data?.escrow_id ||
    payload?.data?.escrowId ||
    "unknown";
  const hash = crypto
    .createHash("sha256")
    .update(String(rawBody || JSON.stringify(payload)))
    .digest("hex")
    .slice(0, 32);
  return `${event}:${escrowId}:${hash}`;
}

function extractEscrowId(payload) {
  const data = payload?.data || {};
  return String(data.escrow_id || data.escrowId || data.id || "");
}

function buildOrderUpdate(event, payload) {
  const data = payload?.data || {};
  const statusFromPayload =
    typeof data.status === "string" ? data.status : "";
  const escrowStatus =
    statusFromPayload ||
    ESCROW_STATUS_BY_EVENT[event] ||
    "";

  const orderStatus = EVENT_ORDER_STATUS[event];
  const now = new Date();
  const update = {
    escrowStatus,
    paymentProvider: "ethitrust",
    paymentData: payload,
    escrowLastSyncedAt: now,
  };

  if (orderStatus) {
    update.orderStatus = orderStatus;
  }

  if (event === "escrow.completed") {
    update.paymentStatus = "verified";
    update.paymentVerifiedAt = now;
    update.escrowCompletedAt = now;
  } else if (event === "escrow.cancelled") {
    update.paymentStatus = "failed";
    update.escrowCancelledAt = now;
  } else if (event === "escrow.expired") {
    update.paymentStatus = "failed";
    update.escrowExpiredAt = now;
  } else if (event === "escrow.disputed") {
    update.escrowDisputedAt = now;
  } else if (event === "escrow.active") {
    update.paymentStatus = "pending";
  }

  return update;
}

/**
 * Reconcile order state from Ethitrust API detail/status response.
 */
function mapApiStatusToOrderUpdate(detail) {
  const status = String(
    detail?.status ||
      detail?.escrow_status ||
      detail?.data?.status ||
      ""
  ).toLowerCase();

  const statusMap = {
    invited: "ESCROW_INVITED",
    active: "ESCROW_ACTIVE",
    submitted: "SELLER_PROCESSING",
    completed: "ESCROW_COMPLETED",
    disputed: "DISPUTED",
    cancelled: "CANCELLED",
    expired: "EXPIRED",
    pending: "ESCROW_CREATED",
  };

  const orderStatus = statusMap[status] || undefined;
  const now = new Date();
  const update = {
    escrowStatus: status || undefined,
    escrowMetadata: detail,
    escrowLastSyncedAt: now,
    paymentProvider: "ethitrust",
  };

  if (orderStatus) update.orderStatus = orderStatus;

  if (status === "completed") {
    update.paymentStatus = "verified";
    update.paymentVerifiedAt = now;
    update.escrowCompletedAt = now;
  } else if (status === "cancelled") {
    update.paymentStatus = "failed";
    update.escrowCancelledAt = now;
  } else if (status === "expired") {
    update.paymentStatus = "failed";
    update.escrowExpiredAt = now;
  } else if (status === "disputed") {
    update.escrowDisputedAt = now;
  }

  return update;
}

async function ensureDisputeForOrder(escrowId, orderIds) {
  for (const orderId of orderIds) {
    const existing = await Dispute.findOne({
      orderId,
      status: { $in: ["open", "under_review"] },
    });
    if (existing) continue;
    await Dispute.create({
      orderId,
      escrowId,
      status: "open",
      notes: "Auto-opened from escrow.disputed webhook",
    });
  }
}

async function updatePaymentTransaction(escrowId, event, payload) {
  const txUpdate = { verificationData: payload };
  if (event === "escrow.completed") {
    txUpdate.status = "verified";
    txUpdate.verifiedAt = new Date();
  } else if (event === "escrow.cancelled" || event === "escrow.expired") {
    txUpdate.status = "failed";
  }

  await PaymentTransaction.updateOne(
    { transactionId: String(escrowId), provider: "ethitrust" },
    { $set: txUpdate }
  );
}

async function sendNotification(event, escrowId, orderIds) {
  const typeMap = {
    "escrow.invited": "escrow_invited",
    "escrow.active": "escrow_active",
    "escrow.submitted": "escrow_submitted",
    "escrow.completed": "escrow_completed",
    "escrow.disputed": "escrow_disputed",
    "escrow.cancelled": "escrow_cancelled",
    "escrow.expired": "escrow_expired",
  };
  const type = typeMap[event];
  if (!type) return;

  const orders = await Order.find({ _id: { $in: orderIds } }).select("userId");
  for (const order of orders) {
    await notify({
      type,
      userId: order.userId,
      orderId: order._id,
      escrowId,
      message: `Escrow ${event} for order ${order._id}`,
    });
  }
}

/**
 * Process a verified webhook payload (idempotent).
 */
async function processEscrowWebhook(payload, rawBody) {
  const event = payload?.event;
  const escrowId = extractEscrowId(payload);

  if (!event || !escrowId) {
    throw new Error("Missing event or escrow id in payload");
  }

  const eventId = deriveEventId(payload, rawBody);

  const existing = await EscrowEvent.findOne({ eventId }).lean();
  if (existing?.processed) {
    logger.info({ eventId, escrowId }, "Duplicate webhook event skipped");
    return { duplicate: true, eventId };
  }

  const orders = await Order.find({ ethitrustEscrowId: escrowId }).select(
    "_id userId"
  );
  const orderIds = orders.map((o) => o._id);

  let escrowEvent;
  try {
    escrowEvent = await EscrowEvent.create({
      eventId,
      eventType: event,
      escrowId,
      orderIds,
      payload,
      processed: false,
    });
  } catch (err) {
    if (err.code === 11000) {
      const dup = await EscrowEvent.findOne({ eventId }).lean();
      if (dup?.processed) return { duplicate: true, eventId };
    }
    throw err;
  }

  try {
    const orderUpdate = buildOrderUpdate(event, payload);
    orderUpdate.lastWebhookEventId = eventId;

    await Order.updateMany(
      { ethitrustEscrowId: escrowId },
      { $set: orderUpdate }
    );

    await updatePaymentTransaction(escrowId, event, payload);

    if (event === "escrow.disputed") {
      await ensureDisputeForOrder(escrowId, orderIds);
    }

    await sendNotification(event, escrowId, orderIds);

    await EscrowEvent.updateOne(
      { _id: escrowEvent._id },
      { $set: { processed: true } }
    );

    logger.info({ eventId, event, escrowId, orderCount: orderIds.length }, "Webhook processed");

    return { duplicate: false, eventId, event, escrowId };
  } catch (err) {
    await EscrowEvent.updateOne(
      { _id: escrowEvent._id },
      { $set: { processingError: err.message } }
    );
    throw err;
  }
}

/**
 * Sync escrow state from API detail (admin job / manual sync).
 */
async function reconcileEscrowFromApi(escrowId, detail) {
  const update = mapApiStatusToOrderUpdate(detail);
  const result = await Order.updateMany(
    { ethitrustEscrowId: String(escrowId) },
    { $set: update }
  );

  if (update.orderStatus === "DISPUTED") {
    const orders = await Order.find({ ethitrustEscrowId: String(escrowId) }).select("_id");
    await ensureDisputeForOrder(escrowId, orders.map((o) => o._id));
  }

  if (update.paymentStatus === "verified" || update.paymentStatus === "failed") {
    await PaymentTransaction.updateOne(
      { transactionId: String(escrowId), provider: "ethitrust" },
      {
        $set: {
          status: update.paymentStatus === "verified" ? "verified" : "failed",
          verifiedAt: update.paymentVerifiedAt || new Date(),
          verificationData: detail,
        },
      }
    );
  }

  logger.info(
    { escrowId, orderStatus: update.orderStatus, modified: result.modifiedCount },
    "Escrow reconciled from API"
  );

  return { modifiedCount: result.modifiedCount, update };
}

module.exports = {
  deriveEventId,
  extractEscrowId,
  processEscrowWebhook,
  reconcileEscrowFromApi,
  mapApiStatusToOrderUpdate,
  EVENT_ORDER_STATUS,
};
