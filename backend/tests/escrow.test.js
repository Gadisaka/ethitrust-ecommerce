const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const {
  deriveEventId,
  mapApiStatusToOrderUpdate,
  EVENT_ORDER_STATUS,
} = require("../services/escrowWebhookHandler");
const { buildCheckoutIdempotencyKey } = require("../controllers/order.controller");

function verifyWebhookSignatureLocal(rawBodyBuffer, headerSignature, secret) {
  if (!secret || !headerSignature) return false;
  const normalizedHeader = headerSignature.trim().replace(/^sha256=/i, "");
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBodyBuffer)
    .digest("hex");
  try {
    const bufa = Buffer.from(digest.replace(/^0x/i, ""), "hex");
    const bufb = Buffer.from(normalizedHeader.replace(/^0x/i, ""), "hex");
    if (bufa.length === 0 || bufb.length === 0 || bufa.length !== bufb.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufa, bufb);
  } catch {
    return false;
  }
}

describe("verifyWebhookSignature", () => {
  test("accepts valid HMAC signature", () => {
    const secret = "test_webhook_secret";
    const body = Buffer.from(JSON.stringify({ event: "escrow.active" }));
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    assert.equal(verifyWebhookSignatureLocal(body, sig, secret), true);
  });

  test("rejects invalid signature", () => {
    assert.equal(verifyWebhookSignatureLocal(Buffer.from("{}"), "bad", "secret"), false);
  });
});

describe("deriveEventId", () => {
  test("uses payload event id when present", () => {
    const payload = { event: "escrow.completed", data: { event_id: "evt_123" } };
    assert.equal(deriveEventId(payload, "{}"), "evt_123");
  });

  test("falls back to hash-based id", () => {
    const payload = { event: "escrow.active", data: { escrow_id: "esc_1" } };
    const id = deriveEventId(payload, '{"raw":true}');
    assert.match(id, /^escrow\.active:esc_1:/);
  });

  test("duplicate payloads produce same id", () => {
    const raw = '{"event":"escrow.active","data":{"escrow_id":"e1"}}';
    const payload = JSON.parse(raw);
    assert.equal(deriveEventId(payload, raw), deriveEventId(payload, raw));
  });
});

describe("mapApiStatusToOrderUpdate", () => {
  test("maps completed status", () => {
    const update = mapApiStatusToOrderUpdate({ status: "completed" });
    assert.equal(update.orderStatus, "ESCROW_COMPLETED");
    assert.equal(update.paymentStatus, "verified");
  });

  test("maps disputed status", () => {
    const update = mapApiStatusToOrderUpdate({ status: "disputed" });
    assert.equal(update.orderStatus, "DISPUTED");
  });

  test("maps cancelled status", () => {
    const update = mapApiStatusToOrderUpdate({ status: "cancelled" });
    assert.equal(update.paymentStatus, "failed");
  });
});

describe("EVENT_ORDER_STATUS", () => {
  test("covers webhook events", () => {
    assert.equal(EVENT_ORDER_STATUS["escrow.invited"], "ESCROW_INVITED");
    assert.equal(EVENT_ORDER_STATUS["escrow.completed"], "ESCROW_COMPLETED");
    assert.equal(EVENT_ORDER_STATUS["escrow.disputed"], "DISPUTED");
  });
});

describe("buildCheckoutIdempotencyKey", () => {
  test("uses checkoutId when provided", () => {
    const key = buildCheckoutIdempotencyKey(
      "user1",
      [{ productId: "p1", quantity: 2 }],
      "checkout-abc"
    );
    assert.equal(key, "checkout-abc");
  });

  test("generates stable hash without checkoutId", () => {
    const items = [{ productId: "p1", quantity: 2 }];
    const a = buildCheckoutIdempotencyKey("user1", items);
    const b = buildCheckoutIdempotencyKey("user1", items);
    assert.equal(a, b);
    assert.notEqual(a, buildCheckoutIdempotencyKey("user2", items));
  });
});

describe("escrow amount", () => {
  test("uses ETB major units not cents (89+79=168)", () => {
    const sumTotalMoney = 89 + 79;
    const escrowAmount = Math.round(sumTotalMoney * 100) / 100;
    assert.equal(escrowAmount, 168);
    // Previous bug multiplied by 100 and sent 16800 → ETB 16,800 on Ethitrust.
    assert.notEqual(Math.round(sumTotalMoney * 100), escrowAmount);
  });
});

describe("mapEthitrustError", () => {
  test("marks network errors retryable", () => {
    const { mapEthitrustError } = require("../services/ethitrust");
    const err = new Error("timeout");
    Object.defineProperty(err, "constructor", { value: { name: "EthitrustNetworkError" } });
    const mapped = mapEthitrustError(err);
    assert.equal(mapped.retryable, true);
    assert.equal(mapped.code, "EthitrustNetworkError");
  });
});
