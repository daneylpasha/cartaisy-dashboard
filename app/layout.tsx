import type { Metadata } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { OrganizationSchema, SoftwareApplicationSchema } from "@/components/landing/StructuredData";
import { AnalyticsProvider } from "@/components/analytics";
import ConsentGatedAnalytics from "@/components/analytics/ConsentGatedAnalytics";
import { ShopifyClaimFragmentBoot } from "@/components/shopify/ShopifyClaimFragmentBoot";
import { CookieConsentProvider, CookieBanner } from "@/components/cookies";
import { siteConfig } from "@/lib/seo";
import "./globals.css";

const geistSans = localFont({
  src: "../public/fonts/Geist-VariableFont_wght.ttf",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Managed mobile apps for Shopify`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Managed mobile apps for Shopify`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Managed mobile apps for Shopify`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        <ShopifyClaimFragmentBoot />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <OrganizationSchema />
        <SoftwareApplicationSchema />
        <CookieConsentProvider>
          <AnalyticsProvider>
            <SessionProvider>{children}</SessionProvider>
          </AnalyticsProvider>
          <ConsentGatedAnalytics />
          <CookieBanner />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
