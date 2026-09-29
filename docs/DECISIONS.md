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
- Decision: The brand step saves an app icon and a splash image with the rest of the brand. The shared phone shows the in-memory draft immediately, then the saved https URL after upload, the same way the logo already works. Upload tries `POST /admin/stores/:storeId/branding/icon` and `.../branding/splash` first. At the time of this decision the live branding contract stored logo, primary color, and secondary color. When those asset routes are missing, the file uses the existing signed store-image upload only when `canUpload` is true, then `POST /notifications/stores/:storeId/images/register` must succeed before the https URL is stored on a store-scoped dashboard record. Reload prefers `iconUrl` or `appIconUrl` and `splashUrl` or `splashImageUrl` from the branding payload when they are present. Shopify Admin tokens are not written. Build my app shows the icon with the app name. It does not show the splash, because that screen did not already show one. How a successful branding upload is saved is the 2026-09-28 decision.
- Reason: Dashboard #35. Icon and splash were preview-only drafts, so a reload dropped them.
- Impact: Onboarding and branding. Connect, Sync again, and Reconnect are unchanged. This does not start an EAS build. Human review is required because the brand save path and a backend upload are involved.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issue: `#35`.

### The cookie banner stays off the setup wizard

- Date: 2026-09-28.
- Decision: The first-party cookie banner is not rendered on `/dashboard/onboarding` or any nested wizard path, including `?step=brand`. Hiding it does not store a consent choice. The same banner still opens on every other route until the merchant chooses. Cookie Settings stays on the marketing footer and on `/cookies`.
- Reason: Dashboard #38. The banner is fixed to the bottom of the viewport and covered the live phone and the Brand card.
- Impact: Onboarding presentation only. Connect Shopify, Sync again, Reconnect, branding upload, and Build my app are unchanged. No Shopify token is involved.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issue: `#38`.

### Branding icon and splash are the saved app images

- Date: 2026-09-28.
- Decision: After backend branding stores an app icon and splash, those GET fields are the values on the brand form, the live phone, and the Build my app icon. `iconUrl` wins over `appIconUrl`, and `splashUrl` wins over `splashImageUrl`, when both are present. A successful `POST /admin/stores/:storeId/branding/icon` or `.../splash` response is the saved https URL. The wizard does not also require a dashboard `brandAssets` write for that path. Signed notification upload plus `brandAssets` runs only when that POST returns 404, 405, or 501. Dashboard `brandAssets` still fills an icon or splash that branding GET omitted. Connect, Sync again, and Reconnect are unchanged. The phone and Build my app markup are unchanged. Shopify Admin tokens are not written.
- Reason: Dashboard #37. Backend #173 / PR #175 now persists `iconUrl` and `splashUrl` on store branding and returns the read aliases. Reload and another device should follow that document, not a second dashboard copy written after every upload.
- Impact: Onboarding branding persistence. This does not start an EAS build and does not change connect or catalog recovery. Human review is required because the brand save path and the backend branding contract are involved.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issue: `#37`. Backend issues: `#173`, `#175`.

### Settings replaces icon and splash with the onboarding contract

- Date: 2026-09-28.
- Decision: Settings → Store Branding lets a connected merchant upload or replace the app icon and splash with the same helpers as the brand step. Prefer `POST /admin/stores/:storeId/branding/icon` and `.../branding/splash`. A successful response is the saved https URL and is not also written to dashboard `brandAssets`. Signed upload, `canUpload`, `POST /notifications/stores/:storeId/images/register`, and a `brandAssets` write run only when that POST returns 404, 405, or 501. Display prefers branding GET `iconUrl`/`appIconUrl` and `splashUrl`/`splashImageUrl`; `brandAssets` fills a field the branding payload omitted. The phone shows the in-memory draft immediately, then the saved https URL. The device screen has no Cartaisy chrome. Token-shaped and non-https URLs are dropped. No Shopify Admin token is written or logged.
- Reason: Dashboard #41. After onboarding, the merchant should be able to refresh those images without returning to the wizard.
- Impact: Branding/theme setup on `app/dashboard/settings`. Push, loyalty, analytics, and native EAS assets are unchanged. Human review is required because the brand save path and the backend branding contract are involved.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`. GitHub issue: `#41`.

### The ops build queue shows public icon and splash URLs

