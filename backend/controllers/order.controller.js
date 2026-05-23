const Order = require("../models/Order");
const Product = require("../models/Product");
const PaymentTransaction = require("../models/PaymentTransaction");
const { verifyTransaction } = require("../config/verifyTransaction");
const ReceiverSettings = require("../models/ReceiverSettings");
const { DEFAULTS } = require("./settings.controller");
const { randomUUID } = require("crypto");
const { createOrgEscrow } = require("../services/ethitrust");

// Helper to get current receiver settings (with fallbacks)
async function getCurrentReceiverSettings() {
  const doc = await ReceiverSettings.findOne({
    key: "receiver_settings_singleton",
  }).lean();
  return {
    cbeReceiverName: doc?.cbeReceiverName || DEFAULTS.cbeReceiverName,
    cbeAccountNumber: doc?.cbeAccountNumber || DEFAULTS.cbeAccountNumber,
    telebirrReceiverName:
      doc?.telebirrReceiverName || DEFAULTS.telebirrReceiverName,
    telebirrPhoneNumber:
      doc?.telebirrPhoneNumber || DEFAULTS.telebirrPhoneNumber,
  };
}

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { productId, amount, totalMoney } = req.body;

    // Basic validation
    if (!productId || !amount || !totalMoney) {
      return res
        .status(400)
        .json({ message: "productId, amount and totalMoney are required" });
    }

    // Ensure product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const order = await Order.create({
      productId,
      userId: req.user?.id || req.user?._id,
      amount,
      totalMoney,
    });

    await order.populate("productId");
    await order.populate("userId");

    return res.status(201).json(order);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Get all orders for the authenticated user
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const orders = await Order.find({ userId })
      .populate({ path: "productId", select: "name price image" })
      .populate({
        path: "paymentTransaction",
        select: "transactionId provider status verifiedAt",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

module.exports = { createOrder, getMyOrders };
// Admin: get all orders
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "productId",
        select: "name price image category",
        populate: { path: "category", select: "name" },
      })
      .populate({ path: "userId", select: "name email" })
      .populate({
        path: "paymentTransaction",
        select: "transactionId provider status verifiedAt",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching all orders", error: error.message });
  }
};

module.exports.getAllOrdersAdmin = getAllOrdersAdmin;

// Create multiple orders from cart with payment info (single transactionId)
module.exports.createOrdersWithPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }

    // Build orders per item
    const createdOrders = [];
    for (const item of items) {
      const { productId, quantity } = item || {};
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          message: "Each item requires productId and positive quantity",
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const totalMoney = product.price * quantity;
      const order = await Order.create({
        productId,
        userId,
        amount: quantity,
        totalMoney,
        paymentStatus: "pending",
      });

      await order.populate("productId");
      await order.populate("userId");
      createdOrders.push(order);
    }

    return res.status(201).json({ orders: createdOrders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating orders", error: error.message });
  }
};

// Verify a transaction: ensure unused, valid, and amount matches before saving
module.exports.verifyTransactionForOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { transactionId, provider, orderIds, payerName, payerAccountNumber } =
      req.body;

    if (!transactionId || !provider) {
      return res
        .status(400)
        .json({ message: "transactionId and provider are required" });
    }

    const normalizedProvider = String(provider).toLowerCase();
    const txId = String(transactionId).trim();
    if (!["cbe", "telebirr"].includes(normalizedProvider)) {
      return res.status(400).json({ message: "Invalid provider" });
    }

    // Ensure txId has never been used before
    const existingTx = await PaymentTransaction.findOne({
      transactionId: txId,
    });
    if (existingTx) {
      return res
        .status(409)
        .json({ message: "Transaction ID has already been used" });
    }

    // Must provide the specific orders being paid
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "orderIds are required" });
    }
    // Fetch and assert ownership and pending status
    const orders = await Order.find({
      _id: { $in: orderIds },
      userId,
      paymentStatus: { $ne: "verified" },
    }).select("totalMoney");

    if (!orders || orders.length !== orderIds.length) {
      return res.status(400).json({
        message:
          "Some orders are invalid, not owned by you, or already verified",
      });
    }

    const settings = await getCurrentReceiverSettings();

    const payload =
      normalizedProvider === "cbe"
        ? {
            referenceId: txId,
            receiverName: settings.cbeReceiverName,
            receiverAccountNumber: settings.cbeAccountNumber,
            payerAccountNumber: payerAccountNumber || "none",
          }
        : {
            referenceId: txId,
            telebirrPhoneNumber: settings.telebirrPhoneNumber,
          };

    const verification = await verifyTransaction(normalizedProvider, payload);

    const isSuccess = Boolean(verification?.success);

    // For CBE: ensure transferredAmount matches expected total (sum of orders)
    if (normalizedProvider === "cbe" && isSuccess) {
      const details =
        verification?.transactionDetails ||
        verification?.data?.transactionDetails ||
        {};
      const transferredStr = details?.transferredAmount;
      if (typeof transferredStr === "string") {
        const numeric = parseFloat(
          String(transferredStr).replace(/[^0-9.]/g, "")
        );
        if (!Number.isNaN(numeric)) {
          const sum = orders.reduce((acc, o) => acc + (o.totalMoney || 0), 0);
          const expected = Math.round(sum * 100) / 100;
          const diff = Math.abs(numeric - expected);
          if (diff > 0.01) {
            return res.status(400).json({
              success: false,
              message:
                "Transferred amount does not match expected total amount.",
              expectedAmount: expected,
              transferredAmount: numeric,
              verification,
            });
          }
        }
      }
    }

    // For Telebirr: ensure received amount matches expected total (sum only)
    if (normalizedProvider === "telebirr" && isSuccess) {
      const details =
        verification?.transactionDetails ||
        verification?.data?.transactionDetails ||
        verification?.data ||
        {};
      const amountStr =
        details?.transferredAmount ||
        details?.receivedAmount ||
        details?.amount ||
        details?.paymentAmount;
      if (typeof amountStr === "string" || typeof amountStr === "number") {
        const numeric = parseFloat(String(amountStr).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(numeric)) {
          const sum = orders.reduce((acc, o) => acc + (o.totalMoney || 0), 0);
          const expected = Math.round(sum * 100) / 100;
          const diff = Math.abs(numeric - expected);
          if (diff > 0.01) {
            return res.status(400).json({
              success: false,
              message: "Received amount does not match expected total amount.",
              expectedAmount: expected,
              receivedAmount: numeric,
              verification,
            });
          }
        }
      }
    }

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        message: verification?.message || "Verification failed",
        verification,
      });
    }

    // Create the transaction record now that it passed all checks
    let txDoc;
    try {
      txDoc = await PaymentTransaction.create({
        transactionId: txId,
        provider: normalizedProvider,
        userId,
        payerName: payerName,
        payerAccountNumber: payerAccountNumber,
        status: "verified",
        verifiedAt: new Date(),
        verificationData: verification,
        orders: orderIds,
      });
    } catch (e) {
      if (e && e.code === 11000) {
        return res
          .status(409)
          .json({ message: "Transaction ID has already been used" });
      }
      throw e;
    }

    // Attach transaction and mark orders as verified
    const result = await Order.updateMany(
      { _id: { $in: orderIds }, userId },
      {
        $set: {
          transactionId: txId,
          paymentProvider: normalizedProvider,
          payerName: payerName,
          payerAccountNumber: payerAccountNumber,
          paymentStatus: "verified",
          paymentVerifiedAt: new Date(),
          paymentData: verification,
          paymentTransaction: txDoc?._id,
        },
      }
    );

    return res.status(200).json({
      success: isSuccess,
      message: verification?.message || (isSuccess ? "Verified" : "Failed"),
      verification,
      updatedCount: result?.modifiedCount ?? 0,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying transaction", error: error.message });
  }
};

