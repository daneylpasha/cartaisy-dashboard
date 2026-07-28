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
- Lint command: `npm run lint`. ESLint 9 flat config in `eslint.config.mjs`, composing `eslint-config-next`'s `core-web-vitals` and `typescript` configs. `lib/api/generated/**` is ignored because it is Orval output.
- Typecheck command: `npm run type-check`. `tsconfig.json` already sets `noEmit`, so no extra flags are needed, and it passes on a clean checkout without a prior `next build`.
- Test command: no general `test` script was found. `test:api` exists and expects a development server at `http://localhost:3000` according to `scripts/test-api.ts`, while `npm run dev` uses port 3002.
- Build command: `npm run build`.
- CI behavior: `.github/workflows/ci.yml` runs on pull requests against `main`. It checks out the repo (actions pinned by commit SHA), sets up Node 20 with npm caching, then runs `npm ci`, `npm run lint`, and `npm run type-check`. There is no test step, because there is no automated test suite yet. The other three workflows in `.github/workflows/` dispatch AI coding agents and do not verify code.
- Lint baseline: linting was introduced on a repo that had never been linted, which surfaced 176 pre-existing violations of `@typescript-eslint/no-explicit-any` (136), `react/no-unescaped-entities` (34) and `@typescript-eslint/no-empty-object-type` (6). All three keep their `error` severity; the existing violations are recorded per file and per rule in `eslint-suppressions.json`, generated once with `eslint --suppress-all`. CI runs plain `eslint .`, which reads that file automatically. Burn the debt down by fixing violations and running `eslint --prune-suppressions` to drop the stale entries.

## Target state:

- Every dashboard PR should run the smallest relevant validation commands and document what was run.
- High-risk dashboard changes should include explicit validation for auth/session behavior, store scoping, Shopify access, module reference validation, and mobile-preview compatibility.
- Package scripts should eventually expose consistent lint, typecheck, test, and build commands.
- API test scripts should align with the actual dev server port or accept a configurable base URL.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- Lint and typecheck commands exist and run in CI, but there is still no unit, integration, or e2e test runner. CI proves the code lints and type-checks; it does not prove behavior.
- The lint baseline is not clean. 176 pre-existing violations of three rules are recorded in `eslint-suppressions.json` instead of being fixed; the rules themselves stay at `error`, so new violations still fail. That file is generated debt, not a permission slip — do not regenerate it with `--suppress-all` to turn a red build green. The `react-hooks/rules-of-hooks` violation in `app/dashboard/app-builder/page.tsx` that was originally suppressed inline has since been fixed, so that `eslint-disable` is gone. Unrelated pre-existing `eslint-disable` comments elsewhere in the repo are untouched.
- `test:api` may require manual setup and currently references port 3000, while the dev script starts on port 3002. Future work should either update `scripts/test-api.ts` to default to `http://localhost:3002`, make it read a `BASE_URL` environment variable, or document running it with `BASE_URL=http://localhost:3002`.
- Docs-only PRs do not need runtime validation unless they modify executable files.

## Required validation before PR:

- For docs-only changes: inspect `git diff --stat` and `git diff --name-only` to confirm only docs/context files changed.
- For any code change: run `npm run lint` and `npm run type-check`. CI runs both on the PR, so failing them locally first is cheaper than failing them in Actions.
- For behavior changes: run `npm run build` at minimum, plus any relevant manual checks for affected routes.
- For auth/store/Shopify/module publishing changes: verify tenant/store scoping manually and request human review.
- For generated API changes: verify `npm run generate:api` output and backend API compatibility.

## Related docs/issues:

- Dashboard status: `docs/STATUS.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- GitHub issue: `#2`.
