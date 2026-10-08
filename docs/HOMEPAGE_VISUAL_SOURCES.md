# Homepage visual sources

## Product tour screenshot

The homepage product-tour image is a crop of the real Brand step. It is not a redraw, a phone frame, a catalog, or a home layout.

- Component: `BrandingStep` in `components/onboarding/steps/BrandingStep.tsx`, rendered with `tourMode`.
- Draft type: `BrandingDraft` in `lib/onboarding/types.ts`.
- Component commit: `1789605b679ccd53339a18ba35944c5b146543dc`. That component, `ProductTour`, and `/demo` were not modified for this capture.
- Shipped file: `public/marketing/c01-brand-step-arc.png`, added in `f3f9e0f38d8193bad1c7442c744bfd9066cc9142`.
- Capture route: a temporary page at `app/capture-brand-fixture/page.tsx`. It is not committed and is not a shipped route. Handlers only updated local React state or returned without doing work. No save, upload, Shopify, or build call was wired.
- Viewport: 1440×1400 CSS pixels, device scale 2, screenshot clip scale 2. The crop is the form block that contains the app name, logo, icon, splash, and color controls (`#app-name`’s `.space-y-8` ancestor). Output pixels: 2520×2296.
- Crop excludes the first-build instructions panel (`data-install-preview="instructions"`) and the read-only Shopify details. Those regions were rendered, then left outside the crop. Shopify rows showed “Not available yet” because the seed passed null counts and a disconnected snapshot. They are not in the shipped image.

### Seed

| Field | Value |
| --- | --- |
| appName | `ARC` |
| logoUrl | `null` |
| iconUrl | `null` |
| splashUrl | `null` |
| splashPersisted | `true` |
| iconPersisted | `true` |
| primaryColor / primaryExplicit | `#1B3A2F` |
| secondaryColor / secondaryExplicit | `#D1C2BC` |
| installPreview | `{ phase: 'unavailable', installs: [] }` |
| connection | disconnected, null shop domain and shop id |
| catalog | null product count, null order count, empty collections |

`public/marketing/c01-brand-identities.webp` shows STILL, ARC, and MIRA as one illustration. It is not a logo, app icon, or splash file, and the Brand step only draws `blob:` or `http(s)` image URLs. No suitable existing asset was placed in those slots. The empty slots are the component’s real empty state. The name and colors are a local fictional seed. `#D1C2BC` is in the beige range of that illustration. `#1B3A2F` is the forest green already used on the homepage.

### Requests during capture

Chrome recorded 32 requests, all to `http://127.0.0.1:3002`. None were `/api/`, Shopify, GraphQL, upload, or an external host.

- Document: `/capture-brand-fixture`
- Same-origin Next.js dev scripts, CSS, and HMR client
- Same-origin fonts: Geist, Manrope, and `/__nextjs_font/geist-latin.woff2`
- `/site.webmanifest`, `/favicon.ico`, `/favicon-16x16.png`

No image request was made for a logo, icon, or splash.

The homepage shows this file from 640px up, centered, with a maximum width of 880px.

## Product tour, narrow screens

Below 640px the homepage shows two crops from the same Brand step and the same ARC seed. They are not a scaled copy of the desktop image. The empty logo, icon, and splash slots were rendered and left outside these crops.

- Component: `BrandingStep` in `components/onboarding/steps/BrandingStep.tsx`, rendered with `tourMode`.
- Component commit: `1789605b679ccd53339a18ba35944c5b146543dc`. `BrandingStep`, `ProductTour`, and `/demo` were not modified.
- Seed: the same table as the desktop capture. App name `ARC`, primary `#1B3A2F`, secondary `#D1C2BC`, logo, icon, and splash `null`, disconnected snapshot, null product and order counts, empty collections, `installPreview` phase `unavailable`.
- Capture route: temporary `app/capture-brand-fixture/page.tsx`. It is not committed. Handlers only updated local React state or returned without doing work.
- Viewport: 360×1600 CSS pixels. Device scale factor 3. Screenshot clip scale 1.
- App-name crop: CSS box x 27, y 637.5, width 306, height 102. Output `public/marketing/c01-brand-step-arc-name.png`, 918×306 pixels. That box is the app-name label, the `ARC` input, and its hint.
- Color crop: CSS box x 27, y 1065.5, width 306, height 352. Output `public/marketing/c01-brand-step-arc-colors.png`, 918×1056 pixels. That box is the primary and secondary color controls, including the hex fields. It does not include the logo, icon, or splash slots.
- In the capture, the app-name label was 14px, the app-name input was 16px, the color labels were 14px, and the hex text fields were 14px.

### Requests during the narrow capture

Chrome recorded 31 requests, all to `http://127.0.0.1:3002`. None were `/api/`, Shopify, GraphQL, upload, MongoDB, or an external host.

- Document: `/capture-brand-fixture`
- Same-origin Next.js dev scripts, CSS, and HMR client
- Same-origin fonts: Geist, Manrope, and the layout font files
- `/site.webmanifest`, `/favicon.ico`, `/favicon-16x16.png`

No image request was made for a logo, icon, or splash.
