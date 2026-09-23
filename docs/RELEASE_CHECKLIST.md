# Dashboard Release Checklist

## Current state:

- Dashboard release readiness was not previously documented in a repo-level checklist.
- Verified commands include `npm run lint`, `npm run type-check`, `npm run build`, `npm run dev`, `npm run start`, `npm run test:api`, and `npm run generate:api`.
- CI exists as of 2026-07-28: `.github/workflows/ci.yml` runs `npm ci`, `npm run lint` and `npm run type-check` on every pull request against `main`, on Node 20, with actions pinned by commit SHA. There is still no automated test suite, so CI proves the code lints and type-checks — not that it behaves correctly.
- No environment example file was found during the audit.
- The dashboard currently includes settings, Shopify connection, store branding/logo upload, app-builder modules, homescreen preview, admin onboarding token pages, and a post-signup setup wizard at `/dashboard/onboarding`. The wizard ready step does not submit an app build.

## Target state:

Before release, verify:

- Pre-release checks: dependencies installed, `npm run lint` and `npm run type-check` pass (both are enforced on every PR by CI), build passes, relevant manual dashboard flows checked, and no unrelated files are included. The 176 pre-existing violations of three rules are recorded in `eslint-suppressions.json` and those rules stay at `error`, so the debt cannot grow: a violation in an unrecorded file, a count above the recorded one, or a fix in one file paired with a new violation in another all fail. See `eslint.config.mjs` for the one case that does not fail — swapping a violation for another within the same file for the same rule.
- Environment variables: backend API URL, auth/session URLs, MongoDB connection, Shopify API credentials, email provider credentials, and any analytics settings are configured in deployment without exposing secret values in frontend code.
- Auth/session: login, token cookie handling, backend profile verification, protected dashboard redirects, and signout behavior.
- Store context: every dashboard route uses the authenticated store context and respects role permissions.
- Backend API compatibility: generated/direct backend calls match deployed backend endpoints and response shapes.
- Shopify: connect, callback, status, collections, disconnect, and backend-mediated tenant-safe operations where applicable.
- Merchant onboarding: token creation, token expiry/revocation, email delivery if enabled, signup token validation, store creation, first-user role, post-signup login, and the `/dashboard/onboarding` steps (connect warning, branding save, smart-default preview, build button remaining disabled until sync succeeded). Confirm the wizard did not write a Shopify access token.
- Branding/theme configuration: logo upload/remove, current branding fetch, and any mobile-consumed theme fields.
- Home module publishing/editor checks: module create/edit/reorder/visibility, collection reference selection, homescreen preview, backend/mobile contract compatibility, and validation of store-owned Shopify references.
- Build/status workflow: onboarding preview shows a smart-default home. "Build my app" must not submit a request. Dedicated build status remains dashboard #17. Also verify the existing app-builder homescreen preview.
- Rollback notes: identify the deployed version, environment variables changed, database migrations/manual scripts, and any generated API client changes before release.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- Dedicated build request, app-store submission, release status, and rollback automation were not found in the audited files.
- CI covers lint and typecheck only. There is no unit, integration or e2e test runner, and no build step in CI, so a release still needs manual verification of the flows listed above.
- No env example file was found; deployments must be checked without exposing secrets.
- Current Shopify and branding flows include direct dashboard/backend API calls that need security review before major release changes.

## Related docs/issues:

- Testing: `docs/TESTING.md`.
- Status: `docs/STATUS.md`.
- Architecture: `docs/ARCHITECTURE.md`.
- Onboarding: `docs/DASHBOARD_ONBOARDING_FLOW.md`.
- Home modules: `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- Shared context: backend repo `docs/cartaisy/README.md`.
- GitHub issue: `#2`.
