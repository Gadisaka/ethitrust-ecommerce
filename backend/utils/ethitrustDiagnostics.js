/**
 * Detect Cloudflare bot/challenge pages returned instead of Ethitrust JSON.
 */
function responseBodyToText(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

function isCloudflareChallenge(body) {
  const text = responseBodyToText(body);
  return (
    /Just a moment/i.test(text) ||
    /cf-browser-verification/i.test(text) ||
    /challenge-platform/i.test(text) ||
    /Enable JavaScript and cookies to continue/i.test(text)
  );
}

const CLOUDFLARE_BLOCK_MESSAGE =
  "Cloudflare is blocking server-to-server API calls from this host (HTML challenge page instead of Ethitrust JSON). Ask Ethitrust to bypass Cloudflare bot protection for /api/v1/* or allowlist cloud provider IPs (e.g. Render). Your API key and Render env vars are likely correct.";

function describeEthitrustBlock(status, body) {
  if (status === 401) {
    return "Ethitrust rejected the API key (401). Re-save ETHITRUST_API_KEY on the server.";
  }
  if (status === 403 && isCloudflareChallenge(body)) {
    return CLOUDFLARE_BLOCK_MESSAGE;
  }
  if (status === 403) {
    return "Ethitrust returned 403. Check GET /api/health/ethitrust on this server.";
  }
  return null;
}

module.exports = {
  isCloudflareChallenge,
  describeEthitrustBlock,
  CLOUDFLARE_BLOCK_MESSAGE,
  responseBodyToText,
};
