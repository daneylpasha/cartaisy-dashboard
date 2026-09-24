# Dashboard Testing

## Current state:

- Package manager: npm, verified by `package-lock.json`.
- Common commands from `package.json`:
  - `npm run dev`: starts Next dev server on port 3002.
  - `npm run build`: runs `next build`.
  - `npm run start`: runs `next start`.
  - `npm run lint`: runs `eslint .`.
  - `npm run type-check`: runs `tsc --noEmit`.
  - `npm run test:api`: runs `ts-node scripts/test-api.ts`.
  - `npm run generate:api`: runs `orval`.
- Optional local checks, not part of CI: `node --experimental-strip-types lib/shopify/recovery.check.ts` asserts the one recovery control (Sync again, Reconnect Shopify, webhook text, and that a token-shaped webhook error is dropped). `npx tsx lib/shopify/recoveryView.check.tsx` renders that control for connected, failed, and disconnected states and checks that each state has one of those buttons and no token or API-key copy. `node --experimental-strip-types lib/onboarding/normalizers.check.ts` asserts onboarding sync, connection, and the catalog-sync build gate (including that `lastSyncAt` is not success). It also asserts the post-connect catalog copy, the one-time auto-sync decision, stripping of the Shopify return query, and that each backend OAuth reason code has merchant copy. It asserts preview product normalization (title, image, optional price, a cap of four, rejection of token-shaped image URLs) and that the preview footnote does not mention sample products when real ones exist. `npx tsx lib/onboarding/branding.check.ts` asserts icon and splash URL parsing, rejection of token-shaped image URLs, and merge with stored URLs. `npx tsx lib/onboarding/preview.check.tsx` renders the shopper phone and asserts the branding draft is on that screen (name, colors, logo, icon, splash, products, empty, and loading) and that the phone source and markup do not contain Cartaisy. `node --experimental-strip-types lib/build/contract.check.ts` asserts build-request labels, polling, and the create payload. `npx tsx lib/build/view.check.tsx` renders the Build my app screen states. `npx tsx lib/build/client.check.ts` asserts that build calls refresh an expired access token and that a build-screen retry refreshes the Shopify connection snapshot after that refresh. `node --experimental-strip-types lib/build/admin.check.ts` asserts the platform-ops list shape, the open-queue query, and that a status patch names one platform. `npx tsx lib/build/adminClient.check.ts` asserts that a 403 does not surface another store's note, that the status PATCH body is one platform, and that an expired access token is refreshed. `npx tsx lib/build/adminView.check.tsx` renders the ops queue empty, populated, error, and 403 states and checks that a forbidden render omits store notes. `node --experimental-strip-types lib/dashboard/dashboard.check.ts` asserts the post-login onboarding redirect (no loop from Exit setup, deep links stay put, unknown Shopify status does not redirect) and the Home copy rules (no hardcoded Active status, zero module counts stay an empty state, `lastSyncAt` alone is not Synced). The `.check.ts` files that import a `.ts` suffix are excluded from `tsc` because Node needs that suffix. `lib/build/client.check.ts` uses the repo path alias and stays in `tsc`.
- `npm run test:auth-google` (`tsx lib/auth/googleSignup.check.ts`) asserts the invite Google signup decision with a mocked verifier: email mismatch, unverified email, success, and a verifier failure. CI runs it after typecheck. It does not call Google or Mongo.
- Lint command: `npm run lint`. ESLint 9 flat config in `eslint.config.mjs`, composing `eslint-config-next`'s `core-web-vitals` and `typescript` configs. `lib/api/generated/**` is ignored because it is Orval output.
- Typecheck command: `npm run type-check`. `tsconfig.json` already sets `noEmit`, so no extra flags are needed, and it passes on a clean checkout without a prior `next build`.
- Test command: no general `test` script was found. `test:api` exists and expects a development server at `http://localhost:3000` according to `scripts/test-api.ts`, while `npm run dev` uses port 3002.
- Build command: `npm run build`.
- CI behavior: `.github/workflows/ci.yml` runs on pull requests against `main`. It checks out the repo (actions pinned by commit SHA), sets up Node 20 with npm caching, then runs `npm ci`, `npm run lint`, `npm run type-check`, and `npm run test:auth-google`. That last step is the invite Google signup decision check only. There is still no general unit, integration, or e2e suite. The other three workflows in `.github/workflows/` dispatch AI coding agents and do not verify code.
- Lint baseline: linting was introduced on a repo that had never been linted, which surfaced 176 pre-existing violations of `@typescript-eslint/no-explicit-any` (136), `react/no-unescaped-entities` (34) and `@typescript-eslint/no-empty-object-type` (6). All three keep their `error` severity; the existing violations are recorded per file and per rule in `eslint-suppressions.json`, generated once with `eslint --suppress-all`. CI runs plain `eslint .`, which reads that file automatically. Burn the debt down by fixing violations and running `eslint --prune-suppressions` to drop the stale entries. Known limit: entries record counts, not identities, so a violation can be swapped for another within the same file for the same rule without failing CI. The baseline stops debt growing; it does not freeze individual violations.

## Target state:

- Every dashboard PR should run the smallest relevant validation commands and document what was run.
- High-risk dashboard changes should include explicit validation for auth/session behavior, store scoping, Shopify access, module reference validation, and mobile-preview compatibility.
- Package scripts should eventually expose consistent lint, typecheck, test, and build commands.
- API test scripts should align with the actual dev server port or accept a configurable base URL.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- Lint, typecheck, and the Google signup decision check exist and run in CI. There is still no general unit, integration, or e2e runner. CI does not prove the rest of the dashboard behaves.
- The lint baseline is not clean. 176 pre-existing violations of three rules are recorded in `eslint-suppressions.json` instead of being fixed; the rules themselves stay at `error`, so new violations still fail. That file is generated debt, not a permission slip — do not regenerate it with `--suppress-all` to turn a red build green. The `react-hooks/rules-of-hooks` violation in `app/dashboard/app-builder/page.tsx` that was originally suppressed inline has since been fixed, so that `eslint-disable` is gone. Unrelated pre-existing `eslint-disable` comments elsewhere in the repo are untouched.
- `test:api` may require manual setup and currently references port 3000, while the dev script starts on port 3002. Future work should either update `scripts/test-api.ts` to default to `http://localhost:3002`, make it read a `BASE_URL` environment variable, or document running it with `BASE_URL=http://localhost:3002`.
- Docs-only PRs do not need runtime validation unless they modify executable files.

## Required validation before PR:

- For docs-only changes: inspect `git diff --stat` and `git diff --name-only` to confirm only docs/context files changed.
- For any code change: run `npm run lint` and `npm run type-check`. CI runs both on the PR, so failing them locally first is cheaper than failing them in Actions.
- For behavior changes: run `npm run build` at minimum, plus any relevant manual checks for affected routes.
- For auth/store/Shopify/module publishing changes: verify tenant/store scoping manually and request human review. Shopify connect is high-risk: confirm the dashboard routes under `app/api/shopify/connect`, `callback`, `status`, and `disconnect` do not exchange a code or write an access token, and that the settings card and the onboarding connect step call the backend connect endpoint. The wizard's `liveRedirectEnabled` flag is the live-redirect switch; do not add a second OAuth client inside the wizard shell.
- For generated API changes: verify `npm run generate:api` output and backend API compatibility.

## Related docs/issues:

- Dashboard status: `docs/STATUS.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- GitHub issue: `#2`.
