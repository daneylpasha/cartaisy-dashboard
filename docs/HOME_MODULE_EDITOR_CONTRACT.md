# Home Module Editor Contract

## Current state:

- The dashboard app-builder manages home module data through dashboard pages, local Next API routes, Mongoose models, and preview components.
- Current supported module types identified in code:
  - `carousel`
  - `promo_banners`
  - `callout_banners`
  - `category_grid`
  - `collection_displays`
  - `collection_showcases`
  - `category_collection_grid`
- `models/HomeLayout.ts` stores section order and visibility for the supported module types. `IHomeLayoutSection['type']` is the authoritative closed union of those seven values, and the Mongoose schema enforces the same set as an `enum` on write.
- **Invariant (as of 2026-07-28):** the app-builder page consumes that union directly instead of redeclaring a looser type of its own. `app/dashboard/app-builder/page.tsx` imports `IHomeLayoutSection` — as a type-only import, because that module instantiates a Mongoose model at module scope and a value import from a client component would pull mongoose into the browser bundle — and keys its `componentConfig` map as `Record<IHomeLayoutSection['type'], ...>`. Adding a module type to the model without adding its editor config, or removing one while the config still lists it, is therefore a `npm run type-check` failure rather than a silent `undefined` lookup at runtime. **A new module type must update both together, in the same change.**
- Known limitation at the editor layer: a stored section whose `type` is absent from `componentConfig` renders nothing and is invisible to the merchant, while still occupying a position in the saved layout order. With the union now shared this is only reachable through legacy data or a direct database edit, and the runtime guard is deliberately retained for exactly that case, since TypeScript does not constrain what is already in MongoDB. Showing a visible "unsupported module type" placeholder instead of nothing is a product decision that has not been taken; until it is, such a row can be neither seen nor managed in the editor.
- `lib/services/preview.ts` builds homescreen preview payloads from active, store-scoped module documents.
- Shopify collection selection exists through `components/app-builder/CollectionSelector.tsx` and `/api/shopify/collections`.
- Current payload assumptions include image URLs, titles/subtitles, CTA text, colors, positions/order, `isActive`, and Shopify `collectionId` references depending on module type.
- Current validation exists at several layers: route-level required field checks, Mongoose required fields/enums/max lengths, and role/store checks through sessions. Exact validation coverage varies by module and must be verified before changes.

## Target state:

- Backend responsibilities: enforce tenant-safe store ownership, validate Shopify collection/product references as owned by the active store, store validated module payloads, expose mobile-safe configuration, and guard publishing/draft/status transitions.
- Dashboard responsibilities: collect valid merchant input, call backend/dashboard APIs with the authenticated store context, show validation errors, preview mobile-compatible modules, and avoid exposing server-only credentials.
- Mobile responsibilities: render the published/mobile-safe home configuration according to the shared module contract and fail gracefully on unsupported modules.
- Target supported modules should stay explicit and typed. New module types should add docs, validation, preview behavior, and mobile rendering expectations together.
- Publishing/draft/status behavior should be explicit before agents or humans describe it as implemented.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- Product picker support was not identified; collection picker support was identified.
- Explicit backend validation of store-owned Shopify references must be verified before relying on it.
- Draft/publish/status behavior for home modules was not identified in audited dashboard files.
- Mobile rendering expectations are inferred from preview/mobile naming and must be verified in the mobile repo before being treated as implemented.
- Current app-builder behavior is not proof of final backend/mobile contract completeness.

## Related docs/issues:

- Architecture: `docs/ARCHITECTURE.md`.
- Status: `docs/STATUS.md`.
- Decisions: `docs/DECISIONS.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- GitHub issue: `#2`.
