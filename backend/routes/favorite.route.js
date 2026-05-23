const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../auth/Auth");
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
} = require("../controllers/favorite.controller");

// All routes require authentication
router.use(authenticateToken);

// GET /api/favorites - Get all favorites for the authenticated user
router.get("/", getUserFavorites);

// POST /api/favorites - Add a product to favorites
router.post("/", addToFavorites);

// DELETE /api/favorites/:productId - Remove a product from favorites
router.delete("/:productId", removeFromFavorites);

// GET /api/favorites/:productId/check - Check if a product is in favorites
router.get("/:productId/check", checkFavorite);

module.exports = router;
