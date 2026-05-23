const Order = require("../models/Order");
const { generateOrderNumber } = require("../models/Order");
const logger = require("../utils/logger");

/**
 * Backfill orderNumber on legacy documents that have null/missing values.
 * Required when a unique index on orderNumber exists from an older schema.
 */
async function migrateOrderNumbers() {
  const missing = await Order.find({
    $or: [{ orderNumber: null }, { orderNumber: { $exists: false } }, { orderNumber: "" }],
  }).select("_id");

  if (missing.length === 0) return;

  logger.info({ count: missing.length }, "Backfilling missing orderNumber values");

  for (const doc of missing) {
    let assigned = false;
    let attempts = 0;
    while (!assigned && attempts < 5) {
      attempts += 1;
      try {
        await Order.updateOne(
          { _id: doc._id },
          { $set: { orderNumber: generateOrderNumber() } }
        );
        assigned = true;
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
    if (!assigned) {
      logger.error({ orderId: doc._id }, "Failed to assign orderNumber after retries");
    }
  }
}

module.exports = { migrateOrderNumbers };
