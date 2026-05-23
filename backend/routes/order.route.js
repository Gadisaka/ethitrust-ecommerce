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
  getEscrowStatusForOrder,
} = require("../controllers/order.controller");

router.use(authenticateToken);

router.post("/", createOrder);
router.post("/checkout", createOrdersWithPayment);
router.post("/checkout-escrow", createOrdersWithEscrow);
router.get("/", getMyOrders);
router.post("/verify-transaction", verifyTransactionForOrder);
router.get("/getallorders", requireAdmin, getAllOrdersAdmin);
router.get("/:id/escrow-status", getEscrowStatusForOrder);

module.exports = router;
