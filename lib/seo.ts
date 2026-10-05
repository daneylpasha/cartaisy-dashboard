import { Metadata } from 'next';
import { offerSeo } from '@/lib/marketing/offer';

export const siteConfig = {
  name: 'Cartaisy',
  description: offerSeo.description,
  url: 'https://cartaisy.com',
  ogImage: 'https://cartaisy.com/og-image.png',
  keywords: [...offerSeo.keywords],
};

export type PageSEO = {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
};

export function generateMetadata(page: PageSEO): Metadata {
  const title = page.title === 'Home'
    ? `${siteConfig.name} — ${offerSeo.title}`
    : `${page.title} | ${siteConfig.name}`;

  return {
    title,
    description: page.description,
    keywords: [...siteConfig.keywords, ...(page.keywords || [])],
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    robots: page.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      siteName: siteConfig.name,
      title,
      description: page.description,
      images: [
        {
          url: page.ogImage || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      images: [page.ogImage || siteConfig.ogImage],
    },
  };
}
