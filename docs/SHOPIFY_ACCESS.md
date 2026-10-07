# Shopify access permissions

Founder-approved public wording is on `/docs/shopify` and the permissions FAQ. Both read `lib/marketing/offer.ts`. The public text lists five capability lines and the 16 technical names inside a disclosure. It does not say Shopify shows that list at install, and it does not say every permission is used.

Railway production `SHOPIFY_SCOPES` for cartaisy-backend was confirmed on 2026-10-07 via the Railway CLI. The exact value is these 16 scopes, comma-separated:

read_products,write_products,read_orders,write_orders,read_customers,read_inventory,write_inventory,read_locations,unauthenticated_read_product_listings,unauthenticated_read_product_inventory,unauthenticated_read_product_tags,unauthenticated_read_collection_listings,unauthenticated_write_checkouts,unauthenticated_read_checkouts,unauthenticated_write_customers,unauthenticated_read_customers

That string is the configured OAuth request. Live granted scopes on an installed shop were not re-queried. Older notes that named five scopes were incomplete.

Usage evidence for a later least-privilege review is in `docs/SHOPIFY_SCOPES_USAGE.md`.

Do not link a Shopify App Store listing as the way to buy Cartaisy. Signup stays invite-only. A public install that creates an account is not a working path. Claiming a store still requires a signed-in store admin.

Public pages must not name Railway or the `SHOPIFY_SCOPES` environment variable.
