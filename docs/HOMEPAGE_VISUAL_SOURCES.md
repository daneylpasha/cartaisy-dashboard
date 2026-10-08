# Homepage visual sources

## Product tour posters

The homepage product-tour images are founder-supplied raster posters. They are styled illustrations of app naming and color fields. They are not live screenshots, not the interactive Brand step, and not proof of a delivered app. The live interface stays at `/demo`.

The earlier BrandingStep crops (`c01-brand-step-arc.png`, `c01-brand-step-arc-name.png`, and `c01-brand-step-arc-colors.png`) are no longer served on the homepage and are not in `public/marketing/`.

### Supplied files

| Role | Public file | Source copy | SHA256 | Intrinsic size |
| --- | --- | --- | --- | --- |
| 640px and wider | `public/marketing/cartaisy-branding-poster-v1-desktop.png` | `docs/assets/source/cartaisy-branding-poster-v1-desktop.png` | `be540a190e49f3e066a238377f72667ee9e9b976f914dcee2d4a9874de266587` | 1536×1024 |
| Below 640px | `public/marketing/cartaisy-branding-poster-v1-mobile.png` | `docs/assets/source/cartaisy-branding-poster-v1-mobile.png` | `4c11997e7662ca83655f9ca4fee82a4311581e18c6d2908f45538861c11d2944` | 1122×1402 |

The public files and the `docs/assets/source/` copies are byte-identical to the founder originals. The page serves those PNG files directly. Next.js image optimization is not applied to them, so the browser receives the supplied pixels.

### Placement

- At 640px and wider, the desktop poster is shown. Below 640px, the mobile poster is shown. The unused file is not selected.
- Each image uses `width: 100%` and `height: auto`, is centered, and is capped at 1104px or the section content width when that is narrower.
- There is no `object-fit: cover` crop and no visible caption.
- The `width` and `height` attributes reserve the intrinsic size: 1536×1024 for the desktop poster and 1122×1402 for the mobile poster.
- The illustration uses the fictional name ARC, forest `#1B3A2F`, and stone `#D1C2BC`. It illustrates naming and color fields the product already supports.
