# Cartaisy Dashboard Context

Read this file before dashboard work. It is the dashboard repo entrypoint for agents and humans.

## Current state:

- Cartaisy is a SaaS product for Shopify merchants who want branded mobile commerce apps.
- This dashboard repo is a Next.js App Router application that includes marketing pages, dashboard pages, local Next API routes, MongoDB/Mongoose models, JWT-backed auth helpers, Shopify connection pages/routes, merchant onboarding token flows, store settings, analytics/admin surfaces, and app-builder home module management.
- The dashboard currently handles merchant-facing operations such as invite-based signup, a post-signup setup wizard at `/dashboard/onboarding`, store settings, Shopify connection status/connect/disconnect UI, store branding/logo upload, app-builder home modules, Shopify collection selection, and homescreen preview.
- Some dashboard routes call local Next API routes. Some client hooks/components call the configured backend API through `NEXT_PUBLIC_API_URL`.
- The canonical shared Cartaisy context currently lives in the backend repo at `docs/cartaisy/README.md`. Reference it as shared product context; do not copy the full shared docs into this repo unless a future issue asks for that.

## Target state:

- Dashboard agents should read this file, then the relevant files under `docs/`, before changing dashboard behavior.
- Dashboard should use backend APIs for tenant-safe Shopify/store operations and should not bypass backend tenancy, store ownership, security, or module validation rules.
- Dashboard frontend code must not directly expose Shopify Admin/private credentials or server-only secrets.
- Dashboard docs should stay aligned with the shared backend context and with verified dashboard implementation.
- Planned SaaS features must remain clearly separated from implemented dashboard behavior.

## Known gaps:

- Do not assume any feature or behavior described above is implemented unless verified in the current code.
- The repo has user-facing docs pages under `app/docs`, but this context pack is the first repo-level dashboard architecture/status pack found during the issue audit.
- Environment example files were not found during the audit. Required runtime variables must be verified from code and deployment settings without exposing secret values.
- Some current dashboard implementation performs Shopify OAuth/token work in dashboard server routes and stores Shopify access tokens in the dashboard MongoDB store model. The `/dashboard/onboarding` wizard does not use those routes and must not start writing tokens. The settings Shopify card still can. Treat backend-mediated Shopify operations as a target guardrail and verify current behavior before changing it.
- Marketing/user-facing copy may describe target capabilities. Treat that copy as product-facing material, not proof of implementation.

## Related docs/issues:

- Shared product context: backend repo `docs/cartaisy/README.md`.
- Dashboard architecture: `docs/ARCHITECTURE.md`.
- Dashboard readiness snapshot: `docs/STATUS.md`.
- Dashboard decisions: `docs/DECISIONS.md`.
- Dashboard validation: `docs/TESTING.md`.
- Dashboard release checklist: `docs/RELEASE_CHECKLIST.md`.
- Merchant onboarding: `docs/DASHBOARD_ONBOARDING_FLOW.md`.
- Home module contract: `docs/HOME_MODULE_EDITOR_CONTRACT.md`.
- GitHub issue: `#2`.
