const Order = require("../models/Order");
const { TERMINAL_ORDER_STATUSES } = require("../models/Order");
const { getEscrowDetail } = require("../services/ethitrust");
const { reconcileEscrowFromApi } = require("../services/escrowWebhookHandler");
const { config } = require("../config/env");
const logger = require("../utils/logger");

let syncInterval = null;

async function runEscrowSync() {
  if (!config.enableEscrow) return;

  const staleBefore = new Date(Date.now() - config.escrowSyncStaleMs);

  try {
    const staleOrders = await Order.find({
      paymentProvider: "ethitrust",
      ethitrustEscrowId: { $exists: true, $ne: null },
      orderStatus: { $nin: TERMINAL_ORDER_STATUSES },
      $or: [
        { escrowLastSyncedAt: { $exists: false } },
        { escrowLastSyncedAt: null },
        { escrowLastSyncedAt: { $lt: staleBefore } },
      ],
    })
      .select("ethitrustEscrowId escrowId")
      .limit(50);

    const escrowIds = [
      ...new Set(
        staleOrders
          .map((o) => o.ethitrustEscrowId || o.escrowId)
          .filter(Boolean)
      ),
    ];

    logger.info({ count: escrowIds.length }, "Escrow sync job running");

    for (const escrowId of escrowIds) {
      try {
        const detail = await getEscrowDetail(escrowId);
        await reconcileEscrowFromApi(escrowId, detail);
      } catch (err) {
        logger.error(
          { escrowId, err: err.message },
          "Escrow sync failed for escrow"
        );
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, "Escrow sync job error");
  }
}

function startEscrowSyncJob() {
  if (!config.enableEscrow) {
    logger.info("Escrow sync job disabled (ENABLE_ESCROW=false)");
    return;
  }

  if (syncInterval) return;

  const intervalMs = config.escrowSyncIntervalMs;
  logger.info({ intervalMs }, "Starting escrow sync job");

  setTimeout(() => {
    runEscrowSync();
  }, 30000);

  syncInterval = setInterval(runEscrowSync, intervalMs);
}

function stopEscrowSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

module.exports = { startEscrowSyncJob, stopEscrowSyncJob, runEscrowSync };
