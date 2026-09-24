# Dashboard Onboarding Flow

## Current state:

- Dashboard signup is invitation-only.
- Master-admin access to onboarding token management is implemented in `app/dashboard/admin/onboarding/page.tsx` using a hard-coded master admin email list.
- Onboarding tokens are stored in `models/OnboardingToken.ts` with `pending`, `used`, `expired`, and `revoked` statuses.
- `app/api/admin/onboarding-tokens/route.ts` can list, create, expire, and revoke onboarding tokens for master admins.
- `app/api/admin/send-onboarding-email/route.ts` can send onboarding emails through `sendOnboardingEmail`.
- `/signup?token=...` validates token status through `app/api/auth/validate-token/route.ts`, pre-fills email/store name when available, then submits to `app/api/auth/signup/route.ts`.
- Invite signup and `/login` share `app/(auth)/layout.tsx`, a centered card on the neutral `#f5f5f6` surface used by the setup wizard. When the token includes a store name or email, those fields stay locked and keep the invitation helper copy. Password checks and submit behavior are unchanged.
- Signup creates a `Store`, creates the first `User` as `super_admin`, marks the token as used, and on a successful sign-in redirects to `/dashboard/onboarding`.
- Login still opens `/dashboard` from the auth page. Middleware (`lib/dashboard/entry.ts`) continues that visit to `/dashboard/onboarding` when `GET /api/v1/shopify/status`, parsed like the wizard, says the store is not connected. A connected store stays on Home. A status check that fails does not redirect. The redirect does not apply to other dashboard URLs, and Exit setup does not bounce back into the wizard. Home for a disconnected store is a checklist that links to the wizard steps; it does not replace the wizard.
- The guided wizard at `app/dashboard/onboarding/page.tsx` is the post-signup path: Connect Shopify, confirm brand, preview a starting home, then a ready-for-build step. It does not replace invite signup and it does not require the home module editor. The wizard shell comes from dashboard #16 / PR #18. This change does not restyle it.
- Connect stays in `lib/onboarding/shopifyConnect.ts` and calls backend Shopify routes only. `liveRedirectEnabled` is true. Connect Shopify opens the authorize URL from `POST /api/v1/shopify/oauth/connect`. The merged backend ignores a client `returnTo` and sends the browser to `SHOPIFY_OAUTH_RETURN_URL`, adding `shopify=connected` or `shopify=error` plus `reason`. The connect step reads that query. This wizard does not write `shopify.accessToken` in dashboard Mongo.
- Branding reuses `GET`/`PATCH /admin/stores/:storeId/branding` and `POST .../branding/logo` for colors and logo. App name is saved with `PATCH /api/store` `{ name }`. Splash and icon upload to `.../branding/splash` and `.../branding/icon` when those routes exist; otherwise they stay in the preview for the session.
- The ready step is the Build my app screen. It calls `POST /api/v1/build-requests` with Android and iOS booleans and an optional access note, then polls `GET /api/v1/build-requests/:id` until each requested platform is ready or failed. Those calls use the shared dashboard client, which refreshes an expired access token and retries once. Submit stays disabled unless `GET /api/v1/shopify/sync` says `eligibleForBuild` and Shopify is connected. `shopify.lastSyncAt` does not enable it. Try again reloads the wizard's Shopify connection snapshot together with catalog sync and the build list, so a failed status check does not stay stuck until a full page reload.
- Store setup can still continue through dashboard settings. That Shopify card also uses the backend and does not persist an access token. Reconnect and Sync again are one button each.

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
- Live Shopify connect from the wizard is on. The merchant still can continue to branding with a sync warning. Build stays off until `GET /api/v1/shopify/sync` reports a succeeded catalog sync and Shopify is connected, including when that status cannot be read. The browser returns to the wizard only when backend `SHOPIFY_OAUTH_RETURN_URL` points at `/dashboard/onboarding?step=connect`.
- Splash and app icon are not fields on the current branding API. The wizard keeps them editable for preview and will persist them if those upload routes start returning 200.
- Token master-admin authorization is implemented with hard-coded real email identifiers in audited files; this is both an operational ownership concern and a security/PII concern because source-embedded identifiers persist in git history and may appear in client bundle analysis. Future work should move this allowlist to a server-side environment variable or database-backed admin record instead of expanding the in-source list.
- Historical access tokens that were written by the old dashboard callback are not migrated. A store that was connected only in that database shows as disconnected until the merchant connects again.
- Branding/theme setup beyond logo, timezone, and currency was not verified.
- Product picker was not identified.
- Preview exists. The ready step requests a tracked build and shows live status. App-store submission was not identified.
- Email delivery depends on provider configuration; no env example was found.

## Related docs/issues:

- Dashboard entrypoint: `CARTAISY_CONTEXT.md`.
- Architecture: `docs/ARCHITECTURE.md`.
- Status: `docs/STATUS.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- GitHub issue: `#2`.
