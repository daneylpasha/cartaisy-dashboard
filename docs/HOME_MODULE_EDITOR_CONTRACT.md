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
- As of 2026-09-29 the same document has a draft and a published snapshot. `draftSections` is the saved editor layout. `sections` is the order Publish writes, which is the list an installed app can read. `PUT /api/home-layout` writes the draft and does not replace `sections`. `POST /api/home-layout/publish` copies the editor sections into `sections` and `draftSections` and sets `publishedAt`. `GET /api/home-layout` does not create a document. A non-empty `sections` list with no `publishedAt` is already published. The first load or save sets `publishedAt` from that document's `updatedAt` and does not clear `sections`. A store with no saved sections is Not published yet. App Builder shows Not published yet, Published, or Draft. Build my app shows the same Not published yet or Draft status as a quiet strip and does not gate Build, install, or Submit on it. A published layout, or a failed layout read, leaves that strip off. Connected Home shows the same Not published yet, Published, or Draft status as one step on the Go live strip. Not published and Draft link to Publish home. A failed layout read is not marked published, and Home does not publish by itself. Unsaved editor changes are a draft and do not replace `sections`. The confirmation says the installed app reads this section order under the home header because Publish wrote `sections`. It does not claim the backend checks `publishedAt`. cartaisy-backend #199 does apply that check on `GET /customer/homescreen`. If every section is hidden, the confirmation says the default home stays because nothing is visible.
- `GET /api/public/home-feed` returns that `sections` list, including a legacy list that has no `publishedAt` yet. It returns `published: false` and empty `sections` and `layout` only when `sections` is empty and nothing has been published, and it does not include module documents in that case. Otherwise it returns visible sections that have active module documents, in the saved order. It does not fall back to `DEFAULT_SECTIONS`. Active module documents are read at request time, so an edit to an item inside an already published section is included on the next read. Order and visibility changes are not included until the next publish.
- **Invariant (as of 2026-07-28):** the app-builder page consumes that union directly instead of redeclaring a looser type of its own. `app/dashboard/app-builder/page.tsx` imports `IHomeLayoutSection` — as a type-only import, because that module instantiates a Mongoose model at module scope and a value import from a client component would pull mongoose into the browser bundle — and keys its `componentConfig` map as `Record<IHomeLayoutSection['type'], ...>`. Adding a module type to the model without adding its editor config, or removing one while the config still lists it, is therefore a `npm run type-check` failure rather than a silent `undefined` lookup at runtime. **A new module type must update both together, in the same change.**
- Unsupported stored types: a section whose `type` is absent from `componentConfig` renders a muted, dashed "Unsupported module" row naming the raw type, rather than rendering nothing. With the union now shared this is only reachable through legacy data or a direct database edit, but the runtime guard is deliberately retained for exactly that case, since TypeScript does not constrain what is already in MongoDB. The row is intentionally **draggable**: an unsupported section stays in `SortableContext` and in the `PUT /api/home-layout` payload regardless, so rendering nothing would leave the merchant holding a position in their own layout that they could neither see nor reorder. The editor does not offer to delete such a row — removing a section the dashboard cannot interpret is a support/data operation, not a merchant self-service action.
- `lib/services/preview.ts` builds homescreen preview payloads from active, store-scoped module documents.
- Shopify collection selection exists through `components/app-builder/CollectionSelector.tsx` and `/api/shopify/collections`. As of 2026-09-23 that route proxies to backend `GET /api/v1/shopify/collections` and does not read a dashboard Shopify access token. When the backend returns a collection GID, the proxy keeps the trailing numeric id so existing module `collectionId` values stay in the same shape. As of 2026-09-29, a reconnect or Shopify billing code on that response is shown as a catalog block. The picker does not look empty, and billing does not offer Sync again.
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
- Mobile rendering expectations are inferred from preview/mobile naming and must be verified in the mobile repo before being treated as implemented. The installed app reads backend `GET /customer/homescreen` (`layout` plus module arrays). As of cartaisy-backend #199, that route serves `HomeLayout.sections` only when the layout is live. An unpublished store (no document, or empty `sections` with no `publishedAt`) gets empty module arrays and `layout: []`. The installable app treats that as no published home and shows its smart default. Drafts in `draftSections` are not served, and active module documents are not returned until publish. A non-empty `sections` list with no `publishedAt` stays live. The first homescreen read may set `publishedAt` from `updatedAt` without rewriting `sections`. An empty layout no longer falls back to default sections plus active modules. If the dashboard and backend share the `homelayouts` collection, publish is the write that updates `sections`, a draft save does not, and a legacy non-empty `sections` list is left in place.
- `app/dashboard/app-builder/preview` is a module stack. It is not the shopper phone. It follows the draft section order and skips hidden sections. The caption states Not published yet, Draft, or Published, and does not call an unpublished stack a live home. The shopper opening screen, default home, product, and cart live on the setup preview (`components/onboarding/SmartHomePreview.tsx`). When a layout is published, the installed app should draw those modules under its own home header and replace the default home.
- Current app-builder behavior is not proof of final backend/mobile contract completeness.

## Related docs/issues:

- Architecture: `docs/ARCHITECTURE.md`.
- Status: `docs/STATUS.md`.
- Decisions: `docs/DECISIONS.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- GitHub issue: `#2`.
