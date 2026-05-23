const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  getDashboardStats,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllServices,
  createService,
  updateService,
  deleteService,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/admin.controller");
const {
  syncEscrowForOrder,
  updateShipment,
  markDelivered,
  getEscrowEvents,
  getEscrowWebhookLogs,
  openDispute,
  updateDispute,
} = require("../controllers/escrowAdmin.controller");

router.use(requireAdmin);

router.get("/dashboard", getDashboardStats);

router.get("/products", getAllProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/services", getAllServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.post("/orders/:id/sync-escrow", syncEscrowForOrder);
router.patch("/orders/:id/shipment", updateShipment);
router.patch("/orders/:id/delivery", markDelivered);

router.get("/escrow-events", getEscrowEvents);
router.get("/escrow-webhook-logs", getEscrowWebhookLogs);

router.post("/disputes/:orderId/open", openDispute);
router.patch("/disputes/:id", updateDispute);

module.exports = router;
