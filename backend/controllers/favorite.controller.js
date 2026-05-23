const Favorite = require("../models/Favorite");
const Product = require("../models/Product");

// Get all favorites for a user
const getUserFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json(favorites);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching favorites", error: error.message });
  }
};

// Add a product to favorites
const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      user: req.user.id,
      product: productId,
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Product already in favorites" });
    }

    // Add to favorites
    const favorite = await Favorite.create({
      user: req.user.id,
      product: productId,
    });

    await favorite.populate("product");
    res.status(201).json(favorite);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding to favorites", error: error.message });
  }
};

// Remove a product from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user.id,
      product: productId,
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Product removed from favorites" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing from favorites", error: error.message });
  }
};

// Check if a product is in favorites
const checkFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOne({
      user: req.user.id,
      product: productId,
    });

    res.status(200).json({ isFavorite: !!favorite });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error checking favorite", error: error.message });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
};
