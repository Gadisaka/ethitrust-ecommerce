const crypto = require("crypto");
const { config } = require("../config/env");
const logger = require("../utils/logger");
const {
  describeEthitrustBlock,
  isCloudflareChallenge,
} = require("../utils/ethitrustDiagnostics");

let clientPromise = null;

async function getEthitrustClient() {
  if (!config.ethitrust.apiKey) {
    throw new Error("ETHITRUST_API_KEY is not configured");
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const { EthitrustClient } = await import("@ethitrust/sdk");
      return new EthitrustClient({
        apiKey: config.ethitrust.apiKey,
        apiKeyHeader: config.ethitrust.apiKeyHeader,
        baseUrl: config.ethitrust.baseUrl,
        timeoutMs: config.ethitrust.timeoutMs,
        maxRetries: config.ethitrust.maxRetries,
      });
    })();
  }
  return clientPromise;
}

function mapEthitrustError(err) {
  const name = err?.constructor?.name || "Error";
  const retryable =
    name === "EthitrustRateLimitError" ||
    name === "EthitrustNetworkError" ||
    (name === "EthitrustApiError" && err.status >= 500);
  return {
    code: name,
    message: err.message || "Ethitrust API error",
    retryable,
    status: err.status,
  };
}

/**
 * Create an org escrow (one invite + amount).
 * @param {number} amountEtB - Total in ETB major units (e.g. 168 for ETB 168.00)
 * @param {string} inviteeEmail - Buyer email (Ethitrust invitee / counterparty)
 * @returns {Promise<{ escrowId: string, raw: unknown }>}
 */
async function createOrgEscrow({
  title,
  amountEtB,
  inviteeEmail,
  escrowType = "onetime",
  inspectionPeriodHours = 72,
  idempotencyKey,
  currency = "ETB",
}) {
  if (!inviteeEmail) {
    throw new Error("inviteeEmail (buyer email) is required for Ethitrust escrow");
  }
  if (!Number.isFinite(amountEtB) || amountEtB <= 0) {
    throw new Error("amountEtB must be a positive number");
  }

  const amount = Math.round(amountEtB * 100) / 100;

  const client = await getEthitrustClient();
  const extras = idempotencyKey ? { idempotencyKey } : {};

  try {
    const data = await client.orgEscrows.create(
      {
        title,
        amount,
        invitee_email: inviteeEmail,
        escrow_type: escrowType,
        inspection_period: inspectionPeriodHours,
        currency,
        who_pays_fees: "split",
      },
      extras
    );

    const escrowId =
      data?.escrow_id ||
      data?.id ||
      data?.data?.escrow_id ||
      data?.data?.id;

    if (!escrowId) {
      throw new Error(
        "Ethitrust response missing escrow id: " + JSON.stringify(data)
      );
    }

    logger.info(
      { escrowId: String(escrowId), idempotencyKey, amountEtB: amount },
      "Escrow created"
    );

    return { escrowId: String(escrowId), raw: data };
  } catch (err) {
    const mapped = mapEthitrustError(err);
    const blockHint = describeEthitrustBlock(err.status, err.body);
    logger.error(
      {
        err: mapped,
        idempotencyKey,
        status: err.status,
        cloudflare: isCloudflareChallenge(err.body),
      },
      "Escrow creation failed"
    );
    const e = new Error(blockHint || mapped.message);
    e.code = mapped.code;
    e.retryable = mapped.retryable;
    e.cloudflareBlocked = Boolean(blockHint && isCloudflareChallenge(err.body));
    throw e;
  }
}

async function getEscrowDetail(escrowId) {
  const client = await getEthitrustClient();
  try {
    return await client.orgEscrows.getDetail(String(escrowId));
  } catch (err) {
    const mapped = mapEthitrustError(err);
    const e = new Error(mapped.message);
    e.code = mapped.code;
    e.retryable = mapped.retryable;
    throw e;
  }
}

async function getEscrowStatus(escrowId) {
  const client = await getEthitrustClient();
  try {
    return await client.orgEscrows.getStatus(String(escrowId));
  } catch (err) {
    const mapped = mapEthitrustError(err);
    const e = new Error(mapped.message);
    e.code = mapped.code;
    e.retryable = mapped.retryable;
    throw e;
  }
}

function normalizeSignatureHeader(sig) {
  if (!sig || typeof sig !== "string") return "";
  const s = sig.trim();
  if (s.toLowerCase().startsWith("sha256=")) {
    return s.slice(7).trim();
  }
  return s;
}

function timingSafeEqualHex(a, b) {
  try {
    const bufa = Buffer.from(String(a).replace(/^0x/i, ""), "hex");
    const bufb = Buffer.from(String(b).replace(/^0x/i, ""), "hex");
    if (bufa.length === 0 || bufb.length === 0 || bufa.length !== bufb.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufa, bufb);
  } catch {
    return false;
  }
}

/**
 * Verify X-Signature for raw JSON body (HMAC-SHA256 hex).
 */
function verifyWebhookSignature(rawBodyBuffer, headerSignature) {
  const secretEnv = config.ethitrust.webhookSecret;
  if (!secretEnv || !headerSignature) return false;

  const normalizedHeader = normalizeSignatureHeader(headerSignature);
  const secrets = [secretEnv];
  if (secretEnv.startsWith("whsec_")) {
    secrets.push(secretEnv.slice(6));
  }

  for (const sec of secrets) {
    if (!sec) continue;
    const digest = crypto
      .createHmac("sha256", sec)
      .update(rawBodyBuffer)
      .digest("hex");
    if (timingSafeEqualHex(digest, normalizedHeader)) return true;
  }

  return false;
}

function getApiBase() {
  return config.ethitrust.baseUrl;
}

module.exports = {
  getEthitrustClient,
  createOrgEscrow,
  getEscrowDetail,
  getEscrowStatus,
  verifyWebhookSignature,
  mapEthitrustError,
  getApiBase,
};
