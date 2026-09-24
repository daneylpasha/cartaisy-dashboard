# Dashboard Release Checklist

## Current state:

- Dashboard release readiness was not previously documented in a repo-level checklist.
- Verified commands include `npm run lint`, `npm run type-check`, `npm run build`, `npm run dev`, `npm run start`, `npm run test:api`, and `npm run generate:api`.
- CI exists as of 2026-07-28: `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, `npm run type-check`, and `npm run test:auth-google` on every pull request against `main`, on Node 20, with actions pinned by commit SHA. The Google check covers the invite signup decision only. There is still no general automated test suite.
- No environment example file was found during the audit.
- The dashboard currently includes settings, Shopify connection, store branding/logo upload, app-builder modules, homescreen preview, admin onboarding token pages, and a post-signup setup wizard at `/dashboard/onboarding`. The wizard ready step submits a tracked build request when the catalog sync succeeded and Shopify is connected.

## Target state:

Before release, verify:

- Pre-release checks: dependencies installed, `npm run lint` and `npm run type-check` pass (both are enforced on every PR by CI), build passes, relevant manual dashboard flows checked, and no unrelated files are included. The 176 pre-existing violations of three rules are recorded in `eslint-suppressions.json` and those rules stay at `error`, so the debt cannot grow: a violation in an unrecorded file, a count above the recorded one, or a fix in one file paired with a new violation in another all fail. See `eslint.config.mjs` for the one case that does not fail — swapping a violation for another within the same file for the same rule.
- Environment variables: backend API URL, auth/session URLs, MongoDB connection, email provider credentials, and any analytics settings are configured in deployment without exposing secret values in frontend code. Continue with Google needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the Identity Services client id). Optional `GOOGLE_CLIENT_ID` overrides the audience used when invite signup verifies the ID token; otherwise the public client id is used. The Google client must allow the dashboard origin. When the public client id is unset, the button is hidden. `.env.example` documents these two names only. Partner app secrets (`SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_REDIRECT_URI`, `SHOPIFY_SCOPES`) stay on the backend. Set backend `SHOPIFY_OAUTH_RETURN_URL` to `https://<dashboard>/dashboard/onboarding?step=connect` so a new merchant returns to the wizard after Shopify authorizes. The backend ignores any `returnTo` sent by the dashboard. Settings still reads `shopify` and `reason` if that URL is pointed at settings instead. The dashboard connect flow does not read `SHOPIFY_API_KEY` or `SHOPIFY_API_SECRET`.
- Auth/session: login, token cookie handling, backend profile verification, protected dashboard redirects, and signout behavior.
- Store context: every dashboard route uses the authenticated store context and respects role permissions.
- Backend API compatibility: generated/direct backend calls match deployed backend endpoints and response shapes.
- Shopify: connect, status, reconnect, sync again, disconnect, and collections go through the backend. Confirm a new connect does not write `shopify.accessToken` on the dashboard store. The retired dashboard callback redirects to settings and does not exchange a code.
- Merchant onboarding: token creation, token expiry/revocation, email delivery if enabled, signup token validation, store creation, first-user role, post-signup login, and the `/dashboard/onboarding` steps. Connect Shopify opens the backend authorize URL. A return with `shopify=connected` shows success, sync progress, and the product count or "Not synced yet", and Continue to Brand stays available. A return with `shopify=error&reason=` shows plain copy and Try again. Refreshing does not repeat that banner. Branding save and the smart-default preview still apply. Build my app stays disabled until `GET /api/v1/shopify/sync` reports `eligibleForBuild` and Shopify is connected. Confirm the wizard did not write a Shopify access token.
- Branding/theme configuration: logo upload/remove, current branding fetch, and any mobile-consumed theme fields.
- Home module publishing/editor checks: module create/edit/reorder/visibility, collection reference selection, homescreen preview, backend/mobile contract compatibility, and validation of store-owned Shopify references.
- Build/status workflow: onboarding preview shows a smart-default home. On the ready step, an ineligible store cannot submit and sees Connect Shopify or Sync again. Try again also refreshes Shopify connection status. An expired access token on that screen refreshes and retries once. An eligible store can request Android, iOS, or both and sees per-platform status, including Waiting on Apple for iOS. The screen must not show a build log or an EAS id. Also verify the existing app-builder homescreen preview.
- Rollback notes: identify the deployed version, environment variables changed, database migrations/manual scripts, and any generated API client changes before release.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- App-store submission, release publishing, and rollback automation were not found in the audited files. The tracked build request on the ready step is the v1 handoff.
- CI covers lint and typecheck only. There is no unit, integration or e2e test runner, and no build step in CI, so a release still needs manual verification of the flows listed above.
- `.env.example` documents `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and optional `GOOGLE_CLIENT_ID` only. It is not a full environment catalog. Deployments must still be checked without exposing secrets.
- Current Shopify and branding flows include direct dashboard/backend API calls that need security review before major release changes.

## Related docs/issues:

- Testing: `docs/TESTING.md`.
- Status: `docs/STATUS.md`.
- Architecture: `docs/ARCHITECTURE.md`.
- Onboarding: `docs/DASHBOARD_ONBOARDING_FLOW.md`.
- Home modules: `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- GitHub issue: `#2`.
