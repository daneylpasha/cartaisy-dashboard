# Agent Rules

## Current state:

- This is the Cartaisy dashboard repository, a Next.js App Router application for merchant-facing SaaS operations.
- Agents should read `CARTAISY_CONTEXT.md` before dashboard work, then inspect the relevant code paths before making implementation claims.
- The shared Cartaisy product context currently lives in the backend repo at `docs/cartaisy/README.md`.
- This repository did not previously have a dashboard-specific `AGENTS.md` or `docs/` context pack.

## Target state:

- Keep dashboard work small, reviewable, and scoped to one issue.
- Use backend APIs for tenant-safe Shopify and store operations. Do not bypass backend tenancy, ownership, or security checks.
- Do not expose Shopify Admin tokens, private app credentials, or server-only secrets in dashboard frontend code.
- Do not change auth, store ownership, publishing, or module validation behavior unless the issue explicitly asks for that change.
- Update docs when dashboard architecture, product scope, or cross-repo assumptions change.
- Treat high-risk auth, store ownership, Shopify, and publishing changes as requiring human review.

## PR context update rules:

- If a PR changes what is complete, partial, missing, or risky, update `docs/STATUS.md`.
- If a PR adds or changes an architecture/product decision, update `docs/DECISIONS.md`.
- If a PR changes architecture, module boundaries, dashboard flow, integration flow, or backend API assumptions, update `docs/ARCHITECTURE.md` or the relevant API docs.
- If a PR changes commands, tests, CI expectations, or validation strategy, update `docs/TESTING.md`.
- If a PR changes release/deploy requirements or environment/config assumptions, update `docs/RELEASE_CHECKLIST.md` or the relevant docs.
- If a PR changes merchant onboarding, update `docs/DASHBOARD_ONBOARDING_FLOW.md`.
- If a PR changes home module editor, publishing, validation, collection/product picker, or mobile contract assumptions, update `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- If a PR touches high-risk areas such as auth/session, store ownership, Shopify secrets, backend API contracts, onboarding, branding/theme, modules, or environment variables, call that out in the PR description.

## Known gaps:

- Do not treat planned SaaS features as implemented unless verified in code.
- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- If a behavior is unclear, document it as a known gap or verification task rather than an implemented fact.

## Related docs/issues:

- Dashboard entrypoint: `CARTAISY_CONTEXT.md`.
- Shared Cartaisy context: backend repo `docs/cartaisy/README.md`.
- Dashboard context pack: `docs/ARCHITECTURE.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/TESTING.md`, `docs/RELEASE_CHECKLIST.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- GitHub issue: `#2`.
