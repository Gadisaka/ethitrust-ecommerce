const crypto = require("crypto");
const mongoose = require("mongoose");

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${ts}-${rand}`;
}

const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "ESCROW_CREATED",
  "ESCROW_INVITED",
  "ESCROW_ACTIVE",
  "SELLER_PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "ESCROW_COMPLETED",
  "DISPUTED",
  "CANCELLED",
  "EXPIRED",
];

const TERMINAL_ORDER_STATUSES = [
  "ESCROW_COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

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

    orderNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateOrderNumber,
    },

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "PENDING",
      index: true,
    },

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
    escrowId: { type: String, index: true },
    escrowStatus: { type: String },
    escrowAmount: { type: Number },
    escrowCurrency: { type: String, default: "ETB" },
    escrowCreatedAt: { type: Date },
    escrowCompletedAt: { type: Date },
    escrowLastSyncedAt: { type: Date },
    escrowDisputedAt: { type: Date },
    escrowCancelledAt: { type: Date },
    escrowExpiredAt: { type: Date },
    inspectionPeriodHours: { type: Number },
    escrowMetadata: { type: mongoose.Schema.Types.Mixed },
    lastWebhookEventId: { type: String },

    shipmentTracking: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },

    checkoutIdempotencyKey: { type: String, index: true, sparse: true },

    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
    },
  },
  { timestamps: true }
);

OrderSchema.pre("validate", function assignOrderNumber(next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

OrderSchema.index({ orderStatus: 1, escrowLastSyncedAt: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", OrderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.TERMINAL_ORDER_STATUSES = TERMINAL_ORDER_STATUSES;
module.exports.generateOrderNumber = generateOrderNumber;
