# Dashboard Decisions

## Current state:

These decisions reflect the current shared Cartaisy direction and the dashboard issue scope. Dates are unknown/historical unless noted.

## Target state:

Use this file to record dashboard-relevant product and architecture decisions when they affect auth, tenancy, Shopify, onboarding, module editing, mobile contracts, release flow, or agent assumptions.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- This file is not an implementation proof. Verify each decision against current code before changing behavior.
- Add dated entries when future issues make or reverse decisions.

## Decisions:

### Dashboard must not bypass backend tenancy/security

- Date: unknown / historical.
- Decision: Dashboard behavior must not bypass backend tenancy, store ownership, security, or validation checks.
- Reason: Cartaisy is multi-tenant SaaS, and tenant isolation depends on backend-enforced ownership rules.
- Impact: Dashboard PRs touching auth, store context, Shopify, or module publishing require extra review and code verification.
- Related docs: `CARTAISY_CONTEXT.md`, backend repo `docs/cartaisy/README.md`.

### Dashboard frontend must not expose Shopify Admin/private credentials

- Date: unknown / historical.
- Decision: Shopify Admin tokens, private app credentials, and server-only secrets must not be exposed in frontend code.
- Reason: Shopify Admin access belongs in server-side/backend-controlled flows.
- Impact: Client components may call safe dashboard/backend endpoints, but must not embed private credentials.
- Related docs: `docs/ARCHITECTURE.md`, backend repo `docs/cartaisy/SHOPIFY_API_POLICY.md`.

### Store/module publishing must validate store-owned Shopify references through backend rules

- Date: unknown / historical.
- Decision: Store/module publishing must validate Shopify collection/product references as belonging to the active store through backend rules.
- Reason: Home modules can point at Shopify resources; cross-store references would be a tenant isolation bug.
- Impact: Dashboard should treat unverified reference validation as a known gap and avoid bypassing backend validation.
- Related docs: `docs/HOME_MODULE_EDITOR_CONTRACT.md`, backend repo `docs/cartaisy/TENANCY_MODEL.md`.

### Dashboard is not initially a full drag-and-drop no-code builder

- Date: unknown / historical.
- Decision: The MVP dashboard app-builder should focus on defined module types and ordering/visibility, not an unrestricted no-code builder.
- Reason: A constrained module system is easier to validate, render on mobile, and keep tenant-safe.
- Impact: New builder work should extend explicit module contracts instead of adding arbitrary unvalidated layout payloads.
- Related docs: `docs/HOME_MODULE_EDITOR_CONTRACT.md`, `docs/ARCHITECTURE.md`.

### Merchant onboarding should focus on MVP setup readiness