- Date: 2026-09-28.
- Decision: `/dashboard/admin/build-requests` shows each store's app icon and splash beside the existing name and shop domain. `store.appName`, `store.iconUrl`, and `store.splashUrl` on `GET /api/v1/admin/build-requests` are optional. A missing field renders an empty thumb. The dashboard does not invent a CDN URL. A copy control is shown only after `persistedBrandImageUrl` accepts the value as public https and not token-shaped. Embedded credentials and signed-upload or OAuth markers (`api_key`, `api_secret`, `client_secret`, `refresh_token`) are dropped as well. Splash copies as `SPLASH_IMAGE_URL=<url>`. The icon copies as that https URL alone. Thumbs have no Cartaisy chrome. Shopify Admin tokens are not rendered, logged, or copied.
- Reason: Dashboard #43. Operators need the merchant splash and icon when they set EAS env. Backend #177 / PR #178 adds those fields on the platform-ops list only, https-only, and does not start a build.
- Impact: Platform-ops queue presentation and the admin build-request contract. Merchant Build my app is unchanged and still does not show these copy controls. A status update keeps the URLs already on the row. Human review is required because this is a backend API contract and a release handoff surface. No Shopify token is read.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`. GitHub issue: `#43`. Backend issue: `#177`.

### Ops copies the icon as ICON_IMAGE_URL

- Date: 2026-09-28.
- Decision: On `/dashboard/admin/build-requests`, a public https icon copies as `ICON_IMAGE_URL=<url>`, the same assignment shape splash already uses for `SPLASH_IMAGE_URL=<url>`. The control is labeled `ICON_IMAGE_URL=…`. Copy is still offered only after `opsBrandImageUrl` accepts the value, which reuses `persistedBrandImageUrl`. Missing, non-https, and token-shaped icons stay an empty thumb with no copy control. The page does not start EAS. Merchant Build my app does not show these copy controls.
- Reason: Dashboard #45. Cartaisy mobile reads `ICON_IMAGE_URL` and `SPLASH_IMAGE_URL` at EAS build time. A bare icon URL is easy to paste into the wrong variable.
- Impact: Platform-ops clipboard only. No backend API change. Shopify Admin tokens are not rendered, logged, or copied. Human review is required because this is a release handoff surface.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#45`.

### Build my app shows icon and splash readiness without gating submit

- Date: 2026-09-28.
- Decision: The merchant Build my app screen shows a dense icon and splash strip above Platforms. A public https URL from the branding draft (or, if that screen is reused without a draft, from branding GET plus stored `brandAssets`) draws a thumb. Token-shaped, http, and blob values are dropped with `persistedBrandImageUrl` and count as not added. A missing asset uses calm copy and links to `/dashboard/onboarding?step=brand` and Settings Store Branding (`/dashboard/settings#store-branding`). Submit stays on the existing rule: Shopify connected and `GET /api/v1/shopify/sync` `eligibleForBuild`. This does not change backend `assertBuildEligible`, start EAS, or copy env URLs.
- Reason: Dashboard #46. Merchants can already request a build with no launcher assets. They should see that on the Build step. A hard gate would be a product change to eligibility.
- Impact: Onboarding ready step and the Build my app panel. Ops queue copy controls are unchanged. No Shopify token is rendered or logged.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`. GitHub issue: `#46`.

### Ops copies the merchant display name as APP_NAME

- Date: 2026-09-28.
- Decision: On `/dashboard/admin/build-requests`, a non-empty trimmed `store.appName` copies as `APP_NAME=<name>` with no extra quotes. The control is labeled `APP_NAME=…` and sits with the existing `ICON_IMAGE_URL=…` and `SPLASH_IMAGE_URL=…` controls. The same assignment helper writes all three. A missing, blank, or whitespace-only name is a calm empty state with no copy control. The queue does not invent a name and does not fall back to Cartaisy, the shop domain, or a store id. The page does not start EAS. Merchant Build my app does not show this control.
- Reason: Dashboard #49. Cartaisy mobile reads `APP_NAME` at EAS build time. Without it on the clipboard, a merchant launcher can ship as Cartaisy.
- Impact: Platform-ops clipboard only. No backend API change. Shopify Admin tokens are not rendered, logged, or copied. Human review is required because this is a release handoff surface.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#49`.

### Ops copies the merchant store id as EXPO_PUBLIC_STORE_ID

- Date: 2026-09-28.
- Decision: On `/dashboard/admin/build-requests`, a valid 24-character hex `store.id` copies as `EXPO_PUBLIC_STORE_ID=<id>` with no quotes. The control is labeled `EXPO_PUBLIC_STORE_ID=…` and sits with `APP_NAME=…`, `ICON_IMAGE_URL=…`, and `SPLASH_IMAGE_URL=…`. The same assignment helper writes it. The raw id is not the row title. A missing or invalid id is a calm empty state with no copy control. The queue does not invent an id and does not fall back to the build-request id, the shop domain, or the app name. The page does not start EAS. Merchant Build my app does not show this control.
- Reason: Dashboard #51. Cartaisy mobile reads `EXPO_PUBLIC_STORE_ID` at EAS build time. A wrong or missing store id ships a binary that cannot talk to the merchant tenant.
- Impact: Platform-ops clipboard only. `store.id` was already on `GET /api/v1/admin/build-requests` and is now kept on the ops view object for this copy. No backend API change. Shopify Admin tokens are not rendered, logged, or copied. Human review is required because this is a release handoff surface and a backend response field is now retained.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#51`.

