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

### New Shopify connects keep the access token on the backend only

- Date: 2026-09-23.
- Decision: For new merchant connects, the backend is the only owner of the Shopify Admin access token. The dashboard starts connect, reads status, disconnects, and triggers sync through the backend APIs. It does not exchange the OAuth code and does not persist `shopify.accessToken` (or the Storefront token) on the dashboard `Store`.
- Reason: Two writers of the same secret caused split connection state and blocked a simple connect flow. Parent epic: cartaisy-backend #152. Backend contract: cartaisy-backend #153 / PR #157. Dashboard issue: #15.
- Impact: Reconnect is the same connect call, not a second token path. Operators set `SHOPIFY_OAUTH_RETURN_URL` on the backend. Historical dashboard tokens are left in place until a separate migration. Shopify, auth, and store-ownership changes still need human review.
- Related docs: `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DASHBOARD_ONBOARDING_FLOW.md`, backend `docs/cartaisy/SHOPIFY_API_POLICY.md`.

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
