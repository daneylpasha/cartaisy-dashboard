import localFont from 'next/font/local';

/** SIL OFL 1.1. See Manrope-OFL.txt. Self-hosted variable file, no runtime CDN. */
export const manrope = localFont({
  src: './Manrope-Variable.woff2',
  display: 'swap',
  weight: '200 800',
  style: 'normal',
  variable: '--font-manrope',
  adjustFontFallback: 'Arial',
  fallback: ['Arial', 'sans-serif'],
});

export const marketingTypeClass = `${manrope.variable} ${manrope.className} marketing-type`;