### Build my app shows the display name without gating submit

- Date: 2026-09-28.
- Decision: The merchant Build my app strip also shows the app display name. A non-empty trimmed name from the branding draft is shown as itself. When that screen loads branding without a draft, the name is branding `appName`, then the store name the phone already uses (`GET /api/store` name, then the session store name). A missing, blank, or whitespace-only name uses calm copy and links to `/dashboard/onboarding?step=brand` and Settings Store Branding (`/dashboard/settings#store-branding`). The strip does not invent a name and does not fall back to Cartaisy, the shop domain, or a store id. Submit stays on the existing rule: Shopify connected and `GET /api/v1/shopify/sync` `eligibleForBuild`. This does not change backend `assertBuildEligible`, start EAS, or add ops clipboard controls.
- Reason: Dashboard #53. Ops can already copy `APP_NAME` (#49). A merchant can still request a build with a blank name, and that binary ships as Cartaisy unless ops invent one. The Build step should show that gap. A hard gate would be a product change to eligibility.
- Impact: Onboarding ready step and the Build my app strip. Submit eligibility and the ops queue are unchanged. No Shopify token is rendered or logged. Human review is required because this is the merchant-facing publishing name on the build screen.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#53`.

### Ops copies every launcher assignment as one EAS env block

- Date: 2026-09-28.
- Decision: On `/dashboard/admin/build-requests`, when at least one launcher assignment is copyable, a dense control labeled `Copy all EAS env` copies them as one multiline block. Order is `APP_NAME`, `ICON_IMAGE_URL`, `SPLASH_IMAGE_URL`, `EXPO_PUBLIC_STORE_ID`. Each line is `KEY=value` with no quotes and LF newlines. A line is included only when that field's single-copy control would be shown: a trimmed `store.appName`, a public https icon or splash from `opsBrandImageUrl` (`persistedBrandImageUrl`), and a 24-character hex `store.id`. Missing lines are omitted. If none qualify, the control is absent. The four single-field controls stay. The page does not start EAS, invent values, or fall back to Cartaisy, the shop domain, the build-request id, or placeholders. Merchant Build my app does not show this control. The shape matches the fictional handoff block in Cartaisy `docs/MOBILE_MERCHANT_PROVISIONING_RUNBOOK.md`.
- Reason: Dashboard #55. First-client EAS handoffs were four separate pastes. One block matches the runbook and reduces a missed variable.
- Impact: Platform-ops clipboard only. No new backend fields. Shopify Admin tokens are not rendered, logged, or copied. Human review is required because this is a release handoff surface.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#55`.

### The brand step shows a soft home-screen launcher mock

- Date: 2026-09-28.
- Decision: The brand step and Settings → Store Branding show a compact home-screen mock under the live phone. When the icon is public https, or a blob draft the phone already shows, and the display name is non-empty after trim, the mock draws a rounded icon and that name. The name uses `launcherDisplayName`. The icon reuses `displayBrandImageUrl`, then keeps only https and blob. Token-shaped and other non-https URLs are dropped. If the icon or the name is missing, the mock shows a silhouette and the real name when one is present, plus the same Brand and Store Branding links as the Build readiness strip. It does not invent a name or icon and does not fall back to Cartaisy, the shop domain, or a store id. Settings no longer writes the placeholder "Your app" into the branding draft. The in-app phone still uses that placeholder inside `SmartHomePreview` when the name is blank. Save, Continue, and Build submit are unchanged. The preview step does not show this mock. `SmartHomePreview` is unchanged.
- Reason: Dashboard #56. Merchants can see the in-app home and the Build strip, but not how the icon and name sit on a phone home screen.
- Impact: Onboarding brand step and Settings Store Branding presentation. No backend change, no EAS, and no eligibility change. Shopify Admin tokens are not rendered or logged. Human review is required because this is branding presentation on the onboarding path.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#56`.

### The brand step shows a soft splash boot mock

- Date: 2026-09-28.
- Decision: The brand step and Settings → Store Branding show a compact splash boot mock under the soft home-screen mock. When the splash is public https, or a blob draft the phone already shows, the mock draws that image full-bleed in a small rounded frame. The trimmed display name is captioned only when it is non-empty, using `launcherDisplayName`. The splash reuses `displayBrandImageUrl`, then keeps only https and blob. Token-shaped and other non-https URLs are dropped. If the splash is missing, the mock shows a blank frame and the same Brand and Store Branding links as the Build readiness strip and the home-screen mock. It does not invent a splash and does not fall back to Cartaisy, the shop domain, a store id, or the logo or icon. Save, Continue, and Build submit are unchanged. The preview step does not show this mock. `SmartHomePreview` and `HomeScreenLauncherMock` are unchanged.
- Reason: Dashboard #59. Merchants can see the in-app home and the home-screen icon, but not the first-open splash that ops ships as `SPLASH_IMAGE_URL`.
- Impact: Onboarding brand step and Settings Store Branding presentation. No backend change, no EAS, and no eligibility change. Shopify Admin tokens are not rendered or logged. Human review is required because this is branding presentation on the onboarding path.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#59`.

