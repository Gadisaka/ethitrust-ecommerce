require("dotenv").config();

function trimEnv(val) {
  if (val === undefined || val === null) return "";
  let s = String(val).trim();
  // Render UI sometimes saves values wrapped in quotes — strip them.
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  // Remove zero-width / BOM characters from copy-paste.
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  return s;
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
    apiKeyHeader: trimEnv(process.env.ETHITRUST_API_KEY_HEADER) || "X-API-Key",
    webhookSecret: trimEnv(process.env.ETHITRUST_WEBHOOK_SECRET),
    baseUrl,
    timeoutMs: parseIntEnv(process.env.ETHITRUST_TIMEOUT_MS, 30000),
    maxRetries: parseIntEnv(process.env.ETHITRUST_MAX_RETRIES, 2),
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
  if (missing.length > 0) {
    console.warn(
      `[escrow] ENABLE_ESCROW=true but missing env: ${missing.join(", ")}`
    );
  } else {
    const keyPreview = config.ethitrust.apiKey.slice(0, 8);
    console.log(
      `[escrow] configured baseUrl=${config.ethitrust.baseUrl} header=${config.ethitrust.apiKeyHeader} apiKeyLen=${config.ethitrust.apiKey.length} apiKey=${keyPreview}… buyerEmail=from JWT at checkout`
    );
  }
}

validateEscrowConfig();

module.exports = { config, validateEscrowConfig };
