# Cartaisy C01 Implementation Completion Report

**Status:** PENDING FOUNDER MANUAL QA

**Repo:** `daneylpasha/cartaisy-dashboard`  
**Base:** `main` at `e59e874` (Claim App Store Shopify installs on the OAuth return URL, #136)  
**Branch:** `cursor/c01-evaluation-purchase-e8e0`  
**Date:** 5 October 2026  
**Production:** not deployed. Not merged.

This report covers the public evaluation and purchase surfaces only. Product decisions from the C01 current-state report and the offer-evidence addendum were treated as final and were not reopened.

## A. Status

The public site now describes one managed offer, an invite-only handoff, a no-login fit check, a real-screen product tour, and a walkthrough request that replaces the broken Calendly embed. Unsupported counts, ratings, prices, trials, card and PayPal billing claims, and the old JSON-LD price and rating are gone from the scanned marketing surfaces.

Persistence is implemented against the dashboard Mongo database. A local check without a reachable Mongo returned HTTP 503 and did not invent a saved lead. The three fit outcomes are covered by `npm run test:c01`. They were not shown in the browser in this pass because the save failed first.

The operator lead inbox is implemented and guarded by the existing platform-operator check. It was not opened with a real operator session.

Founder manual QA is still required before merge or any production deploy.

## B. Requirement coverage

| ID | Requirement | Result |
|---|---|---|
| C01-R01 | Remove unsupported claims | Done in scanned marketing, docs, auth, and SEO files. `npm run test:c01` rejects `$49`/`$99`/`$199`/`$499`, 14-day trial, 500+, 4.9, 100K, Calendly, placeholder video, aggregate rating, price JSON-LD, Start Free Trial, Get Started Free, Visa, and Mastercard. |
| C01-R02 | Homepage reposition | Done. Eyebrow, headline, and both CTAs match the decided copy. |
| C01-R03 | Fit and eligibility | Done. Operating fit, pre-launch fit, and website-first are stated. No sales guarantee. |
| C01-R04 | `/fit` without login | Done. Store URL is optional and does not change the outcome. Submitting does not start Shopify OAuth. Save is required before the outcome is returned. |
| C01-R05 | `/pricing` one managed offer | Done. Setup, then a recurring fee. No dollar amount. Includes and exclusions come from `lib/marketing/offer.ts`. |
| C01-R06 | `/demo` real screens | Done. `/product-tour` aliases the same page. The page mounts the real Connect and Brand steps. No YouTube embed and no public install link. |
| C01-R07 | Walkthrough request | Done. `/schedule-demo` is a form. Calendly components are removed. |
| C01-R08 | Operator-only lead inbox | Implemented. `/dashboard/admin/leads` and `GET /api/admin/leads` require a session and a successful platform-operator check. Not exercised with an operator login in this pass. |
| C01-R09 | Ownership and prerequisites | Done. Merchant-owned Apple and Google accounts, fees not quoted as Cartaisy prices, Cartaisy-managed Expo project. |
| C01-R10 | Shopify-hosted checkout wording | Done. The decided sentence is the shared `checkoutWording`. |
| C01-R11 | Features, FAQ, docs, about, footer, SEO | Done. FAQ includes offer, trial, account, checkout, ownership, iOS, App Store, scopes, stopping, and sales. |
| C01-R12 | Signup and login handoff | Done. Both pages say accounts are invite-only and link to fit and walkthrough. |
| C01-R13 | Hide App Store acquisition | Done. No public listing link is offered as the way to buy. The install-then-claim-then-invite path is documented as TODO. |
| C01-R14 | No unqualified iOS claim | Done. `docs/IOS_READINESS.md` records the TODO. |
| C01-R15 | Dead trust elements | Done. Placeholder social links, the unreachable demo modal, and the invalid Calendly embed are removed. |
| C01-R16 | Terms and privacy | Done. Commercial sentences match the offer and do not invent a refund, cancellation, or offboarding policy. |
| C01-R17 | Shopify scopes | Done. Docs say the live list is the Partner app `SHOPIFY_SCOPES` value and do not publish the old five-scope checklist. |
| C01-R18 | Responsive prospect journey | Checked at about 1280px and 390px. Homepage, fit, and the mobile nav were usable. Full keyboard and screen-reader QA is still for the founder. |

## C. What changed

Public copy is read from `lib/marketing/offer.ts`. The homepage, pricing, features, about, FAQ, docs, terms, privacy, SEO, and structured data use that module.

New prospect routes:

- `/fit` and `POST /api/fit`
- `/demo` and `/product-tour`
- `/schedule-demo` and `POST /api/walkthrough`
- `/dashboard/admin/leads` and `GET /api/admin/leads`

Removed dead marketing pieces: the old hero and feature sections, the demo video modal, the Calendly embed and popup, and the unused schedule form that never sent anything.

Signup and login keep the existing invite-token flow. The copy now points a new merchant at fit and walkthrough instead of implying open signup.

CI runs `npm run test:c01` after the existing auth checks.

## D. Commercial facts

`lib/marketing/offer.ts` is the only public source for the eyebrow, headline, CTAs, offer structure, includes, exclusions, eligibility, ownership, checkout sentence, iOS sentence, scopes sentence, App Store TODO, and FAQ answers.

The offer remains: setup, then a recurring fee, agreed outside the product. The site does not publish a dollar amount, a trial, or a card checkout.

Shopper order badges that already label an order as Apple Pay are unchanged. Those are payment-method labels on orders, not a claim that Cartaisy offers Apple Pay.

## E. Persistence and the operator inbox

`models/ProspectLead.ts` stores fit and walkthrough rows in the dashboard Mongo database, including the client IP used for rate limiting. Fit and walkthrough routes allow 5 posts per minute per IP in process memory. That limit is per serverless instance.

A successful fit save returns one of three outcomes: `operating_fit`, `prelaunch_fit`, or `website_first`. A pre-launch store URL is optional. A `javascript:` URL is rejected. The fit route does not call Shopify.

If Mongo is unreachable, the API returns 503: “We could not save this fit check.” The outcome is not shown, because it was not stored. Local verification hit that 503 (`MongooseServerSelectionError` against `mongodb://127.0.0.1:27017/...`).

If `RESEND_API_KEY` is set, a saved lead also emails `sales@rendernext.io`. Email failure is logged and does not fail the save. This environment did not prove that the production key is set or that the mailbox receives mail.

`GET /api/admin/leads` requires a dashboard session and `isPlatformOperator`, which calls backend `GET /api/v1/admin/build-requests` and ignores the body. A store owner who gets 403 from that route gets 403 here. The sidebar shows Leads only as a link; the page itself is the guard.

No backend repository change was required. The operator check reuses the existing build-request route.

## F. Intentionally not built

- No self-serve signup, free trial, Stripe, Shopify Billing, or automatic checkout.
- No new price, testimonial, rating, download count, or guarantee.
- No public Shopify App Store acquisition funnel. Install, then claim, then invite stays a TODO.
- No public TestFlight, Play, or sample-app download.
- No invented cancellation, refund, or offboarding policy.
- No production deploy and no merge.

## G. Verification

Ran on 5 October 2026 against this branch:

- `npm run test:c01` — passed (`c01 commercial checks passed`).
- `npm run type-check` — passed.
- `npm run lint -- --quiet` — passed.

Browser, local `next dev` on port 3002, no login:

- `/` shows the new eyebrow, headline, and both CTAs. The old 500+, 4.9, $49, 14-day, and Get Started Free lines are absent.
- `/fit` with a blank store URL, “planning a Shopify store”, and “branded shopping app” returned the save error because Mongo was down. The page says submitting does not connect Shopify.
- `/demo` shows the real Connect Shopify and Brand cards. Connect stayed on localhost and showed the existing validation state. It did not open Shopify.
- `/pricing` shows one offer and no dollar amount.
- `/schedule-demo` shows the walkthrough form and no Calendly error.
- `/signup` and `/login` show invite-only copy and the fit and walkthrough links.
- `/docs/shopify` does not list `read_products` as a required scope checklist.
- At about 390px, the homepage, fit form, and opened nav were usable.

Not verified in this pass:

- The three outcome screens after a successful Mongo save.
- A walkthrough row actually stored.
- The operator inbox with a platform-operator session, and the 403 state with a store-owner session.
- Resend delivery.
- A production or Vercel preview against a real database.
- Full keyboard and screen-reader pass.

## H. Screenshot evidence

Local browser captures from 5 October 2026. No tokens, emails from real customers, or Shopify secrets are in these frames. The fit frame shows the example name Amina and `amina@example.com`, plus the expected save error.

| File | What it shows |
|---|---|
| `docs/c01-screens/01-home.png` | Desktop homepage |
| `docs/c01-screens/02-home-faq.png` | Homepage FAQ |
| `docs/c01-screens/03-fit-result.png` | Fit check save failure without Mongo |
| `docs/c01-screens/04-demo.png` | Product tour with Connect and Brand |
| `docs/c01-screens/05-pricing.png` | Single managed offer |
| `docs/c01-screens/06-walkthrough.png` | Walkthrough request form |
| `docs/c01-screens/07-signup.png` | Invite-only signup |
| `docs/c01-screens/08-login.png` | Invite-only login |
| `docs/c01-screens/09-scopes.png` | Shopify permissions wording |
| `docs/c01-screens/10-home-mobile.png` | Homepage at phone width |
| `docs/c01-screens/11-fit-mobile.png` | Fit check at phone width |
| `docs/c01-screens/12-nav-mobile.png` | Opened mobile nav |

## I. Founder manual QA

1. With dashboard Mongo available, submit `/fit` three times: operating store plus branded app; planning a store with no URL; not Shopify, or a goal other than a branded app. Confirm the three titles and that each row appears in Mongo.
2. Submit `/schedule-demo` and confirm the row and, if `RESEND_API_KEY` is configured on the preview, the email to `sales@rendernext.io`.
3. Sign in as a platform operator and open `/dashboard/admin/leads`. Confirm the rows and that no Shopify token is shown.
4. Sign in as a store owner and confirm the same page is forbidden.
5. On `/demo`, confirm Connect does not start OAuth until the existing store-address validation passes, and that Brand does not publish.
6. Read `/pricing`, `/terms`, and `/privacy` and confirm you are willing to leave amounts and cancellation terms off the site.
7. Do not merge and do not promote a preview to production until that review is done.

## J. Pull request and deploy

The review pull request is on `cursor/c01-evaluation-purchase-e8e0` against `main`. It is the place to read the diff. It is not approval to merge.

Local preview, from this repo:

```bash
npm ci
npm run dev
```

Then open `http://127.0.0.1:3002/`, `/fit`, `/pricing`, `/demo`, `/schedule-demo`, `/signup`, and `/login`. Fit and walkthrough saves need `MONGODB_URI`. The lead inbox also needs a signed-in platform operator and `NEXT_PUBLIC_API_URL` pointing at a backend that answers `GET /api/v1/admin/build-requests`.

No production deploy was performed.
