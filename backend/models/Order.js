const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    totalMoney: { type: Number, required: true },

    // Payment-related fields (optional; for bank/mobile payments)
    transactionId: { type: String, index: true },
    paymentProvider: {
      type: String,
      enum: ["cbe", "telebirr", "ethitrust"],
    },
    payerName: { type: String },
    payerAccountNumber: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
    paymentVerifiedAt: { type: Date },
    paymentData: { type: mongoose.Schema.Types.Mixed },

    ethitrustEscrowId: { type: String, index: true },
    escrowStatus: { type: String },

    // Link to the PaymentTransaction record
    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
