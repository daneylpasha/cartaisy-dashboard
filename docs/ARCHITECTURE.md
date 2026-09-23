# Dashboard Architecture

## Current state:

- Framework/runtime: Next.js App Router, React, TypeScript, Tailwind CSS, Mongoose/MongoDB, and client/server fetch helpers. `package.json` lists Next `^16.1.4`, React `19.2.0`, Mongoose `^9.0.0`, NextAuth as a dependency, and an Orval-generated API client setup.
- App structure: public marketing/docs pages live under `app/`; authenticated dashboard routes live under `app/dashboard`; local Next API routes live under `app/api`; reusable UI lives under `components`; hooks live under `hooks`; API helpers, services, and auth helpers live under `lib`; data models live under `models`.
- Auth/session: middleware protects `/dashboard` routes based on a `cartaisy_token` cookie. `lib/auth/server.ts` verifies the token by calling the backend `/auth/profile` endpoint. Client auth helpers store tokens/user data through `lib/api/mutator/custom-instance.ts`.
- Store context: dashboard server routes generally read `session.user.storeId` and query/update store-scoped Mongoose models. Role helpers in `lib/utils/permissions.ts` distinguish `super_admin` and `admin` capabilities.
- API client flow: local dashboard routes use `fetch`, `getServerSession`, and Mongoose services. Shopify connect, status, disconnect, sync, and collection reads go to the backend through `NEXT_PUBLIC_API_URL` (`lib/api/shopifyConnection.ts` and the collections proxy). Generated/backend API calls use Orval with `lib/api/mutator/custom-instance.ts` and `NEXT_PUBLIC_API_URL`, defaulting to the production Railway backend URL. The dashboard does not exchange Shopify OAuth codes or store Admin access tokens for new connects.
- Merchant onboarding: `app/dashboard/admin/onboarding/page.tsx` lets hard-coded master admin emails manage onboarding tokens through `app/api/admin/onboarding-tokens/route.ts`; `/signup?token=...` validates the token through `app/api/auth/validate-token/route.ts`; signup creates a Store and first `super_admin` User through `app/api/auth/signup/route.ts`.
- Branding/theme configuration: settings show store info, Shopify connection, sync status, plan/usage, app settings, a logo upload section, and a primary/secondary color editor. `StoreLogoUpload` and `components/settings/StoreBrandingColors.tsx` both call the same backend branding endpoints (`GET`/`PATCH /admin/stores/:storeId/branding`) using `NEXT_PUBLIC_API_URL`, each fetching its own copy of branding data independently on mount rather than sharing state — see Known gaps. `StoreBrandingColors` reuses the existing `components/ui/color-picker.tsx` primitive (also used by the promo/callout/carousel forms) for hex input and validation. Store timezone/currency are shown as Shopify-synced values.
- Home module editor: `app/dashboard/app-builder` provides component management, section ordering/visibility, and homescreen preview. Component models include carousel, promo banners, callout banners, category grid, collection displays, collection showcases, category collection grid, and home layout ordering.
- Shopify collection/product picker: collection selection exists through `components/app-builder/CollectionSelector.tsx`, which calls `/api/shopify/collections`. That route proxies to backend `GET /api/v1/shopify/collections` and does not read a dashboard access token. Numeric collection ids are kept when the backend returns a Shopify GID. Product picker support was not identified.
- Build/release/status: a homescreen preview exists at `app/dashboard/app-builder/preview`. No dedicated app build request, app-store submission, release status, or publishing workflow was identified in the audited files.

## Target state:

- Dashboard should act as the merchant/admin UI while backend APIs enforce tenant-safe store ownership, Shopify API access, module reference validation, and publishing rules.
- Dashboard should keep server-only credentials and Shopify Admin/private credentials out of frontend code.
- Dashboard should use clear module contracts for home configuration so backend validation and mobile rendering stay compatible.
- Dashboard architecture docs should be updated when auth, tenancy, Shopify, app-builder, or release handoff behavior changes.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- The current repo includes local dashboard API routes and Mongoose models for store/module behavior; whether each route should remain dashboard-owned or move behind backend APIs needs product/security review.
- Shopify collection reads now use the backend store token. Explicit backend validation of store-owned Shopify references on home-module publish must still be verified before relying on it. Historical dashboard token documents are not migrated.
- Product picker behavior was not found during the audit.
- Build/release/status handoff was not found beyond preview/status copy in dashboard pages.
- `API_STRUCTURE.md` and `DEVELOPER_GUIDE.md` appear partly stale because they refer to older NextAuth/file names and do not reflect all current app-builder routes.
- Branding: `StoreBrandingColors` and `StoreLogoUpload` each fetch `/admin/stores/:storeId/branding` independently rather than sharing one request — a known, disclosed redundant-GET tradeoff, not yet consolidated. The backend `PATCH` on that endpoint only ever sets a color (a falsy/empty value is ignored, never treated as "clear to null"), so there is deliberately no clear-color affordance in the dashboard UI.

## Related docs/issues:

- Dashboard entrypoint: `CARTAISY_CONTEXT.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- Status snapshot: `docs/STATUS.md`.
- Home module contract: `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- Onboarding flow: `docs/DASHBOARD_ONBOARDING_FLOW.md`.
- GitHub issue: `#2`.
