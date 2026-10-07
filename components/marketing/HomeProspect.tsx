import Image from 'next/image';
import Link from 'next/link';
import {
  homeAudiences,
  homeIncludes,
  homeManaged,
  offerExcludes,
  offerPaths,
  offerPositioning,
} from '@/lib/marketing/offer';
import { inkPrimaryMotionClass } from '@/lib/marketing/publicInk';

const offerPoints = homeIncludes.filter((item) => item.title !== 'Your brand');

const shell = 'mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-12';
const primaryAction =
  `inline-flex h-12 items-center justify-center rounded-[4px] bg-white px-5 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${inkPrimaryMotionClass}`;
const secondaryAction =
  'inline-flex h-12 items-center justify-center rounded-[4px] border border-white/15 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
const band = 'mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20';
const card = 'flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-5';
const sectionHeading = 'text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-white';

const brandControls = ['App name', 'Logo', 'Brand colors', 'App icon', 'Splash image'] as const;
const [headlineLead, headlineRest] = offerPositioning.headline.split(', ');

export default function HomeProspect() {
  return (
    <>
      <section className="overflow-x-clip pb-4 pt-24 sm:pt-28">
        <div
          className={`${shell} grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-12`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-normal text-purple-200">{offerPositioning.eyebrow}</p>
            <h1
              aria-label={`${headlineLead}, ${headlineRest}`}
              className="font-heading mt-4 text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#f6f3ee] min-[400px]:text-[2.375rem] sm:text-[2.75rem] lg:text-[2.75rem] xl:text-[3.125rem]"
            >
              <span>{headlineLead},</span>
              <span>{' '}</span>
              <br className="hidden lg:block" aria-hidden="true" />
              <span>{headlineRest}</span>
            </h1>
            <p className="mt-5 max-w-[52ch] text-base font-normal leading-[1.6] text-slate-300 sm:text-lg">
              {offerPositioning.subhead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={offerPaths.fit} className={primaryAction}>
                {offerPositioning.primaryCta}
              </Link>
              <Link href={offerPaths.demo} className={secondaryAction}>
                {offerPositioning.secondaryCta}
              </Link>
            </div>
          </div>
          <figure className="min-w-0">
            <Image
              src="/marketing/c01-hero-still.webp"
              alt="Illustration of a branded mobile shopping app for a fictional home-goods store, with floating product cards."
              width={1536}
              height={1024}
              priority
              quality={90}
              sizes="(min-width: 1280px) 700px, (min-width: 1024px) 55vw, 100vw"
              className="h-auto w-full"
            />
          </figure>
        </div>
      </section>

      <section
        className="scroll-mt-28 bg-[linear-gradient(180deg,#100e13_0%,#17141d_48%,#100e13_100%)]"
        aria-labelledby="brand-heading"
      >
        <div className={`${shell} grid items-center gap-8 py-16 lg:grid-cols-2 lg:gap-16 lg:py-28`}>
          <div className="order-1 lg:order-2">
            <h2
              id="brand-heading"
              className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#f6f3ee] sm:text-[2.5rem] lg:text-[3rem]"
            >
              Your brand, made mobile.
            </h2>
            <p className="mt-4 max-w-[48ch] text-base font-normal leading-[1.6] text-slate-300 sm:text-lg">
              Bring your logo, colors, and app assets into a shopping experience that feels like your store.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-medium leading-6 text-slate-200">
              {brandControls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-6 max-w-[48ch] text-base font-normal leading-[1.6] text-slate-300">
              Logo and colors can update without a new build. The native icon, launcher name, and splash require a new build.
            </p>
          </div>
          <figure className="order-2 min-w-0 lg:order-1">
            <Image
              src="/marketing/c01-brand-identities.webp"
              alt="Illustration of three fictional brand kits named STILL, ARC, and MIRA, with color swatches, a vase, a backpack, and a bottle."
              width={1536}
              height={1024}
              loading="lazy"
              quality={90}
              sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full"
            />
          </figure>
        </div>
      </section>

      <section aria-labelledby="who-heading">
        <div className={band}>
          <h2 id="who-heading" className={sectionHeading}>
            Wherever you are in your Shopify journey
          </h2>
          <ul className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
            {homeAudiences.map((item) => (
              <li key={item.title} className={card}>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-base font-normal leading-[1.6] text-slate-200">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#121212]" aria-labelledby="included-heading">
        <div className={band}>
          <h2 id="included-heading" className={sectionHeading}>
            What managed includes
          </h2>
          <p className="mt-4 max-w-3xl text-base font-normal leading-[1.6] text-slate-200">{homeManaged}</p>
          <ul className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
            {offerPoints.map((item) => (
              <li key={item.title} className={card}>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-base font-normal leading-[1.6] text-slate-200">{item.body}</p>
              </li>
            ))}
          </ul>
          <Link
            href={offerPaths.pricing}
            className="mt-8 inline-flex min-h-11 items-center text-base font-semibold text-white underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {offerPositioning.pricingCta}
          </Link>
          <details className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
            <summary className="cursor-pointer text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 rounded-sm">
              Offer limits
            </summary>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-base font-normal leading-[1.6] text-slate-200">
              {offerExcludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      <section className="bg-[#f7f4ee]" aria-labelledby="path-heading">
        <div className={`${shell} py-10 lg:py-14`}>
          <div className="flex flex-col lg:grid">
            <figure className="order-2 overflow-hidden lg:order-none lg:col-start-1 lg:row-start-1">
              <Image
                src="/marketing/c01-ridgeline-setup.webp"
                alt="Illustration of a setup workflow for a fictional outdoor store named Ridgeline, shown as catalog, brand, build request, and home preview panels on a mountain landscape."
                width={1983}
                height={793}
                loading="lazy"
                quality={90}
                sizes="(min-width: 1024px) 1200px, 140vw"
                className="-ml-[28%] h-auto w-[128%] max-w-none lg:ml-0 lg:w-full"
              />
            </figure>
            <div className="order-1 py-8 lg:order-none lg:col-start-1 lg:row-start-1 lg:flex lg:w-[26%] lg:items-center lg:py-6 lg:pr-4">
              <div>
                <h2
                  id="path-heading"
                  className="font-heading text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1b3a2f] sm:text-[2rem]"
                >
                  A guided path from store to app.
                </h2>
                <p className="mt-4 max-w-[64ch] text-base font-normal leading-[1.6] text-[#244538] lg:max-w-[36ch]">
                  Connect your Shopify store, sync your catalog, set your brand, and prepare your app build with guidance from Cartaisy.
                </p>
                <Link
                  href={offerPaths.walkthrough}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-[4px] bg-[#1b3a2f] px-5 text-sm font-semibold text-[#f7f4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b3a2f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ee]"
                >
                  {offerPositioning.walkthroughCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
