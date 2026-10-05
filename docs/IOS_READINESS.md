# iOS readiness

Status: TODO. Not a production offer.

## Current state

- A sample Android branded build was installed on a physical device on 4 August 2026. That install is not a public download on the marketing site.
- No merchant or sample iOS binary is treated as ready. Apple Developer membership for that path was not in place when the offer evidence was written.
- The dashboard can still record an iOS build request and show Waiting on Apple. That status is not a claim that a production iOS app exists.
- Public pages must not say Cartaisy ships a production iOS app, a TestFlight link, or an App Store listing.

## What would close this

- An Apple Developer account the merchant owns.
- A successful iOS build for that store.
- A founder decision that the binary is allowed to be described in public.

Until those exist, copy stays in `lib/marketing/offer.ts` as `iosReadiness`.