// Checkout cart via Ethitrust escrow (replaces manual CBE/Telebirr verification flow)
const createOrdersWithEscrow = async (req, res) => {
  const inviteeEmail =
    process.env.ETHITRUST_SELLER_EMAIL ||
    process.env.ETHITRUST_INVITEE_EMAIL;
  const inspectionHours = Number(
    process.env.ETHITRUST_INSPECTION_PERIOD || 72
  );
  const createdOrders = [];
  try {
    const userId = req.user?.id || req.user?._id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }

    if (!inviteeEmail) {
      return res.status(500).json({
        message:
          "Escrow is not configured: set ETHITRUST_SELLER_EMAIL (invitee / seller email).",
      });
    }

    let sumTotalMoney = 0;
    let titleHint = "";

    for (const item of items) {
      const { productId, quantity } = item || {};
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          message: "Each item requires productId and positive quantity",
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const totalMoney = product.price * quantity;
      sumTotalMoney += totalMoney;
      if (!titleHint) {
        titleHint = `${product.name} (×${quantity})`;
      }

      const order = await Order.create({
        productId,
        userId,
        amount: quantity,
        totalMoney,
        paymentStatus: "pending",
      });

      await order.populate("productId");
      await order.populate("userId");
      createdOrders.push(order);
    }

    // Amount: API sample used integer minor units (e.g. 45000 = 450.00)
    const amountMinorUnits = Math.round(sumTotalMoney * 100);
    const title =
      createdOrders.length > 1
        ? `${titleHint} +${createdOrders.length - 1} more`
        : titleHint || "Store order";

    const idempotencyKey = randomUUID();

    const { escrowId } = await createOrgEscrow({
      title,
      amountMinorUnits,
      inviteeEmail,
      escrowType: "onetime",
      inspectionPeriodHours: inspectionHours,
      idempotencyKey,
    });

    const orderIds = createdOrders.map((o) => o._id);

    let txDoc;
    try {
      txDoc = await PaymentTransaction.create({
        transactionId: escrowId,
        provider: "ethitrust",
        userId,
        status: "pending",
        orders: orderIds,
      });
    } catch (e) {
      if (e && e.code === 11000) {
        await Order.deleteMany({
          _id: { $in: createdOrders.map((o) => o._id) },
        });
        return res.status(409).json({
          message: "Escrow id collision; retry checkout.",
        });
      }
      throw e;
    }

    await Order.updateMany(
      { _id: { $in: orderIds }, userId },
      {
        $set: {
          ethitrustEscrowId: escrowId,
          paymentProvider: "ethitrust",
          transactionId: escrowId,
          paymentTransaction: txDoc?._id,
          escrowStatus: "pending",
        },
      }
    );

    return res.status(201).json({
      orders: createdOrders,
      escrowId,
      paymentTransactionId: txDoc?._id,
    });
  } catch (error) {
    if (createdOrders.length > 0) {
      await Order.deleteMany({
        _id: { $in: createdOrders.map((o) => o._id) },
      });
    }
    return res.status(500).json({
      message: "Error creating escrow checkout",
      error: error.message,
    });
  }
};

module.exports.createOrdersWithEscrow = createOrdersWithEscrow;
