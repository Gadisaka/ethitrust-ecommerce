const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const PaymentTransaction = require("../models/PaymentTransaction");
const { verifyTransaction } = require("../config/verifyTransaction");
const ReceiverSettings = require("../models/ReceiverSettings");
const { DEFAULTS } = require("./settings.controller");
const { createOrgEscrow, getEscrowDetail } = require("../services/ethitrust");
const { reconcileEscrowFromApi } = require("../services/escrowWebhookHandler");
const { config } = require("../config/env");
const logger = require("../utils/logger");

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

function buildCheckoutIdempotencyKey(userId, items, checkoutId) {
  if (checkoutId) return String(checkoutId);
  const normalized = [...items]
    .map((i) => `${i.productId}:${i.quantity}`)
    .sort()
    .join("|");
  return crypto
    .createHash("sha256")
    .update(`${userId}:${normalized}`)
    .digest("hex");
}

async function validateCartItems(items) {
  const validated = [];
  for (const item of items) {
    const { productId, quantity } = item || {};
    if (!productId || !quantity || quantity <= 0) {
      throw Object.assign(new Error("Each item requires productId and positive quantity"), {
        status: 400,
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw Object.assign(new Error("Product not found"), { status: 404 });
    }
    if (!product.inStock) {
      throw Object.assign(
        new Error(`Product "${product.name}" is out of stock`),
        { status: 400 }
      );
    }

    validated.push({ product, productId, quantity, totalMoney: product.price * quantity });
  }
  return validated;
}

const createOrder = async (req, res) => {
  try {
    const { productId, amount, totalMoney } = req.body;

    if (!productId || !amount || !totalMoney) {
      return res
        .status(400)
        .json({ message: "productId, amount and totalMoney are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.inStock) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    const order = await Order.create({
      productId,
      userId: req.user?.id || req.user?._id,
      amount,
      totalMoney,
      orderStatus: "PENDING",
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

const getEscrowStatusForOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const order = await Order.findOne({ _id: req.params.id, userId })
      .populate({ path: "productId", select: "name price image" })
      .populate({
        path: "paymentTransaction",
        select: "transactionId provider status verifiedAt",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const escrowId = order.ethitrustEscrowId || order.escrowId;
    let apiDetail = null;

    if (escrowId && order.paymentProvider === "ethitrust") {
      try {
        apiDetail = await getEscrowDetail(escrowId);
        await reconcileEscrowFromApi(escrowId, apiDetail);
        const refreshed = await Order.findById(order._id)
          .populate({ path: "productId", select: "name price image" })
          .populate({
            path: "paymentTransaction",
            select: "transactionId provider status verifiedAt",
          });
        return res.json({ order: refreshed, apiDetail });
      } catch (err) {
        logger.warn({ orderId: order._id, err: err.message }, "Escrow poll sync failed");
      }
    }

    return res.json({ order, apiDetail });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching escrow status", error: error.message });
  }
};

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

const createOrdersWithPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }

    let validated;
    try {
      validated = await validateCartItems(items);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }

    const createdOrders = [];
    for (const { productId, quantity, totalMoney } of validated) {
      const order = await Order.create({
        productId,
        userId,
        amount: quantity,
        totalMoney,
        paymentStatus: "pending",
        orderStatus: "PAYMENT_PENDING",
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

const verifyTransactionForOrder = async (req, res) => {
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

    const existingTx = await PaymentTransaction.findOne({
      transactionId: txId,
    });
    if (existingTx) {
      return res
        .status(409)
        .json({ message: "Transaction ID has already been used" });
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "orderIds are required" });
    }

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

const createOrdersWithEscrow = async (req, res) => {
  const inviteeEmail = config.ethitrust.sellerEmail;
  const inspectionHours = config.ethitrust.inspectionPeriodHours;
  const createdOrders = [];

  try {
    if (!config.enableEscrow) {
      return res.status(503).json({ message: "Escrow checkout is disabled" });
    }

    const userId = req.user?.id || req.user?._id;
    const { items, checkoutId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }

    if (!inviteeEmail) {
      return res.status(500).json({
        message:
          "Escrow is not configured: set ETHITRUST_SELLER_EMAIL (invitee / seller email).",
      });
    }

    const idempotencyKey = buildCheckoutIdempotencyKey(userId, items, checkoutId);

    const existingOrders = await Order.find({
      userId,
      checkoutIdempotencyKey: idempotencyKey,
      ethitrustEscrowId: { $exists: true, $ne: null },
    })
      .populate({ path: "productId", select: "name price image" })
      .populate({ path: "userId", select: "name email" });

    if (existingOrders.length > 0) {
      const escrowId =
        existingOrders[0].ethitrustEscrowId || existingOrders[0].escrowId;
      return res.status(200).json({
        orders: existingOrders,
        escrowId,
        orderStatus: existingOrders[0].orderStatus,
        inspectionPeriodHours: existingOrders[0].inspectionPeriodHours,
        idempotent: true,
      });
    }

    let validated;
    try {
      validated = await validateCartItems(items);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }

    let sumTotalMoney = 0;
    let titleHint = "";

    for (const { product, productId, quantity, totalMoney } of validated) {
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
        orderStatus: "PENDING",
        checkoutIdempotencyKey: idempotencyKey,
        inspectionPeriodHours: inspectionHours,
      });

      await order.populate("productId");
      await order.populate("userId");
      createdOrders.push(order);
    }

    const amountMinorUnits = Math.round(sumTotalMoney * 100);
    const title =
      createdOrders.length > 1
        ? `${titleHint} +${createdOrders.length - 1} more`
        : titleHint || "Store order";

    const { escrowId, raw } = await createOrgEscrow({
      title,
      amountMinorUnits,
      inviteeEmail,
      escrowType: "onetime",
      inspectionPeriodHours: inspectionHours,
      idempotencyKey: `order-${idempotencyKey}`,
      currency: "ETB",
    });

    const orderIds = createdOrders.map((o) => o._id);
    const now = new Date();

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
        const existingTx = await PaymentTransaction.findOne({
          transactionId: escrowId,
        });
        if (existingTx) {
          const linked = await Order.find({ _id: { $in: existingTx.orders } });
          if (linked.length) {
            await Order.deleteMany({
              _id: { $in: createdOrders.map((o) => o._id) },
            });
            return res.status(200).json({
              orders: linked,
              escrowId,
              orderStatus: linked[0]?.orderStatus,
              inspectionPeriodHours: linked[0]?.inspectionPeriodHours,
              idempotent: true,
            });
          }
        }
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
          escrowId,
          paymentProvider: "ethitrust",
          transactionId: escrowId,
          paymentTransaction: txDoc?._id,
          escrowStatus: "pending",
          orderStatus: "ESCROW_CREATED",
          escrowAmount: amountMinorUnits,
          escrowCurrency: "ETB",
          escrowCreatedAt: now,
          escrowMetadata: raw,
          escrowLastSyncedAt: now,
        },
      }
    );

    const updatedOrders = await Order.find({ _id: { $in: orderIds } })
      .populate({ path: "productId", select: "name price image" })
      .populate({ path: "userId", select: "name email" });

    logger.info(
      { escrowId, userId, orderCount: orderIds.length, idempotencyKey },
      "Escrow checkout completed"
    );

    return res.status(201).json({
      orders: updatedOrders,
      escrowId,
      paymentTransactionId: txDoc?._id,
      orderStatus: "ESCROW_CREATED",
      inspectionPeriodHours: inspectionHours,
    });
  } catch (error) {
    if (createdOrders.length > 0) {
      await Order.deleteMany({
        _id: { $in: createdOrders.map((o) => o._id) },
      });
    }
    logger.error({ err: error.message }, "Escrow checkout failed");
    return res.status(500).json({
      message: "Error creating escrow checkout",
      error: error.message,
      code: error.code,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrdersAdmin,
  createOrdersWithPayment,
  verifyTransactionForOrder,
  createOrdersWithEscrow,
  getEscrowStatusForOrder,
  buildCheckoutIdempotencyKey,
  validateCartItems,
};
