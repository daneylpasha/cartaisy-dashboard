# Shopify scope usage evidence

Internal note for a later least-privilege review. This is not merchant copy.

Read-only audit on 2026-10-07. No OAuth install, no Railway write, and no secrets. Repos inspected:

- `daneylpasha/cartaisy-backend` @ `9e4c2b4e3e5e` (2026-10-02 UTC)
- `daneylpasha/Cartaisy` (mobile) @ `a3d3e7b00824` (2026-09-29 UTC)
- `daneylpasha/cartaisy-dashboard` @ `e59e874ee225` (2026-10-02 UTC), glance only

The list under review is the Railway production `SHOPIFY_SCOPES` value confirmed on 2026-10-07 and recorded in `docs/SHOPIFY_ACCESS.md`. It is the configured OAuth request (`process.env.SHOPIFY_SCOPES` in `shopifyOAuthService.getAuthorizationUrl`). It is not proof of granted install consent, not proof that each write is necessary, and not a Partner-app live grant list. Live granted scopes on an installed shop were not re-queried.

`.env.example` is a shorter older Admin-only subset and was not used as live capability evidence.

Mobile and the dashboard have no direct Shopify Admin or Storefront API clients. Cart and checkout calls go to the backend.

## Classification

| Scope | Classification | Evidence |
| --- | --- | --- |
| `read_products` | USED_READ | Admin `syncProducts`, `syncProduct`, `verifyShopifyStoreInfo`; Admin GraphQL `getProductMetafields` |
| `write_products` | CAPABILITY_ONLY | No Admin product create, update, or delete call site in the inspected backend `src/` |
| `read_orders` | USED_READ | `syncOrders` → `GET /orders.json` |
| `write_orders` | USED_WRITE | `createOrder` → `POST /orders.json`; draft-order REST and Admin GraphQL draft-order helpers. `updateOrderStatus` exists and had no caller |
| `read_customers` | USED_READ | `syncCustomers` → `GET /customers.json` |
| `read_inventory` | USED_READ | `fetchInventoryLevels` → `GET /inventory_levels.json` |
| `write_inventory` | USED_WRITE | `adjustInventory` and `updateInventory`. Order-driven adjust is used. A merchant manual inventory-set route was not found |
| `read_locations` | USED_READ | `GET /locations.json` before an inventory write when no location id is passed |
| `unauthenticated_read_product_listings` | USED_READ | Storefront product list, product, and search queries |
| `unauthenticated_read_product_inventory` | USED_READ | Those queries select `quantityAvailable`, `totalInventory`, and `availableForSale` |
| `unauthenticated_read_product_tags` | USED_READ | Those queries select `tags` |
| `unauthenticated_read_collection_listings` | USED_READ | Storefront collection queries |
| `unauthenticated_write_checkouts` | USED_WRITE | Storefront Cart API mutations (`cartCreate`, cart line changes, buyer identity, discount codes). No legacy `checkoutCreate` |
| `unauthenticated_read_checkouts` | USED_READ | `getCart` and `checkoutUrl` reads on the cart. Cart API, not legacy Checkout |
| `unauthenticated_write_customers` | CAPABILITY_ONLY | No Storefront customer create, update, or access-token mutation |
| `unauthenticated_read_customers` | CAPABILITY_ONLY | No Storefront customer query. Cart association only accepts a token the client already has |

## Unused write capability

`write_products` and `unauthenticated_write_customers` are configured and had no write call site in the inspected backend `src/`. Do not treat them as used.

`unauthenticated_read_customers` also had no read call site.

## Cart API and legacy checkout

Checkout-named scopes are mapped from Storefront Cart API call sites. Legacy `checkoutCreate` was not found. That mapping names the closest configured scopes. It does not prove Shopify labels every Cart operation under those scope strings on every API version.

## What this note does not claim

Configured Railway scopes are not the scopes granted on a live install, and they are not a finding that every scope is necessary. Shopify was not shown to display this list at install. No extra write justification is recorded for `write_products` or Storefront customer writes.