### Ready builds hand off with an Expo install link

- Date: 2026-09-28.
- Decision: When a build platform is `ready`, the merchant install handoff is an Expo or EAS artifact link stored as `platforms.android.installUrl` or `platforms.ios.installUrl` (`string | null`). Build my app shows Install Android build or Install iOS build only when that platform is `ready` and the value is a non-empty https URL with no credentials and no token-shaped text. The link opens in a new tab with `rel="noopener noreferrer"`. A ready platform without that URL keeps the Ready label and does not render a button. The screen does not invent a URL. On `/dashboard/admin/build-requests`, ops paste the link beside the platform status. Save sends it on `PATCH /api/v1/admin/build-requests/:id/status` as `{ "<platform>": { "status", "installUrl" } }`. `installUrl: null` clears it. Omitting `installUrl` leaves the stored value unchanged. The dashboard only sends https links on `expo.dev`, `expo.io`, or a subdomain (including `u.expo.dev`). The queue shows the current link. This does not start EAS, add TestFlight or APK delivery, or change build eligibility.
- Reason: Dashboard #61. Product decision on 2026-09-28: a ready build is handed to the merchant as an Expo/EAS link. The field is cartaisy-backend #179. Until that API is deployed, a missing `installUrl` stays null and a status update that omits it is unchanged.
- Impact: Merchant Build my app and the platform-ops queue. Backend API contract. No Shopify token is rendered, logged, or sent. Human review is required because this is a release handoff and a backend status PATCH.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#61`. Backend issue: cartaisy-backend `#179`.

### Build my app shows live per-platform progress

- Date: 2026-09-28.
- Decision: While a requested platform is `queued`, `building`, `waiting_on_merchant`, or `unknown`, Build my app keeps polling `GET /api/v1/build-requests/:id` and also refreshes that request when the browser tab becomes visible. Each platform is its own card. Queued, building, and ready share a three-step rail. Failed says the build did not finish and does not show logs, tooling names, or ids. Install Android build and Install iOS build still appear only when that platform is `ready` and `installUrl` is a safe https URL. A ready platform without that URL says the link will show here when it is available. A request that stays queued keeps the same poll. `/dashboard/admin/build-requests` still pastes and clears the install link. The merchant screen does not mention that queue.
- Reason: Dashboard #64. Auto dispatch can move a request from queued to building to ready. When dispatch is not configured, the request stays queued and ops paste remains the handoff.
- Impact: Merchant Build my app presentation and the existing status poll. No new client secret. The admin status PATCH is unchanged. Human review is required because this is the release handoff the merchant watches.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#64`.

### Merchants connect their own Apple and Google Play credentials

- Date: 2026-09-28.
- Decision: Build my app and Settings → Build setup let a store admin connect that store's App Store Connect API key and Google Play service account. The dashboard sends multipart `POST /api/v1/store-credentials/apple` (`keyId`, `issuerId`, `.p8` file) and `POST /api/v1/store-credentials/google` (`serviceAccount` JSON file), then reads `GET /api/v1/store-credentials`. After save the screen shows only safe metadata: Apple key id last 4, issuer id last 4, and the Google client email. Disconnect is `DELETE` for one platform. `needsAttention` asks for the file again. The private key is not rendered, logged, or put in an error message. Preview, Build my app, and Expo install links stay available when credentials are missing. This decision does not call the platform-operator credential read and does not change build eligibility. Store submit was added in the 2026-09-28 decision below.
- Reason: Dashboard #63. Store owners connect their own Apple Developer and Google Play accounts. Backend storage is cartaisy-backend #185 / PR #186.
- Impact: Merchant Build my app and Settings. Backend API contract for encrypted store credentials. No Shopify token is rendered or sent. Human review is required because this is a credential upload and a backend contract.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#63`. Backend issue: cartaisy-backend `#185`.

### Merchants submit a finished build with their own store account

