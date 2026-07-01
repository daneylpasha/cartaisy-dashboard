# Dashboard Status

Last updated: 2026-07-01.

This file is a human/agent-maintained snapshot, not an automatically guaranteed source of truth. Verify code before implementation work.

## Current state:

- Complete enough to identify: Next.js dashboard shell, protected dashboard routes, invite-token signup, store creation on signup, store settings pages, Shopify connect/status/disconnect UI, Shopify collection fetch route, home module CRUD areas, home layout ordering/visibility, homescreen preview, team/settings/orders/customers/analytics/admin surfaces, npm package metadata, local API testing script, GitHub issue templates, and a repo-level PR template.
- Partial: merchant onboarding, store setup/status, Shopify configuration, branding/theme setup, collection selection, backend API compatibility, and role-based admin permissions. These areas exist but need security and product-scope verification before being treated as production-ready SaaS workflows.
- Not started or not identified in audited files: product picker workflow, dedicated app build request workflow, app-store submission workflow, release status handoff, CI configuration, repo-level env examples, and full automated test suite.

## Target state:

- Merchant onboarding should guide a store owner from invitation through store setup readiness: account, store, Shopify connection, branding, home modules, preview, and any build/release handoff.
- Store setup/status should give merchants and admins a reliable readiness view.
- Shopify connection/configuration should be tenant-safe and backend-mediated.
- Branding/theme setup should document and validate every field consumed by mobile apps.
- Home module editor should publish only valid, store-owned Shopify references and maintain compatibility with backend/mobile contracts.
- Testing/CI and release readiness should be explicit enough for small PRs and human review.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- Merchant onboarding: current signup is invite-token based, but a full guided readiness checklist was not found.
- Store setup/status: dashboard home has status-style cards, but no canonical setup readiness model was identified.
- Shopify connection/configuration: current dashboard server routes perform OAuth and collection reads; backend-mediated tenant policy needs verification.
- Branding/theme setup: logo upload exists; broader theme configuration was not verified.
- Home module editor: module types exist, but draft/publish/status semantics and backend/mobile contract enforcement need verification.
- Collection/product picker: collection selector exists; product picker was not identified.
- Preview/build handoff: homescreen preview exists; build/release handoff was not identified.
- Auth/store ownership: route-level store scoping exists in many places; cross-route consistency should be audited before high-risk changes.
- API compatibility with backend: Orval config and direct backend calls exist; generated client freshness and backend API compatibility must be verified.
- Testing/CI: `npm run test:api` exists, but no lint/typecheck/unit/e2e scripts or CI files were found in the audit.
- Release readiness: no dedicated release checklist existed before this document.

## Related docs/issues:

- Dashboard entrypoint: `CARTAISY_CONTEXT.md`.
- Architecture: `docs/ARCHITECTURE.md`.
- Testing: `docs/TESTING.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md`.
- Onboarding: `docs/DASHBOARD_ONBOARDING_FLOW.md`.
- Home modules: `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- GitHub issue: `#2`.
