const { config } = require("../config/env");
const { mapEthitrustError } = require("../services/ethitrust");
const logger = require("../utils/logger");
const {
  isCloudflareChallenge,
  describeEthitrustBlock,
} = require("../utils/ethitrustDiagnostics");

const PROBE_ESCROW_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Safe config snapshot for debugging (never exposes full secrets).
 */
function getEthitrustConfigSnapshot() {
  const key = config.ethitrust.apiKey;
  return {
    enableEscrow: config.enableEscrow,
    baseUrl: config.ethitrust.baseUrl,
    apiKeyHeader: config.ethitrust.apiKeyHeader,
    apiKeyPresent: Boolean(key),
    apiKeyLength: key.length,
    apiKeyPrefix: key ? key.slice(0, 8) : null,
    apiKeySuffix: key ? key.slice(-4) : null,
    sellerEmailPresent: Boolean(config.ethitrust.sellerEmail),
    webhookSecretPresent: Boolean(config.ethitrust.webhookSecret),
  };
}

function classifyAuthProbe(status, body) {
  if (status === 404) {
    return {
      ok: true,
      auth: "valid",
      note: "API key accepted (escrow not found probe)",
    };
  }
  if (status === 401) {
    return {
      ok: false,
      auth: "invalid_key",
      note: "Ethitrust rejected the API key",
    };
  }
  if (status === 403) {
    if (isCloudflareChallenge(body)) {
      return {
        ok: false,
        auth: "cloudflare_blocked",
        note:
          "Cloudflare bot protection returned an HTML challenge page instead of Ethitrust JSON. Ask Ethitrust to exempt /api/v1/* from Cloudflare or allowlist Render egress IPs.",
      };
    }
    const isPlainForbidden =
      !body ||
      (typeof body === "string" && body.includes("Forbidden")) ||
      (typeof body === "object" && !body.detail && !body.error);
    return {
      ok: false,
      auth: isPlainForbidden ? "blocked_or_forbidden" : "forbidden",
      note: isPlainForbidden
        ? "403 without Ethitrust JSON — likely blocked from this hosting provider."
        : "Ethitrust returned 403 for this org/key",
    };
  }
  return {
    ok: false,
    auth: "unknown",
    note: `Unexpected status ${status}`,
  };
}

/**
 * Read-only auth probe: valid key returns 404, invalid key returns 401.
 */
async function pingEthitrustApi() {
  const key = config.ethitrust.apiKey;
  if (!key) {
    return { ok: false, code: "missing_key", message: "ETHITRUST_API_KEY not set" };
  }

  const url = `${config.ethitrust.baseUrl}/api/v1/org-escrows/${PROBE_ESCROW_ID}`;
  const headerName = config.ethitrust.apiKeyHeader || "X-API-Key";

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        [headerName]: key,
      },
    });

    let body;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        body = await res.json();
      } catch {
        body = null;
      }
    } else {
      body = await res.text();
    }

    const classification = classifyAuthProbe(res.status, body);
    const blockedHint = describeEthitrustBlock(res.status, body);

    return {
      ok: classification.ok,
      status: res.status,
      statusText: res.statusText,
      classification,
      blockedHint,
      body: typeof body === "string" ? body.slice(0, 200) : body,
    };
  } catch (err) {
    return {
      ok: false,
      code: "network_error",
      message: err.message,
    };
  }
}

async function ethitrustHealthHandler(req, res) {
  try {
    const snapshot = getEthitrustConfigSnapshot();
    const liveTest = await pingEthitrustApi();
    const healthy = snapshot.apiKeyPresent && liveTest.ok;

    logger.info(
      { snapshot, liveTestStatus: liveTest.status, liveTestOk: liveTest.ok },
      "Ethitrust health check"
    );

    return res.status(healthy ? 200 : 503).json({
      healthy,
      snapshot,
      liveTest,
    });
  } catch (error) {
    logger.error({ err: error.message }, "Ethitrust health check failed");
    return res.status(500).json({
      healthy: false,
      error: error.message,
      snapshot: getEthitrustConfigSnapshot(),
    });
  }
}

module.exports = {
  ethitrustHealthHandler,
  getEthitrustConfigSnapshot,
  pingEthitrustApi,
  classifyAuthProbe,
};
