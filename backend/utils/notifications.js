const logger = require("./logger");

/**
 * Lightweight notification hook — logs structured events for future email/push integration.
 * @param {{ type: string, userId?: string, orderId?: string, escrowId?: string, message: string }} params
 */
async function notify({ type, userId, orderId, escrowId, message }) {
  logger.info(
    {
      event: "notification",
      type,
      userId: userId ? String(userId) : undefined,
      orderId: orderId ? String(orderId) : undefined,
      escrowId: escrowId ? String(escrowId) : undefined,
    },
    message
  );
}

module.exports = { notify };