- Date: 2026-09-28.
- Decision: When a requested platform is `ready` and that platform's store credential is `connected`, Build my app and Settings → Build setup show Submit to App Store (iOS) or Submit to Play (Android). The dashboard posts `{ "platform": "ios" | "android" }` to `POST /api/v1/build-requests/:id/submits` and polls `GET /api/v1/build-requests/:id/submits/:platform` every few seconds while the job is `queued` or `submitting`. The store is the authenticated store. A platform that is not ready disables only that submit control and explains why. A missing or needs-attention credential on a ready platform uses the Connect path from the 2026-09-29 decision. Preview, Build my app, and Expo install links stay available. After `submitted`, the screen says App Store Connect or Play Console may still need review, and Android names the internal testing track. `failed` shows the safe message and can be started again. `SUBMIT_ALREADY_IN_PROGRESS` continues the in-flight job. Private keys, service-account JSON, Expo tokens, and submit ids are not rendered or logged.
- Reason: Dashboard #67. Store owners submit with the accounts they connected in #63. Backend submit is cartaisy-backend #187 / PR #189.
- Impact: Merchant Build my app and Settings → Build setup. Backend API contract for store submit. No Shopify token and no store private key is rendered or sent from the browser. Human review is required because this is the release handoff and a backend contract.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#67`. Backend issue: cartaisy-backend `#187`.

### The shopper phone follows the installable app chrome

- Date: 2026-09-28.
- Decision: The brand step, the preview step, and Settings → Store Branding share one phone that follows the shopper app screens read from the Cartaisy mobile repo: opening splash (`app/splash.tsx`), default home (`HomeHeader`, `DefaultHome`, `DEFAULT_HOME_COPY`), tabs Home / Cart / Wishlist / Account (`app/(tabs)/_layout.tsx`), product header with Add to Cart, Buy Now, and the hosted-checkout note, and the cart header, line, subtotal, and Proceed to Checkout. Splash is the opening screen. It is not a cover on the home header. The header mark is the logo, then the icon, then the name, then a quiet monogram. A blank name uses Welcome on the hero. The phone does not invent "Your app". Copy lives in `lib/onboarding/shopperChrome.ts`. The caption states the limits that remain: the phone is a still, the installable app shows the published home or this smart default until Publish, module-stack edits stay off the device until then, collection cards are names only because this snapshot has no collection images, and favorites, wishlist, account, and checkout open in the installed app. The cart row uses the first synced product at quantity one so the line is visible, and the caption says a shopper cart starts empty. `/dashboard/app-builder/preview` stays a module stack and says so, instead of claiming to be the customer app. No Shopify token is rendered. Build my app, credential connect, and install links are unchanged.
- Reason: Dashboard #69. A phone that used a different header, a splash cover, and Home / Search / Bag sold a layout the installable app does not ship.
- Impact: Onboarding and Settings branding presentation, and the app-builder preview label. Human review is required because this is the merchant-facing shopper preview on the onboarding path.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`. GitHub issue: `#69`.

### Merchants reset a password from the same auth card

- Date: 2026-09-28.
- Decision: `/login` links to `/forgot-password`. That page posts `{ email }` to backend `POST /api/v1/auth/forgot-password` and always shows "If an account exists with this email, you will receive a password reset link shortly." It does not say whether the email exists or whether the account is Google-only. The same page tells every merchant that Google sign-in stays on Continue with Google. `/reset-password` reads `token` from the query. The value must be 64 hex characters or the page shows an invalid or expired link, with links to request a new one and to sign in. The form checks that the new password and the confirmation match, and that the password is 6 to 128 characters with a letter and a number. The API body is `{ token, newPassword }` only. On success the dashboard stores `data.token` and `data.refreshToken` with `tokenStorage.setTokens`, loads the profile, and opens `/dashboard`. Middleware treats a `/dashboard` visit referred by `/reset-password` like a visit from login, so a disconnected store still enters the setup wizard. `/forgot-password` and `/reset-password` are not middleware auth routes, so a signed-in merchant is not bounced away from the email link. The raw reset token and the new password are not rendered, toasted, logged, or left on the URL after submit.
- Reason: Dashboard #68. Password login had no recovery. Backend forgot/reset is cartaisy-backend #188 / PR #190. Auto-login matches the login session instead of asking for the password again.
- Impact: Auth/session only. Login, invite signup, Google sign-in, store ownership, and Shopify are unchanged. Human review is required because this stores a new session after a password change.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#68`. Backend issue: cartaisy-backend `#188`.

### Shopify billing is not a sync retry

- Date: 2026-09-29.
- Decision: Overview, Settings sync, onboarding catalog sync, Build my app, Collections, and the collection picker read a structured Shopify failure before they show an empty catalog. `shopify_reconnect_required` uses the existing Reconnect Shopify action (`POST /api/v1/shopify/oauth/connect`). `shopify_payment_required` and `shopify_store_billing_required` say the Shopify plan needs attention. HTTP 402 and a "Payment Required" summary are accepted until cartaisy-backend #194 settles on one code. Billing does not offer Sync again and does not auto-start a sync. Reconnect on that state is secondary. Build my app stays off while either block is on the catalog snapshot. The dashboard does not show tokens or raw Shopify bodies.
- Reason: Dashboard #75. A store on Shopify Payment Required, or a token that must be reconnected, was a generic error or an empty catalog.
- Impact: Shopify catalog presentation and the build gate while a live catalog read is blocked. Backend eligibility fields are unchanged. Human review is required because this is Shopify recovery and it keeps Build my app off during the block.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`. GitHub issue: `#75`. Backend issue: cartaisy-backend `#194`.

