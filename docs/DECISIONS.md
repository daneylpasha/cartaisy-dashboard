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
- Impact: The ready step calls `POST /api/v1/build-requests` and polls `GET /api/v1/build-requests/:id`. It does not call `PATCH /api/v1/admin/build-requests/:id/status`. Ineligible stores see Reconnect Shopify or Sync again instead of a successful submit. This is onboarding and a backend API contract; it does not change token storage.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issues: dashboard `#17`; backend `#154`, `#155`.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issues: dashboard `#15`, `#16`, `#17`; backend `#152`, `#153`.

### Unconnected merchants land in the setup guide

- Date: 2026-09-24.
- Decision: A store with no Shopify connection is sent to `/dashboard/onboarding` when the merchant signs in, or when an already signed-in merchant opens `/login` or `/signup`. Home stays available after that. A connected store is not redirected. The signal is `GET /api/v1/shopify/status` read with `normalizeConnectionStatus`, the same parser as the wizard. If status cannot be read, the merchant stays on Home. Exact `/dashboard` is the only dashboard path that redirects, and only on that auth entry. Other `/dashboard/*` URLs are left alone. Exit setup is not redirected back into the wizard.
- Reason: Login always opens `/dashboard`, and there is no stored "onboarding complete" flag. Shopify connection is the durable signal the wizard already trusts. Redirecting every later visit to Home would hide the checklist and loop with Exit setup.
- Impact: Middleware calls the backend status route with the existing session bearer token and does not read or write a Shopify access token. The dashboard shell and Home use that same connected/disconnected fact. Orders, customers, collections, analytics, and the app builder stay linked before connect. In the sidebar they sit behind an "After you connect" disclosure so a new merchant is not faced with a wall of empty tools. Opening the disclosure, or going to the URL directly, still works. Human review still applies because this changes where a session lands after login.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/ARCHITECTURE.md`, `docs/STATUS.md`.

### Login and signup use the setup wizard's calm card

- Date: 2026-09-24.
- Decision: `/login` and `/signup` share a centered card (about 440px) on the neutral `#f5f5f6` surface already used by the setup wizard. They use the existing shadcn card, input, and primary button. They do not stretch full-bleed, and they do not use a separate dark or purple marketing theme.
- Reason: The live invite signup page stretched to the browser width on a black shell, so the form and primary button looked unfinished against Cartaisy's calm, white-label chrome.
- Impact: Presentation only. Onboarding token validation, account creation, and sign-in behavior stay as they are. Invite fields remain locked when the token pre-fills them.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/ARCHITECTURE.md`.

### Continue with Google stays behind the invite

- Date: 2026-09-24.
- Decision: Login and invite signup may offer Continue with Google when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set. Signup still requires a valid onboarding token. The Google ID token is verified on the dashboard server, `email_verified` is required, and the Google email must equal the invite email. The new user is created like a password signup, with `authProvider: 'google'`, `googleSub`, and a random password that the existing bcrypt pre-save hook hashes. The browser then signs in through backend `POST /auth/google`, which returns the same session shape as `POST /auth/login`. If the client id is unset, the button is hidden.
- Reason: Merchants should be able to finish an invite without inventing a password, without opening signup to arbitrary Google accounts.
- Impact: Auth and the User model change. Password signup is unchanged. Backend `/auth/google` is a parallel contract (`idToken` in, login response out) and must be able to see the user this dashboard just created. Human review is required.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `.env.example`.

### After Shopify connect, the wizard shows sync and then Brand

- Date: 2026-09-24.
- Decision: A return to `/dashboard/onboarding` with `shopify=connected` shows the existing success copy, durable catalog sync (`GET /api/v1/shopify/sync`), and the product count from the overview snapshot already loaded for the wizard. If that status is idle or failed, the connect step calls `POST /api/v1/shopify/sync` once. HTTP 409 (`CATALOG_SYNC_IN_PROGRESS`) does not start a second sync; the step polls GET until the run is succeeded or failed. Continue to Brand stays available the whole time. `shopify=error` keeps using `shopifyReturnCopy` / `copyForReason`. After the copy is read, `shopify`, `reason`, `shop`, and a legacy `error` param are removed from the URL.
- Reason: Dashboard #25. The return previously rendered only error copy, so a successful connect looked unchanged and the catalog stayed idle until a later step.
- Impact: No Shopify access token is written, and build eligibility is unchanged. Branding can continue with the existing sync warning. This is onboarding and a Shopify API call, so it needs human review.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`, backend `docs/cartaisy/SHOPIFY_API_POLICY.md`.

### Preview shows synced products, not a sample catalog

