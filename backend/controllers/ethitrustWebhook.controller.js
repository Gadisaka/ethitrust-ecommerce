const EscrowWebhookLog = require("../models/EscrowWebhookLog");
const EscrowEvent = require("../models/EscrowEvent");
const { verifyWebhookSignature } = require("../services/ethitrust");
const { processEscrowWebhook, deriveEventId } = require("../services/escrowWebhookHandler");
const logger = require("../utils/logger");

function sanitizeHeaders(headers) {
  const safe = { ...headers };
  delete safe.authorization;
  delete safe["x-api-key"];
  return safe;
}

/**
 * POST /webhooks/ethitrust — raw JSON body required for signature verification.
 */
async function handleEthitrustWebhook(req, res) {
  let webhookLog;

  try {
    const raw =
      Buffer.isBuffer(req.body) && req.body.length
        ? req.body
        : Buffer.from(
            typeof req.body === "string"
              ? req.body
              : JSON.stringify(req.body || {})
          );

    const sig =
      req.headers["x-signature"] || req.headers["X-Signature"];

    webhookLog = await EscrowWebhookLog.create({
      signature: sig ? "[redacted]" : undefined,
      headers: sanitizeHeaders(req.headers),
      payload: { rawLength: raw.length },
      verified: false,
      processed: false,
    });

    if (!verifyWebhookSignature(raw, sig)) {
      logger.warn({ webhookLogId: webhookLog._id }, "Invalid webhook signature");
      await EscrowWebhookLog.updateOne(
        { _id: webhookLog._id },
        { $set: { error: "Invalid signature", verified: false } }
      );
      return res.status(401).json({ message: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      await EscrowWebhookLog.updateOne(
        { _id: webhookLog._id },
        { $set: { error: "Invalid JSON body", verified: true } }
      );
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    const eventId = deriveEventId(payload, raw);
    await EscrowWebhookLog.updateOne(
      { _id: webhookLog._id },
      { $set: { payload, verified: true, eventId } }
    );

    const existingEvent = await EscrowEvent.findOne({
      eventId,
      processed: true,
    }).lean();
    if (existingEvent) {
      await EscrowWebhookLog.updateOne(
        { _id: webhookLog._id },
        { $set: { processed: true } }
      );
      return res.status(200).json({ received: true, duplicate: true });
    }

    res.status(200).json({ received: true });

    setImmediate(async () => {
      try {
        await processEscrowWebhook(payload, raw);
        await EscrowWebhookLog.updateOne(
          { _id: webhookLog._id },
          { $set: { processed: true } }
        );
      } catch (error) {
        logger.error(
          { err: error.message, eventId, webhookLogId: webhookLog._id },
          "Async webhook processing failed"
        );
        await EscrowWebhookLog.updateOne(
          { _id: webhookLog._id },
          { $set: { error: error.message } }
        );
      }
    });
  } catch (error) {
    logger.error({ err: error.message }, "Webhook handler error");
    if (webhookLog?._id) {
      await EscrowWebhookLog.updateOne(
        { _id: webhookLog._id },
        { $set: { error: error.message } }
      ).catch(() => {});
    }
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Webhook handler error", error: error.message });
    }
  }
}

module.exports = { handleEthitrustWebhook };