### A ready Expo install is the preview

- Date: 2026-09-29.
- Decision: Once a platform is `ready` and `installUrl` is a public https URL with no credentials and no token-shaped text, that URL is the authentic preview. Build my app draws a large QR in the browser from that URL only (`qrcode`), above the platform cards, and keeps Install, the URL as text, and Copy link. Building, missing, and unsafe URLs get no QR. The page does not call a QR image host and does not add an Expo token. On Brand, Preview, and Settings, the light phone (and the home-screen and splash mocks on Brand and Settings) stays only while no ready install URL exists, including when the build list fails. While that list is loading, the phone is not shown, including over an install already on screen. When at least one ready install URL exists, those screens show a compact QR for each and Open Build instead of the phone. Branding editors stay. `/dashboard/app-builder/preview` stays a module stack.
- Reason: Product decision on 2026-09-29 (Daniyal): an Expo/EAS install QR is the real app once a build is ready. The phone mock is a wait state for colors, icon, and splash. Dashboard #76 and #77.
- Impact: Merchant Build my app, the brand step, the preview step, and Settings Store Branding. No new backend field. No Shopify token and no Expo token is rendered or sent. Human review is required because this is the merchant-facing install handoff and the branding preview.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issues: `#76`, `#77`.

### Build my app holds the install-code row before the URL exists

- Date: 2026-09-29.
- Decision: On Build my app, each platform that is `queued`, `building`, `ready` without a public https `installUrl`, or still unrecognized keeps a card in the install-code row above the progress cards. The card uses the same frame as the code and says a scannable install code will appear when the preview is ready. It does not draw a code, invent a URL, or call a QR host. When a public https URL arrives, that card becomes the code, the URL as text, and Copy link. The row stays, so the progress cards do not jump down from an empty gap. A platform that is `failed`, `not_requested`, or `waiting_on_merchant` does not take a slot in that row. The queued, building, and ready progress rail stays. Brand, Preview, and Settings still hide the phone mock only under the rules from the 2026-09-29 install-preview decision.
- Reason: Dashboard #80. Before the install URL existed, that row was absent, so the code appearing later pushed the page. Merchants need to see that scanning comes next.
- Impact: Merchant Build my app presentation. No backend field. No Shopify token and no Expo token is rendered or sent. Human review is required because this is the merchant-facing install handoff.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#80`.

### Home shows Scan to install when a build is ready

