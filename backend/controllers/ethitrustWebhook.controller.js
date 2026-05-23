const Order = require("../models/Order");
const PaymentTransaction = require("../models/PaymentTransaction");
const { verifyWebhookSignature } = require("../services/ethitrust");

/**
 * POST /webhooks/ethitrust — raw JSON body required for signature verification.
 */
async function handleEthitrustWebhook(req, res) {
  try {
    const raw =
      Buffer.isBuffer(req.body) && req.body.length
        ? req.body
        : Buffer.from(
            typeof req.body === "string"
              ? req.body
              : JSON.stringify(req.body || {})
          );

    const sig =
      req.headers["x-signature"] ||
      req.headers["X-Signature"];

    if (!verifyWebhookSignature(raw, sig)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    const event = payload?.event;
    const data = payload?.data || {};
    const escrowId = data?.escrow_id || data?.escrowId;

    if (!escrowId) {
      return res.status(400).json({ message: "Missing escrow id in payload" });
    }

    const statusFromPayload =
      typeof data?.status === "string" ? data.status : "";

    let paymentStatus;
    let escrowStatus = statusFromPayload || "";

    if (event === "escrow.completed") {
      paymentStatus = "verified";
      escrowStatus = escrowStatus || "completed";
    } else if (event === "escrow.cancelled" || event === "escrow.expired") {
      paymentStatus = "failed";
      if (!escrowStatus) {
        escrowStatus = event === "escrow.cancelled" ? "cancelled" : "expired";
      }
    } else if (event === "escrow.disputed") {
      escrowStatus = escrowStatus || "disputed";
    } else if (
      event === "escrow.invited" ||
      event === "escrow.active" ||
      event === "escrow.submitted"
    ) {
      if (!escrowStatus) {
        const map = {
          "escrow.invited": "invited",
          "escrow.active": "active",
          "escrow.submitted": "submitted",
        };
        escrowStatus = map[event] || "";
      }
    }

    const commonSet = {
      escrowStatus,
      paymentData: payload,
    };

    if (paymentStatus === "verified") {
      commonSet.paymentStatus = "verified";
      commonSet.paymentVerifiedAt = new Date();
      commonSet.paymentProvider = "ethitrust";
    } else if (paymentStatus === "failed") {
      commonSet.paymentStatus = "failed";
      commonSet.paymentProvider = "ethitrust";
    } else {
      commonSet.paymentProvider = "ethitrust";
    }

    await Order.updateMany(
      { ethitrustEscrowId: String(escrowId) },
      { $set: commonSet }
    );

    const txUpdate = {
      verificationData: payload,
    };
    if (paymentStatus === "verified") {
      txUpdate.status = "verified";
      txUpdate.verifiedAt = new Date();
    } else if (paymentStatus === "failed") {
      txUpdate.status = "failed";
    }

    await PaymentTransaction.updateOne(
      { transactionId: String(escrowId), provider: "ethitrust" },
      { $set: txUpdate }
    );

    return res.status(200).json({ received: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Webhook handler error", error: error.message });
  }
}

module.exports = { handleEthitrustWebhook };
