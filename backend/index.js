require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  handleEthitrustWebhook,
} = require("./controllers/ethitrustWebhook.controller");
const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const serviceRoutes = require("./routes/service.route");
const authRoutes = require("./routes/auth.route");
const favoriteRoutes = require("./routes/favorite.route");
const orderRoutes = require("./routes/order.route");
const uploadRoutes = require("./config/uploadRoute");
const adminRoutes = require("./routes/admin.route");
const settingsRoutes = require("./routes/settings.route");
const {
  ethitrustHealthHandler,
} = require("./controllers/ethitrustHealth.controller");

// const dotenv = require('dotenv');

const app = express();

// credentials: true cannot be used with origin: * — browsers require a concrete Origin.
const defaultOrigins = [
  "https://mule-mobile.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://192.168.56.1:8080",
  "https://ethitrust-ecommerce.vercel.app",
];
const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// Ethitrust webhooks: raw body required for HMAC verification (must be before JSON parser)
const webhookHandler = [
  express.raw({ type: "application/json" }),
  handleEthitrustWebhook,
];
app.post("/webhooks/ethitrust", ...webhookHandler);
// Alias matching Ethitrust dashboard default path (/api/v1/webhooks/ethitrust)
app.post("/api/v1/webhooks/ethitrust", ...webhookHandler);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Public diagnostic — helps verify Render env + Ethitrust connectivity
app.get("/api/health/ethitrust", ethitrustHealthHandler);

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);

const connectDB = require("./config/db");
const { startEscrowSyncJob } = require("./jobs/escrowSyncJob");
const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  startEscrowSyncJob();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