- Date: 2026-09-29.
- Decision: Home for a connected store (`/dashboard`) shows a quiet card when `GET /api/v1/build-requests` includes at least one platform that is `ready` and `installUrl` is a public https URL with no credentials and no token-shaped text. The card says Scan to install, draws a compact code for each such platform, and links to Build (`/dashboard/onboarding?step=ready`) for the larger code. A list with no ready public URL, a failed list, and the disconnected setup checklist do not show the card. The card does not invent a URL, call a QR host, or add an Expo token. Build my app stays the large code, including the wait frame before that URL exists. Brand, Preview, and Settings still hide the phone mock only under the 2026-09-29 install-preview rules. As of 2026-09-29 (dashboard #96), connected Home folds this into the Go live strip. The separate card is no longer shown.
- Reason: Dashboard #82. Merchants land on Home after login and were missing the install handoff that already lives on Build.
- Impact: Connected Home presentation. No backend field. No Shopify token and no Expo token is rendered or sent. Human review is required because this is the merchant-facing install handoff.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#82`.

### Home shows a calm card while the preview is building

- Date: 2026-09-29.
- Decision: Home for a connected store shows a quiet card when the newest build request is `queued` or `building` and `GET /api/v1/build-requests` has no ready public https `installUrl`. The newest request is the first list item, the same one Build my app opens. The card says the preview is building and links to Build (`/dashboard/onboarding?step=ready`) for progress and the install-code wait frame. It does not draw a code, invent a URL, or name the build tooling. If any platform on the list is `ready` with a public https install URL, Home keeps Scan to install and does not show this card. A newest request that is failed, waiting on the merchant, ready without a public URL, or unrecognized does not show it. A Shopify reconnect or billing notice on Home does not show it, and those notices stay as they are. The disconnected setup checklist does not show it. A failed list does not show it. As of 2026-09-29 (dashboard #96), connected Home folds this into the Go live strip. The separate card is no longer shown.
- Reason: Dashboard #84. After Build my app, merchants land on Home while platforms are still queued or building and saw no sign that a preview had started.
- Impact: Connected Home presentation. No backend field. No Shopify token and no Expo token is rendered or sent. Build wait and QR UI are unchanged. Human review is required because this is the merchant-facing install handoff.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#84`.

### A finished store submit says what happens next

- Date: 2026-09-29.
- Decision: When a store submit is `submitted`, Build my app and Settings → Build setup show a confirmation on that platform card: sent to App Store Connect or Google Play, that the store may still review it, where to look (App Store Connect or Play Console), and a plain review-time note. Android still names the internal testing track. The screen does not invent a store URL. `failed` shows a short title and the safe `message`, or the fixed fallback, and Submit again. `queued` and `submitting` stay a quiet status on that card. Home, for a connected store, shows the same notes for the focused build request (an in-flight build, otherwise the first in the list) when that request has a submit that is `queued`, `submitting`, `submitted`, or `failed`, and links to Build. Home does not start a submit. If that submit list fails, the Home card stays off. No private key, service-account JSON, Expo token, or submit id is rendered. As of 2026-09-29 (dashboard #96), connected Home folds the Home notes into the Go live submit step. Build my app and Settings keep this confirmation. The separate Home card is no longer shown.
- Reason: Dashboard #85. After submit, the status line was easy to miss and did not say where to check the review.
- Impact: Merchant Build my app, Settings → Build setup, and connected Home presentation. No new backend field. No Shopify token and no store private key is rendered or sent. Human review is required because this is the release handoff the merchant reads after submit.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#85`.

### A ready build without store credentials offers Connect

- Date: 2026-09-29.
- Decision: When a requested platform is `ready` and that platform's store credential is `missing` or `needsAttention`, Build my app and Settings → Build setup replace the submit button with Connect Apple Developer (iOS) or Connect Google Play (Android). The title, a short next step, and a primary link open the existing credential card on the same page (`#apple-store-account` or `#google-store-account`). That card is the existing `GET`/`POST`/`DELETE /api/v1/store-credentials` form. When the credential is `connected`, Submit to App Store or Submit to Play and the submitted, failed, and in-progress states stay as they are. A platform that is not ready still explains that the build must finish and does not offer Connect in place of that note. An in-progress submit stays the progress state. Preview, Build my app, and install links stay available. The screen does not render private keys, service-account JSON, Expo tokens, submit ids, or an invented App Store or Play Console URL.
- Reason: Dashboard #88. A disabled submit was a dead end after a preview build when the store account was not connected yet.
- Impact: Merchant Build my app and Settings → Build setup presentation. No new credential API and no EAS Submit change. Human review is required because this is the release handoff next to store credentials.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#88`.

### App Builder publish is a snapshot on the existing home layout

- Date: 2026-09-29.
- Decision: Publish home is an explicit action on the dashboard `HomeLayout` document. The editor draft is `draftSections` plus any unsaved order or visibility changes. Publish writes `sections` and sets `publishedAt`. `PUT /api/home-layout` saves the draft and does not replace `sections`. `POST /api/home-layout/publish` copies the current editor sections into `sections` and `draftSections` and sets `publishedAt`. Opening App Builder does not insert a document. A non-empty `sections` list with no `publishedAt` stays published, because that list was live when save wrote `sections` directly. The first load or save sets `publishedAt` from `updatedAt` and does not clear `sections`. `GET /api/public/home-feed` returns an empty layout only when `sections` is empty and nothing has been published. The confirmation says the installed app reads this section order under the home header because Publish wrote `sections` and a draft no longer overwrites it. It does not claim the backend reads `publishedAt`. Hidden-only publishes say the default home stays because nothing is visible. No backend field was added. Updated the same day so pre-publish layouts are not labeled unpublished.
- Reason: Dashboard #90. Save wrote the only layout and the public feed also served default sections when the merchant had not published. There was no draft versus live state.
- Impact: App Builder, the module-stack preview, and `GET /api/public/home-feed`. As of cartaisy-backend #199, `GET /customer/homescreen` follows the same live check: an unpublished store gets an empty layout and the installable app shows its smart default, and drafts are not served. A legacy non-empty `sections` list stays live. If both databases share `homelayouts`, draft saves no longer overwrite `sections`, and a legacy `sections` list is not cleared. Module item create and edit are unchanged. No Shopify token is rendered or stored. Human review is required because this is home-module publishing.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`, `docs/TESTING.md`. GitHub issue: `#90`.

### Connected Home and the shopper phone state the publish gate

- Date: 2026-09-29.
- Decision: Connected Home reads `GET /api/home-layout` and shows Not published yet, Published, or Draft with the same status App Builder uses. Not published and Draft link to `/dashboard/app-builder#publish-home`. A failed or unrecognized response omits the status. The Brand and Preview phone caption says the installable app shows the published home, or the smart default until Publish, and that module-stack edits stay off the device until then. That matches cartaisy-backend #199. As of 2026-09-29 (dashboard #96), connected Home folds this into the Go live strip. The separate card is no longer shown.
- Reason: Dashboard #92. Merchants could brand, arrange App Builder, and build without seeing that Publish home is what reaches the installable app.
- Impact: Connected Home, and the phone caption on Brand, Preview, and Settings. No new module type, no Unpublish control, and no Shopify token. Human review is required because this is home-module publishing.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#92`.

### Build my app nudges Publish home and does not gate on it

- Date: 2026-09-29.
- Decision: Build my app reads `GET /api/home-layout` with the same helper Connected Home uses. Not published yet and Draft show a quiet strip, in the same visual language as the app name, icon, and splash strip, with that status and a link to `/dashboard/app-builder#publish-home`. Published leaves the strip off. A failed or unrecognized read leaves the strip off and does not invent a status. The strip does not disable Build, install codes, or Submit. Settings → Build setup is the store-credential and submit panel. It does not render the Build panel, so it does not show this strip.
- Reason: Dashboard #94. Merchants could request a build and install while the app still showed the smart default or the last published layout.
- Impact: Merchant Build my app on `/dashboard/onboarding?step=ready`. No eligibility change, no Unpublish, and no Shopify token. Human review is required because this sits on the release handoff next to home-module publishing.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#94`.

### Connected Home uses one Go live strip

- Date: 2026-09-29.
- Decision: Connected Home (`/dashboard` for a Shopify-connected store) shows one Go live strip and no longer shows separate Scan to install, preview-building, home-layout, or submit cards. The steps reuse existing reads: Shopify connected versus reconnect or billing, catalog sync with the build-eligibility contract, branding GET for a display name and https icon, `GET /api/home-layout` for Published / Not published yet / Draft, build requests for a ready public install URL versus building versus none, `GET /api/v1/store-credentials` for Apple and Google, and the focused build's submit list. The first required step that is not done is the only filled action. Store accounts stay visible and never take that action. Completed steps stay quiet. A failed read degrades that step and is not marked done. Not published and Draft link to `/dashboard/app-builder#publish-home`, and Home does not show a second Publish home button. A ready public https URL keeps a compact code inside the preview step. Billing and reconnect stay the safety notice and do not add another filled action. The disconnected setup checklist is unchanged. No new backend field. No token is rendered.
- Reason: Dashboard #96. Connect, sync, brand, preview, publish, build, and submit were already on the product, but a connected merchant had to stitch them together from separate cards.
- Impact: Connected Home presentation. Build my app, App Builder publish, and the disconnected checklist stay. Human review is required because this sits next to Shopify recovery, home publish, and the release handoff. It does not change auth, store ownership, the publish write, or Build eligibility.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#96`.

### A missing install shows first-build steps, not a phone

- Date: 2026-09-29.
- Decision: Brand, Preview, and Settings do not show the branding phone, the home-screen mock, or the splash boot mock. When no platform is `ready` with a public https `installUrl`, including a failed build list and a caller that has not loaded one, that column shows how to get the first build: confirm brand, publish home (`/dashboard/app-builder#publish-home`), open Build my app, then scan the install code on the Home Go live strip (`/dashboard`). The primary action is Build my app. While the build list is loading and no install is already known, that column says it is checking and does not show the steps over a finished install. When at least one ready public https install URL exists, the same column centers the compact install code and Open Build. The code is still drawn in the browser from that URL only. An unsafe URL is not a code and falls through to the first-build steps. Branding editors stay. `/dashboard/app-builder/preview` stays the module stack. It is not the branding phone, and its caption no longer points at a phone on Brand or Preview. This replaces the 2026-09-29 rule that kept the light phone as the wait state before the first ready install.
- Reason: Dashboard #99. Product decision on 2026-09-29 (Daniyal): the phone mock is not a preview of the installable app. The install code is.
- Impact: Brand, Preview, and Settings presentation. Build my app, the Go live strip, and App Builder publish are unchanged. No new backend field. No Shopify token and no Expo token is rendered. Human review is required because this is the merchant-facing install handoff and the branding preview.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#99`.

### Go live count matches the checklist, and billing is said once

- Date: 2026-09-29.
- Decision: The Go live header count is the checklist rows on connected Home and how many of those rows are done. Store accounts stay in the list, so they are in the count, and they still never take the filled action. When Shopify billing or reconnect blocks the catalog, that story is the strip lead only. The reconnect action stays under that lead. Home does not repeat the same billing or reconnect paragraph in a second notice.
- Reason: Dashboard #98. The header said 1 of 6 while the list rendered seven rows, because the total was fixed and left out optional store accounts. Billing also appeared as the lead and again as the safety notice.
- Impact: Connected Home presentation. Reconnect stays available for a billing or reconnect block, and that block still does not offer Sync again. It does not change auth, store ownership, the publish write, or Build eligibility. Human review is required because this sits next to Shopify recovery.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`. GitHub issue: `#98`.

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
