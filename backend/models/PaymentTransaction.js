const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    provider: {
      type: String,
      enum: ["cbe", "telebirr", "ethitrust"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payerName: { type: String },
    payerAccountNumber: { type: String },
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
    verifiedAt: { type: Date },
    verificationData: { type: mongoose.Schema.Types.Mixed },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", PaymentTransactionSchema);
