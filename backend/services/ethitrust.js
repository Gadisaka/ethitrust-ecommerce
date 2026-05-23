const crypto = require("crypto");
const axios = require("axios");

const DEFAULT_BASE = "https://api.ethitrust.me/v1";

function getApiBase() {
  return process.env.ETHITRUST_API_BASE_URL || DEFAULT_BASE;
}

function getApiKey() {
  return process.env.ETHITRUST_API_KEY || "";
}

/**
 * Create an org escrow (one invite + amount).
 * @returns {Promise<{ escrowId: string, raw: unknown }>}
 */
async function createOrgEscrow({
  title,
  amountMinorUnits,
  inviteeEmail,
  escrowType = "onetime",
  inspectionPeriodHours = 72,
  idempotencyKey,
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("ETHITRUST_API_KEY is not configured");
  }
  if (!inviteeEmail) {
    throw new Error("inviteeEmail is required for Ethitrust escrow");
  }

  const url = `${getApiBase().replace(/\/$/, "")}/org-escrows`;
  const headers = {
    "X-API-KEY": apiKey,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  let data;
  try {
    const res = await axios.post(
      url,
      {
        title,
        amount: amountMinorUnits,
        invitee_email: inviteeEmail,
        escrow_type: escrowType,
        inspection_period: inspectionPeriodHours,
      },
      { headers, timeout: 30000 }
    );
    data = res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message;
    throw new Error(
      typeof msg === "string" ? msg : JSON.stringify(err.response?.data || msg)
    );
  }

  if (typeof data === "object" && data !== null && data.error) {
    throw new Error(
      typeof data.error === "string" ? data.error : JSON.stringify(data.error)
    );
  }

  const escrowId =
    data?.id ||
    data?.escrow_id ||
    data?.data?.id ||
    data?.data?.escrow_id ||
    data?.data?.uuid;

  if (!escrowId) {
    throw new Error(
      "Ethitrust response missing escrow id: " + JSON.stringify(data)
    );
  }

  return { escrowId: String(escrowId), raw: data };
}

function normalizeSignatureHeader(sig) {
  if (!sig || typeof sig !== "string") return "";
  const s = sig.trim();
  if (s.toLowerCase().startsWith("sha256=")) {
    return s.slice(7).trim();
  }
  return s;
}

function timingSafeEqualString(a, b) {
  try {
    const bufa = Buffer.from(a, "utf8");
    const bufb = Buffer.from(b, "utf8");
    if (bufa.length !== bufb.length) return false;
    return crypto.timingSafeEqual(bufa, bufb);
  } catch {
    return false;
  }
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
 * Verify X-Signature for raw JSON body (HMAC-SHA256).
 * Tries common secret encodings (plain, whsec_ prefix stripped as utf8 or hex).
 */
function verifyWebhookSignature(rawBodyBuffer, headerSignature) {
  const secretEnv = process.env.ETHITRUST_WEBHOOK_SECRET || "";
  if (!secretEnv || !headerSignature) return false;

  const normalizedHeader = normalizeSignatureHeader(headerSignature);
  const secrets = new Set();
  secrets.add(secretEnv);
  if (secretEnv.startsWith("whsec_")) {
    const rest = secretEnv.slice(6);
    secrets.add(rest);
    if (/^[0-9a-fA-F]+$/.test(rest) && rest.length % 2 === 0) {
      try {
        secrets.add(Buffer.from(rest, "hex"));
      } catch {
        /* ignore */
      }
    }
  }

  const digestsToTry = [];
  for (const sec of secrets) {
    if (!sec) continue;
    digestsToTry.push(() =>
      crypto.createHmac("sha256", sec).update(rawBodyBuffer).digest("hex")
    );
    digestsToTry.push(() =>
      crypto.createHmac("sha256", sec).update(rawBodyBuffer).digest("base64")
    );
  }

  const candidates = [
    normalizedHeader,
    headerSignature.trim(),
    headerSignature.trim().replace(/^sha256=/i, ""),
  ].filter(Boolean);

  for (const digestFn of digestsToTry) {
    const d = digestFn();
    for (const c of candidates) {
      if (!c) continue;
      if (timingSafeEqualString(d, c)) return true;
      if (/^[0-9a-fA-F]+$/i.test(c) && /^[0-9a-fA-F]+$/i.test(d)) {
        if (timingSafeEqualHex(d, c)) return true;
      }
    }
  }

  return false;
}

module.exports = {
  createOrgEscrow,
  verifyWebhookSignature,
  getApiBase,
};
