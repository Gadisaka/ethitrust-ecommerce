const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../auth/Auth");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  createOrder,
  getMyOrders,
  getAllOrdersAdmin,
  createOrdersWithPayment,
  verifyTransactionForOrder,
  createOrdersWithEscrow,
} = require("../controllers/order.controller");

// All order routes require authentication
router.use(authenticateToken);

// POST /api/orders - create an order
router.post("/", createOrder);

// POST /api/orders/checkout - create multiple orders from cart with payment data
router.post("/checkout", createOrdersWithPayment);

// POST /api/orders/checkout-escrow - cart checkout via Ethitrust escrow
router.post("/checkout-escrow", createOrdersWithEscrow);

// GET /api/orders - list my orders
router.get("/", getMyOrders);

// POST /api/orders/verify-transaction - verify a transaction for user's orders
router.post("/verify-transaction", verifyTransactionForOrder);

// Admin: GET /api/orders/getallorders - list all orders
router.get("/getallorders", requireAdmin, getAllOrdersAdmin);

module.exports = router;
