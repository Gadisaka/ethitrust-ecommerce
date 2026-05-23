require("dotenv").config();

function parseBool(val, defaultVal) {
  if (val === undefined || val === "") return defaultVal;
  return String(val).toLowerCase() === "true" || val === "1";
}

function parseIntEnv(val, defaultVal) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

const baseUrl =
  process.env.ETHITRUST_BASE_URL ||
  process.env.ETHITRUST_API_BASE_URL?.replace(/\/v1\/?$/, "") ||
  "https://api.ethitrust.me";

const config = {
  enableEscrow: parseBool(process.env.ENABLE_ESCROW, true),
  ethitrust: {
    apiKey: process.env.ETHITRUST_API_KEY || "",
    webhookSecret: process.env.ETHITRUST_WEBHOOK_SECRET || "",
    baseUrl: baseUrl.replace(/\/$/, ""),
    timeoutMs: parseIntEnv(process.env.ETHITRUST_TIMEOUT_MS, 30000),
    maxRetries: parseIntEnv(process.env.ETHITRUST_MAX_RETRIES, 2),
    sellerEmail:
      process.env.ETHITRUST_SELLER_EMAIL ||
      process.env.ETHITRUST_INVITEE_EMAIL ||
      "",
    inspectionPeriodHours: parseIntEnv(
      process.env.ETHITRUST_INSPECTION_PERIOD,
      72
    ),
  },
  escrowSyncIntervalMs: parseIntEnv(
    process.env.ESCROW_SYNC_INTERVAL_MS,
    600000
  ),
  escrowSyncStaleMs: parseIntEnv(process.env.ESCROW_SYNC_STALE_MS, 900000),
};

function validateEscrowConfig() {
  if (!config.enableEscrow) return;
  const missing = [];
  if (!config.ethitrust.apiKey) missing.push("ETHITRUST_API_KEY");
  if (!config.ethitrust.webhookSecret) missing.push("ETHITRUST_WEBHOOK_SECRET");
  if (!config.ethitrust.sellerEmail) missing.push("ETHITRUST_SELLER_EMAIL");
  if (missing.length > 0) {
    console.warn(
      `[escrow] ENABLE_ESCROW=true but missing env: ${missing.join(", ")}`
    );
  }
}

validateEscrowConfig();

module.exports = { config, validateEscrowConfig };
