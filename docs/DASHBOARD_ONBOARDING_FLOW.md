# Dashboard Onboarding Flow

## Current state:

- Dashboard signup is invitation-only.
- Master-admin access to onboarding token management is implemented in `app/dashboard/admin/onboarding/page.tsx` using a hard-coded master admin email list.
- Onboarding tokens are stored in `models/OnboardingToken.ts` with `pending`, `used`, `expired`, and `revoked` statuses.
- `app/api/admin/onboarding-tokens/route.ts` can list, create, expire, and revoke onboarding tokens for master admins.
- `app/api/admin/send-onboarding-email/route.ts` can send onboarding emails through `sendOnboardingEmail`.
- `/signup?token=...` validates token status through `app/api/auth/validate-token/route.ts`, pre-fills email/store name when available, then submits to `app/api/auth/signup/route.ts`.
- Invite signup and `/login` share `app/(auth)/layout.tsx`, a centered card on the neutral `#f5f5f6` surface used by the setup wizard. When the token includes a store name or email, those fields stay locked and keep the invitation helper copy. Password checks and submit behavior are unchanged.
- When `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set, a valid invite shows Continue with Google as the first action and the password form under an "or" divider. Login shows the same button above the email form. The Google account email must match the invite and have `email_verified`. Signup then calls backend `POST /auth/google` with that ID token and sends the merchant to `/dashboard/onboarding`. The button is omitted when the client id is unset.
- Signup creates a `Store`, creates the first `User` as `super_admin`, marks the token as used, and on a successful sign-in redirects to `/dashboard/onboarding`.
- Login still opens `/dashboard` from the auth page. Middleware (`lib/dashboard/entry.ts`) continues that visit to `/dashboard/onboarding` when `GET /api/v1/shopify/status`, parsed like the wizard, says the store is not connected. A connected store stays on Home. A status check that fails does not redirect. The redirect does not apply to other dashboard URLs, and Exit setup does not bounce back into the wizard. Home for a disconnected store is a checklist that links to the wizard steps; it does not replace the wizard.
- The guided wizard at `app/dashboard/onboarding/page.tsx` is the post-signup path: Connect Shopify, confirm brand, preview a starting home, then a ready-for-build step. It does not replace invite signup and it does not require the home module editor. The wizard shell comes from dashboard #16 / PR #18. This change does not restyle it.
- Connect stays in `lib/onboarding/shopifyConnect.ts` and calls backend Shopify routes only. `liveRedirectEnabled` is true. Connect Shopify opens the authorize URL from `POST /api/v1/shopify/oauth/connect`. The merged backend ignores a client `returnTo` and sends the browser to `SHOPIFY_OAUTH_RETURN_URL`, adding `shopify=connected` or `shopify=error` plus `reason` and `shop`. The connect step reads that query, shows `shopifyReturnCopy`, then removes `shopify`, `reason`, `shop`, and a legacy `error` param so a refresh does not repeat the banner. A connected return shows sync progress from `GET /api/v1/shopify/sync`, the product count from the overview snapshot, and the last sync time when the durable status has one. When that status is idle or failed, the step calls `POST /api/v1/shopify/sync` once. A 409 in-progress response does not start another sync; the step polls GET until the run finishes and the Sync again control stays busy. A failed sync shows `errorSummary` when that text is safe. `webhookRegistrationError` from connection status is shown when present. If the catalog is already eligible and that webhook error is set, the one control is Reconnect Shopify. Otherwise a connected store that is not eligible gets Sync again, and a healthy catalog gets Sync again only as a quiet action. Shop id is not shown. A return of `shopify=error` uses Reconnect Shopify. Continue to Brand stays available during sync. This wizard does not write `shopify.accessToken` in dashboard Mongo.
- Branding reuses `GET`/`PATCH /admin/stores/:storeId/branding` and `POST .../branding/logo` for colors and logo. App name is saved with `PATCH /api/store` `{ name }`. Splash and icon upload as soon as the merchant picks a file, the same way the logo does. The phone shows the local preview immediately, then the saved https URL. Upload tries `POST .../branding/splash` and `.../branding/icon` first. The live branding API still stores logo and colors. When those routes are missing, the file uses the existing signed store-image upload. That path uploads only when the signature says `canUpload`, then calls `POST /notifications/stores/:storeId/images/register` before the URL is kept. `PATCH /api/store` stores `{ brandAssets: { iconUrl, splashUrl } }`. Reload reads branding `iconUrl` / `appIconUrl` and `splashUrl` / `splashImageUrl` when the payload includes them, and otherwise uses that store record. The brand step shows the same phone as the preview step. That phone reads the wizard draft, so the app name, logo, icon, colors, and splash update in the same render. Saving the name and colors is not required to see the draft.
- Preview (`components/onboarding/SmartHomePreview.tsx`) is the phone on the brand step and the preview step. It applies the merchant's app name, logo, icon, splash, and colors. The device screen does not include a Cartaisy wordmark, logo, or marketing chrome. The wizard header outside the phone still says Cartaisy. When `GET /api/v1/shopify/sync` is `succeeded`, the shelf shows up to four products: a product list on the overview payload when one is present, otherwise `GET /api/v1/products?limit=4&sortBy=newest` with the signed-in store id sent as `X-Store-ID`. Each tile uses the title, an http(s) image when the payload has one, and a price when one is present. Idle, running, failed, and empty catalogs show short copy in the phone. The phone does not use placeholder product tiles or a Cartaisy wordmark. Collection names stay read only. Check again reloads the same snapshot.
- The ready step is the Build my app screen. It calls `POST /api/v1/build-requests` with Android and iOS booleans and an optional access note, then polls `GET /api/v1/build-requests/:id` until each requested platform is ready or failed. Those calls use the shared dashboard client, which refreshes an expired access token and retries once. Submit stays disabled unless `GET /api/v1/shopify/sync` says `eligibleForBuild` and Shopify is connected. A disconnected store sees Reconnect Shopify and a plain reason. A connected store that is not eligible sees Sync again. `shopify.lastSyncAt` does not enable it. Try again reloads the wizard's Shopify connection snapshot together with catalog sync and the build list, so a failed status check does not stay stuck until a full page reload. Cartaisy operators update those statuses from `/dashboard/admin/build-requests`. That page is not part of the merchant wizard. A store owner, including `super_admin`, cannot open the queue.
- Store setup can still continue through dashboard settings. That Shopify card also uses the backend and does not persist an access token. One control is shown: Sync again when connected but the catalog is not build-eligible, Reconnect Shopify when disconnected or when webhook registration failed after a successful sync. The older admin sync-status card is not on this page.

## Target state:

- MVP onboarding should guide merchants through:
  1. Receive invite/onboarding link.
  2. Validate link and create owner account.
  3. Create or confirm store identity.
  4. Connect Shopify.
  5. Confirm store setup/status readiness.
  6. Configure branding/theme fields required by mobile.
  7. Configure home modules and Shopify collection/product references.
  8. Preview the mobile home screen.
  9. Enter build/release handoff when that workflow exists.
- Required merchant information should include owner email, store name, Shopify shop domain, branding assets, currency/timezone from Shopify, and module content/references.
- Admin visibility should show whether a merchant is ready for MVP release, not just whether they can log in.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- The wizard is a guided setup path, not a canonical persisted readiness record. Leaving and returning does not remember an "onboarding complete" flag. Routing treats "Shopify connected" as the established-store signal for that reason. Preview is not marked complete on Home, because nothing stores it.
- Live Shopify connect from the wizard is on. After `shopify=connected`, the connect step shows success, catalog sync, and the product count (or "Not synced yet"). The merchant can continue to branding while sync is still running; the brand step keeps the sync warning. Build stays off until `GET /api/v1/shopify/sync` reports a succeeded catalog sync and Shopify is connected, including when that status cannot be read. The browser returns to the wizard only when backend `SHOPIFY_OAUTH_RETURN_URL` points at `/dashboard/onboarding?step=connect`.
- The live backend branding document is still logo and colors. Icon and splash https URLs are stored on the dashboard until `POST /branding/icon` and `POST /branding/splash` return those fields on `GET /branding`. The signed upload fallback checks `canUpload` and registers the file with `POST /notifications/stores/:storeId/images/register`, the same store image record the notification uploader uses. The https URL is kept only after registration succeeds. A store at its image limit is not uploaded.
- Token master-admin authorization is implemented with hard-coded real email identifiers in audited files; this is both an operational ownership concern and a security/PII concern because source-embedded identifiers persist in git history and may appear in client bundle analysis. Future work should move this allowlist to a server-side environment variable or database-backed admin record instead of expanding the in-source list.
- Historical access tokens that were written by the old dashboard callback are not migrated. A store that was connected only in that database shows as disconnected until the merchant connects again.
- Branding/theme setup beyond logo, timezone, and currency was not verified.
- Product picker was not identified.
- Preview exists. The ready step requests a tracked build and shows live status. App-store submission was not identified.
- Email delivery depends on provider configuration. `.env.example` documents the Google client id only, not the email provider.

## Related docs/issues:

- Dashboard entrypoint: `CARTAISY_CONTEXT.md`.
- Architecture: `docs/ARCHITECTURE.md`.
- Status: `docs/STATUS.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- GitHub issue: `#2`.
