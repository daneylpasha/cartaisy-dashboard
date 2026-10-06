# Shopify access permissions

Public marketing pages, including `/docs/shopify`, must not publish a Shopify scope list.

Railway production `SHOPIFY_SCOPES` for cartaisy-backend was confirmed on 2026-10-07 via the Railway CLI. The exact value is these 16 scopes, comma-separated:

read_products,write_products,read_orders,write_orders,read_customers,read_inventory,write_inventory,read_locations,unauthenticated_read_product_listings,unauthenticated_read_product_inventory,unauthenticated_read_product_tags,unauthenticated_read_collection_listings,unauthenticated_write_checkouts,unauthenticated_read_checkouts,unauthenticated_write_customers,unauthenticated_read_customers

The live permissions are whatever the Partner app requests at install, from that `SHOPIFY_SCOPES` setting on the Cartaisy backend. Older notes that named five scopes were incomplete.

Do not link a Shopify App Store listing as the way to buy Cartaisy. Signup stays invite-only. A public install that creates an account is not a working path. Claiming a store still requires a signed-in store admin.

Do not add scope names to a public page (`/docs/shopify`, FAQ, or any other public page) until a founder explicitly approves the public wording.
