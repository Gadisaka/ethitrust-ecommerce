const mongoose = require("mongoose");

const DisputeSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    escrowId: { type: String, index: true },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
      index: true,
    },
    notes: { type: String },
    evidence: [{ type: String }],
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolution: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", DisputeSchema);
