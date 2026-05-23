const mongoose = require("mongoose");

const EscrowWebhookLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, index: true },
    signature: { type: String },
    headers: { type: mongoose.Schema.Types.Mixed },
    payload: { type: mongoose.Schema.Types.Mixed },
    verified: { type: Boolean, default: false, index: true },
    processed: { type: Boolean, default: false, index: true },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EscrowWebhookLog", EscrowWebhookLogSchema);
