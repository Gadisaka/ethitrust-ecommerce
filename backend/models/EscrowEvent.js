const mongoose = require("mongoose");

const EscrowEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    escrowId: { type: String, required: true, index: true },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    payload: { type: mongoose.Schema.Types.Mixed },
    processed: { type: Boolean, default: false, index: true },
    processingError: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EscrowEvent", EscrowEventSchema);
