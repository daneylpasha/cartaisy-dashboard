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

### Onboarding wizard does not store Shopify access tokens

- Date: 2026-09-23.
- Decision: The post-signup wizard (`/dashboard/onboarding`) must not write Shopify access tokens into dashboard Mongo. Connect is a backend-only client in `lib/onboarding/shopifyConnect.ts`. Live redirect to Shopify stays off until dashboard #15 and backend #153 return the merchant to the wizard after approval. Merchants may continue to branding with a sync warning. "Build my app" stays disabled until normalized sync status is `succeeded`, and even then it does not call a build API (dashboard #17).
- Reason: Dual token ownership is unsafe, and the build request screen is a separate issue. The wizard should still be usable before those APIs are finished.
- Impact: Settings-page Shopify connect is unchanged and can still persist a dashboard token. New onboarding work must keep using the isolated client. Flipping `liveRedirectEnabled` is the intended plug-in point for #15.
- Related docs: `docs/DASHBOARD_ONBOARDING_FLOW.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`. GitHub issues: dashboard `#15`, `#16`, `#17`; backend `#152`, `#153`.

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
