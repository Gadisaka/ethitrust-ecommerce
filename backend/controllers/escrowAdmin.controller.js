const crypto = require("crypto");
const Order = require("../models/Order");
const EscrowEvent = require("../models/EscrowEvent");
const EscrowWebhookLog = require("../models/EscrowWebhookLog");
const Dispute = require("../models/Dispute");
const { getEscrowDetail } = require("../services/ethitrust");
const { reconcileEscrowFromApi } = require("../services/escrowWebhookHandler");
const logger = require("../utils/logger");

const syncEscrowForOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const escrowId = order.ethitrustEscrowId || order.escrowId;
    if (!escrowId) {
      return res.status(400).json({ message: "Order has no linked escrow" });
    }

    const detail = await getEscrowDetail(escrowId);
    const result = await reconcileEscrowFromApi(escrowId, detail);

    const updated = await Order.findById(req.params.id)
      .populate({ path: "productId", select: "name price image" })
      .populate({ path: "userId", select: "name email" });

    return res.json({ order: updated, sync: result });
  } catch (error) {
    logger.error({ err: error.message, orderId: req.params.id }, "Sync escrow failed");
    return res.status(500).json({ message: "Sync failed", error: error.message });
  }
};

const updateShipment = async (req, res) => {
  try {
    const { shipmentTracking } = req.body;
    if (!shipmentTracking) {
      return res.status(400).json({ message: "shipmentTracking is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          shipmentTracking,
          shippedAt: new Date(),
          orderStatus: "SHIPPED",
        },
      },
      { new: true }
    )
      .populate({ path: "productId", select: "name price image" })
      .populate({ path: "userId", select: "name email" });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Error updating shipment", error: error.message });
  }
};

const markDelivered = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          deliveredAt: new Date(),
          orderStatus: "DELIVERED",
        },
      },
      { new: true }
    )
      .populate({ path: "productId", select: "name price image" })
      .populate({ path: "userId", select: "name email" });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Error marking delivered", error: error.message });
  }
};

const getEscrowEvents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.escrowId) filter.escrowId = req.query.escrowId;
    if (req.query.processed === "true") filter.processed = true;
    if (req.query.processed === "false") filter.processed = false;

    const [events, total] = await Promise.all([
      EscrowEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      EscrowEvent.countDocuments(filter),
    ]);

    return res.json({ events, total, page, limit });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching events", error: error.message });
  }
};

const getEscrowWebhookLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.verified === "false") filter.verified = false;
    if (req.query.processed === "false") filter.processed = false;
    if (req.query.error === "true") filter.error = { $exists: true, $ne: null };

    const [logs, total] = await Promise.all([
      EscrowWebhookLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      EscrowWebhookLog.countDocuments(filter),
    ]);

    return res.json({ logs, total, page, limit });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching webhook logs", error: error.message });
  }
};

const openDispute = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { notes } = req.body;
    const escrowId = order.ethitrustEscrowId || order.escrowId;

    let dispute = await Dispute.findOne({
      orderId: order._id,
      status: { $in: ["open", "under_review"] },
    });

    if (!dispute) {
      dispute = await Dispute.create({
        orderId: order._id,
        escrowId,
        status: "open",
        notes: notes || "Manually opened by admin",
        openedBy: req.user?.id || req.user?._id,
      });
    }

    await Order.updateOne(
      { _id: order._id },
      { $set: { orderStatus: "DISPUTED", escrowDisputedAt: new Date() } }
    );

    return res.status(201).json(dispute);
  } catch (error) {
    return res.status(500).json({ message: "Error opening dispute", error: error.message });
  }
};

const updateDispute = async (req, res) => {
  try {
    const { status, notes, resolution, evidence } = req.body;
    const update = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (resolution !== undefined) update.resolution = resolution;
    if (Array.isArray(evidence)) update.evidence = evidence;
    if (status === "resolved" || status === "closed") {
      update.resolvedBy = req.user?.id || req.user?._id;
    }

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    return res.json(dispute);
  } catch (error) {
    return res.status(500).json({ message: "Error updating dispute", error: error.message });
  }
};

module.exports = {
  syncEscrowForOrder,
  updateShipment,
  markDelivered,
  getEscrowEvents,
  getEscrowWebhookLogs,
  openDispute,
  updateDispute,
};
