const express = require("express");
const router = express.Router();
const { register, login } = require("../auth/Auth");

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const user = await register(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
