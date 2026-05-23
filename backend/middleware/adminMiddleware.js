const { authenticateToken } = require("../auth/Auth");

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  // First authenticate the token
  authenticateToken(req, res, (err) => {
    if (err) return;

    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  });
}

module.exports = { requireAdmin };