- Date: unknown / historical.
- Decision: Merchant onboarding should prioritize the steps needed to make a store ready for MVP: account, store setup, Shopify connection, branding, home modules, preview, and release handoff when available.
- Reason: Readiness is more valuable than a broad setup wizard that hides incomplete operational dependencies.
- Impact: Onboarding docs and UI should distinguish implemented steps from target steps.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`.

### New Shopify connects keep the access token on the backend only

- Date: 2026-09-23.
- Decision: For new merchant connects, the backend is the only owner of the Shopify Admin access token. The dashboard starts connect, reads status, disconnects, and triggers sync through the backend APIs. It does not exchange the OAuth code and does not persist `shopify.accessToken` (or the Storefront token) on the dashboard `Store`.
- Reason: Two writers of the same secret caused split connection state and blocked a simple connect flow. Parent epic: cartaisy-backend #152. Backend contract: cartaisy-backend #153 / PR #157 (merged). Dashboard issue: #15.
- Impact: Reconnect is the same connect call, not a second token path. The backend ignores a client `returnTo` and redirects only to `SHOPIFY_OAUTH_RETURN_URL`. Point that at `/dashboard/onboarding?step=connect` so new merchants return to the wizard. Settings understands the same `shopify` and `reason` query if the URL points there instead. Historical dashboard tokens are left in place until a separate migration. Shopify, auth, and store-ownership changes still need human review.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, backend `docs/cartaisy/SHOPIFY_API_POLICY.md`.

### Onboarding wizard does not store Shopify access tokens

- Date: 2026-09-23. Updated the same day after backend #157 merged.
- Decision: The post-signup wizard (`/dashboard/onboarding`) must not write Shopify access tokens into dashboard Mongo. Connect stays in `lib/onboarding/shopifyConnect.ts`. `liveRedirectEnabled` is true: Connect Shopify opens the backend authorize URL. The wizard shell (steps, chrome, branding, preview, ready) stays as dashboard #16 / PR #18. The ready step's build behavior is the later decision below; this decision no longer keeps the button from calling a build API.
- Reason: Dual token ownership is unsafe. The live return path is the merged backend callback plus `SHOPIFY_OAUTH_RETURN_URL`, not a second OAuth implementation.
- Impact: Settings connect is also backend-only and does not persist a dashboard token. New onboarding work must keep using the isolated client.

### Build my app v1 is a tracked request with polled status

- Date: 2026-09-23.
- Decision: The merchant Build my app screen submits a tracked request for Android, iOS, or both and shows live per-platform status. v1 does not start EAS, App Store Connect, or Play Console. Eligibility is `GET /api/v1/shopify/sync` `eligibleForBuild` plus a connected Shopify store. `shopify.lastSyncAt` is not success. `waiting_on_merchant` is shown as Waiting on Apple on iOS and Waiting on you on Android. The only checklist field is a short access note.
- Reason: Dashboard #17 and backend `docs/cartaisy/BUILD_REQUEST_API.md` (issue #155 / PR #159). Android can be ready while iOS is still waiting on Apple.
- Impact: The ready step calls `POST /api/v1/build-requests` and polls `GET /api/v1/build-requests/:id`. It does not call `PATCH /api/v1/admin/build-requests/:id/status`. Ineligible stores see Connect Shopify or Sync again instead of a successful submit. This is onboarding and a backend API contract; it does not change token storage.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issues: dashboard `#17`; backend `#154`, `#155`.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issues: dashboard `#15`, `#16`, `#17`; backend `#152`, `#153`.

### Unconnected merchants land in the setup guide

- Date: 2026-09-24.
- Decision: A store with no Shopify connection is sent to `/dashboard/onboarding` when the merchant signs in, or when an already signed-in merchant opens `/login` or `/signup`. Home stays available after that. A connected store is not redirected. The signal is `GET /api/v1/shopify/status` read with `normalizeConnectionStatus`, the same parser as the wizard. If status cannot be read, the merchant stays on Home. Exact `/dashboard` is the only dashboard path that redirects, and only on that auth entry. Other `/dashboard/*` URLs are left alone. Exit setup is not redirected back into the wizard.
- Reason: Login always opens `/dashboard`, and there is no stored "onboarding complete" flag. Shopify connection is the durable signal the wizard already trusts. Redirecting every later visit to Home would hide the checklist and loop with Exit setup.
- Impact: Middleware calls the backend status route with the existing session bearer token and does not read or write a Shopify access token. The dashboard shell and Home use that same connected/disconnected fact. Orders, customers, collections, analytics, and the app builder stay linked before connect; they are only visually quieter. Human review still applies because this changes where a session lands after login.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/ARCHITECTURE.md`, `docs/STATUS.md`.

### High-risk auth/store ownership/publishing changes require human review

- Date: unknown / historical.
- Decision: Changes to auth, store ownership, Shopify access, module validation, publishing, or release handoff require human review.
- Reason: These areas can create tenant isolation, credential exposure, or broken mobile-app behavior.
- Impact: Agents should keep PRs small, document assumptions, and avoid broad refactors in these areas without explicit issue scope.
- Related docs: `AGENTS.md`, `CARTAISY_CONTEXT.md`.

## Related docs/issues:

- Shared context: backend repo `docs/cartaisy/README.md`.
- Dashboard entrypoint: `CARTAISY_CONTEXT.md`.
- GitHub issue: `#2`.