- Date: 2026-09-24.
- Decision: The onboarding preview phone draws up to four real products after `GET /api/v1/shopify/sync` reports `succeeded`. The list is taken from the overview payload when that payload includes products. Otherwise the wizard calls `GET /api/v1/products?limit=4&sortBy=newest` with the signed-in store id (`X-Store-ID`). Tiles show title, image URL, and price when those fields exist. If sync has not succeeded, or the list is empty, the phone shows short copy. It does not draw placeholder product tiles, and it does not put a Cartaisy wordmark in the phone.
- Reason: Dashboard #27. Merchants were judging a home of grey boxes labeled Product, so a synced store did not look like their app.
- Impact: Counts on the connect and brand steps are unchanged. The extra product read uses the session store id because the merchant access token has a user id and not a store id. No Shopify Admin token is sent. This is onboarding and a catalog read, so it needs human review.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`.

### The build queue is platform ops, not store super_admin

- Date: 2026-09-24.
- Decision: `/dashboard/admin/build-requests` lists Build my app requests across stores and updates Android or iOS status. The sidebar shows the link only when `GET /api/v1/admin/build-requests` returns 200. A 403 replaces the queue with an empty state and does not render notes or store identity. Store-owner `super_admin` is not enough. The backend allows the call only when `User.isPlatformOperator` is true or the account's verified email is in `PLATFORM_OPS_EMAILS`.
- Reason: Dashboard #24 originally said any super admin. Backend #170 / PR #168 closed that before this UI shipped, because store registration creates owners as `super_admin`.
- Impact: Merchant Build my app screens are unchanged and still do not call the admin status route. The dashboard does not read `PLATFORM_OPS_EMAILS` and does not set `isPlatformOperator`. Profile responses do not include the flag, so the list call is the gate. Android `waiting_on_merchant` is labeled Waiting on merchant here; iOS stays Waiting on Apple. This is an authz boundary and a backend API contract. Human review is required.
- Related docs: `docs/ARCHITECTURE.md`, `docs/STATUS.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`. GitHub issues: dashboard `#24`; backend `#164`, `#170`.

### Sync again and Reconnect Shopify are one control

- Date: 2026-09-24.
- Decision: Connect, settings, and Build my app share one recovery control. Sync again calls `POST /api/v1/shopify/sync` when Shopify is connected and `eligibleForBuild` is false, and the control stays busy while status is `syncing`. Reconnect Shopify calls `POST /api/v1/shopify/oauth/connect` when the store is disconnected, and also when catalog sync already succeeded but `GET /api/v1/shopify/status` includes `webhookRegistrationError`. A healthy catalog may still offer Sync again as a quiet action. Build my app stays off until `eligibleForBuild` is true and Shopify is connected. The short failure is `errorSummary` or `webhookRegistrationError` after token-shaped text is dropped. The dashboard does not store a Shopify Admin token and does not ask the merchant to paste one. The settings page no longer shows the older `/stores/:id/admin/sync/status` card.
- Reason: Dashboard #33 (same ask as #31). Two peer buttons, and a sync card that was not the build gate, hid the recovery path.
- Impact: Shopify connect and the build gate. No new sync engine and no platform-ops queue work. Human review is required.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, backend `docs/cartaisy/SHOPIFY_API_POLICY.md`. GitHub issues: `#33`, `#31`.

### The onboarding phone is a white-label shopper home

- Date: 2026-09-24.
- Decision: The brand step and the preview step share `SmartHomePreview`. It draws the branding draft held in the wizard, so name, logo, icon, primary color, secondary color, and splash update in that render without a save or a reload. Inside the device there is no Cartaisy wordmark, logo, or marketing chrome. The wizard header outside the phone may still say Cartaisy. Synced products stay on the shelf when catalog sync has succeeded. The preview does not call Shopify and does not receive an Admin token.
- Reason: Dashboard #30. Merchants should see their own app while they edit the brand, not a second product brand inside the frame.
- Impact: Onboarding and branding presentation. Build my app and connect are unchanged. Icon and splash now persist with the brand; see the decision below.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issue: `#30`.

### App icon and splash persist with the brand

- Date: 2026-09-24.
- Decision: The brand step saves an app icon and a splash image with the rest of the brand. The shared phone shows the in-memory draft immediately, then the saved https URL after upload, the same way the logo already works. Upload tries `POST /admin/stores/:storeId/branding/icon` and `.../branding/splash` first. The live branding contract stores logo, primary color, and secondary color. When those asset routes are missing, the file uses the existing signed store-image upload and the https URL is stored on a store-scoped dashboard record. Reload prefers `iconUrl` or `appIconUrl` and `splashUrl` or `splashImageUrl` from the branding payload when they are present. Shopify Admin tokens are not written. Build my app shows the icon with the app name. It does not show the splash, because that screen did not already show one.
- Reason: Dashboard #35. Icon and splash were preview-only drafts, so a reload dropped them.
- Impact: Onboarding and branding. Connect, Sync again, and Reconnect are unchanged. This does not start an EAS build. Human review is required because the brand save path and a backend upload are involved.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issue: `#35`.

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
