const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../auth/Auth");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  getReceiverSettings,
  updateReceiverSettings,
} = require("../controllers/settings.controller");

// Public GET for displaying on Payment page
router.get("/receiver", getReceiverSettings);

// Admin-only update
router.put("/receiver", authenticateToken, requireAdmin, updateReceiverSettings);

module.exports = router;


