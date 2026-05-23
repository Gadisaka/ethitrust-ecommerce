# Escrow Integration Audit (pre-upgrade)

Documented gaps found in the existing implementation before the production upgrade.

## Checkout (`order.controller.js` → `createOrdersWithEscrow`)

- **Idempotency**: Used `randomUUID()` per request — retries create duplicate escrows.
- **Inventory**: `Product.inStock` never validated during checkout.
- **API path**: axios service used `/v1/org-escrows`; official SDK uses `/api/v1/org-escrows`.
- **Rollback**: Orders created before escrow; partial rollback on failure only (no idempotent replay).

## Webhook (`ethitrustWebhook.controller.js`)

- **Dedup**: No `event_id` storage; duplicate deliveries re-write state.
- **Audit**: No webhook or event logs for debugging/replay.
- **Processing**: Inline controller logic; synchronous only; no structured logging.

## Data model (`Order.js`)

- **Lifecycle**: Free-text `escrowStatus`; no `orderStatus` enum for shipment/dispute.
- **Sync**: No `escrowLastSyncedAt` or terminal event timestamps.

## Frontend

- **Payment**: Escrow-only UI; no CBE/Telebirr secondary tab.
- **Orders**: Profile table omits escrow/payment status; no polling after checkout.
- **Store**: `orderStore` lacks escrow fields and polling helpers.

## Admin

- `admin.controller.js` `getAllOrders` uses legacy `Cart` model; frontend uses `/api/orders/getallorders` on `Order`.
- No escrow sync, webhook log inspection, or shipment endpoints.

## Resolved by this upgrade

See implementation in `services/ethitrust.js`, `escrowWebhookHandler.js`, extended models, admin endpoints, and frontend escrow UX.
