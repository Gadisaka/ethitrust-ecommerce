require("dotenv").config();

function trimEnv(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

function parseBool(val, defaultVal) {
  if (val === undefined || val === "") return defaultVal;
  return String(val).toLowerCase() === "true" || val === "1";
}

function parseIntEnv(val, defaultVal) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

const rawBaseUrl =
  process.env.ETHITRUST_BASE_URL ||
  process.env.ETHITRUST_API_BASE_URL ||
  "https://api.ethitrust.me";

// Normalise legacy values like https://api.ethitrust.me/v1
const baseUrl = rawBaseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");

const config = {
  enableEscrow: parseBool(process.env.ENABLE_ESCROW, true),
  ethitrust: {
    apiKey: trimEnv(process.env.ETHITRUST_API_KEY),
    apiKeyHeader: trimEnv(process.env.ETHITRUST_API_KEY_HEADER) || "X-API-KEY",
    webhookSecret: trimEnv(process.env.ETHITRUST_WEBHOOK_SECRET),
    baseUrl,
    timeoutMs: parseIntEnv(process.env.ETHITRUST_TIMEOUT_MS, 30000),
    maxRetries: parseIntEnv(process.env.ETHITRUST_MAX_RETRIES, 2),
    sellerEmail:
      trimEnv(process.env.ETHITRUST_SELLER_EMAIL) ||
      trimEnv(process.env.ETHITRUST_INVITEE_EMAIL),
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
  } else {
    const keyPreview = config.ethitrust.apiKey.slice(0, 8);
    console.log(
      `[escrow] configured baseUrl=${config.baseUrl} apiKey=${keyPreview}… seller=${config.ethitrust.sellerEmail}`
    );
  }
}

validateEscrowConfig();

module.exports = { config, validateEscrowConfig };
