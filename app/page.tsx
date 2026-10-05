import type { Metadata } from 'next';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import FAQSection from '@/components/landing/FAQSection';
import HomeProspect from '@/components/marketing/HomeProspect';
import RedirectIfSignedIn from '@/components/marketing/RedirectIfSignedIn';
import { offerSeo } from '@/lib/marketing/offer';
import { generateMetadata as genMeta } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Home',
  description: offerSeo.description,
  keywords: [...offerSeo.keywords],
});

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <RedirectIfSignedIn />
      <LandingNavbar />
      <HomeProspect />
      <FAQSection />
      <LandingFooter />
    </main>
  );
}
