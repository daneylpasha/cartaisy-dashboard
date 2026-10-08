import Image from 'next/image';
import Link from 'next/link';
import {
  homeAudiences,
  homeIncludes,
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
const sectionHeading =
  'font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-white lg:text-[2.75rem]';
const supportCopy = 'text-base font-normal leading-[1.6] text-slate-300 lg:text-[1.25rem]';
const cardTitle = 'text-xl font-semibold leading-snug text-white';
const cardBody = 'mt-2 text-base font-normal leading-[1.6] text-slate-200';
const capabilities = ['Your brand', 'Shopify catalog', 'Shopify checkout'] as const;
const heroSupport =
  'Give your brand a dedicated mobile shopping experience, built around your Shopify catalog and checkout. Explore the product and plan your setup with Cartaisy.';

const brandControls = ['App name', 'Logo', 'Brand colors', 'App icon', 'Splash image'] as const;
const youBring = [
  'Your Shopify store and catalog',
  'Your brand assets',
  'Your Apple Developer and Google Play accounts and listings',
] as const;
const withCartaisy = [
  'Guided store connection and catalog sync',
  'Supported brand and home configuration',
  'Preparation of a tracked build request',
] as const;
const [headlineLead, headlineRest] = offerPositioning.headline.split(', ');
const emptyPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function HomeProspect() {
  return (
    <>
      <section className="overflow-x-clip pb-4 pt-24 sm:pt-28">
        <div
          className={`${shell} grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 min-[1200px]:grid-cols-[minmax(max-content,1.05fr)_minmax(18rem,0.95fr)] min-[1200px]:gap-12`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-normal text-purple-200">{offerPositioning.eyebrow}</p>
            <h1
              aria-label={`${headlineLead}, ${headlineRest}`}
              className="font-heading mt-4 text-[2.375rem] font-semibold leading-[1.05] tracking-[-0.025em] text-[#f6f3ee] sm:text-[2.75rem] lg:text-[3.75rem] xl:text-[4rem]"
            >
              <span className="min-[1200px]:block min-[1200px]:whitespace-nowrap">{headlineLead},</span>
              <span className="min-[1200px]:hidden">{' '}</span>
              <span className="min-[1200px]:block">{headlineRest}</span>
            </h1>
            <p className={`mt-5 max-w-[42ch] ${supportCopy}`}>{heroSupport}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={offerPaths.demo} className={primaryAction}>
                See how it works
              </Link>
              <Link href={offerPaths.walkthrough} className={secondaryAction}>
                Request a walkthrough
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
        <ul className={`${shell} mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-base font-medium text-[#c5c7c1]`}>
          {capabilities.map((item, index) => (
            <li key={item} className="inline-flex min-w-0 items-center gap-3">
              {index > 0 ? (
                <span className="text-white/30" aria-hidden="true">
                  /
                </span>
              ) : null}
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-black" aria-labelledby="product-tour-heading">
        <div className={`${shell} py-16 lg:py-24`}>
          <p className="text-sm font-medium uppercase tracking-normal text-purple-200">Product tour</p>
          <h2
            id="product-tour-heading"
            className="font-heading mt-4 text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#f6f3ee] lg:text-[2.75rem]"
          >
            Explore the product before you decide.
          </h2>
          <p className={`mt-4 max-w-[46ch] ${supportCopy}`}>
            See the branding settings you can explore in Cartaisy’s product tour.
          </p>
          <Link href={offerPaths.demo} className={`mt-8 ${primaryAction}`}>
            Open the interactive tour
          </Link>
          <div className="mt-10">
            <picture className="hidden sm:block">
              <source media="(max-width: 639px)" srcSet={emptyPixel} />
              <img
                src="/marketing/c01-brand-step-arc.png"
                alt="A sample branding setup in Cartaisy, showing the app name, logo, icon, splash, and color fields."
                width={2520}
                height={2296}
                className="mx-auto h-auto w-full max-w-[880px]"
              />
            </picture>
            <div className="mx-auto w-full max-w-[360px] space-y-4 sm:hidden">
              <picture>
                <source media="(min-width: 640px)" srcSet={emptyPixel} />
                <img
                  src="/marketing/c01-brand-step-arc-name.png"
                  alt="A sample branding setup in Cartaisy, showing the app name field."
                  width={918}
                  height={306}
                  className="h-auto w-full"
                />
              </picture>
              <picture>
                <source media="(min-width: 640px)" srcSet={emptyPixel} />
                <img
                  src="/marketing/c01-brand-step-arc-colors.png"
                  alt="A sample branding setup in Cartaisy, showing the primary and secondary color settings."
                  width={918}
                  height={1056}
                  className="h-auto w-full"
                />
              </picture>
            </div>
          </div>
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
              className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#f6f3ee] lg:text-[2.75rem]"
            >
              Your brand, made mobile.
            </h2>
            <p className={`mt-4 max-w-[48ch] ${supportCopy}`}>
              Bring your logo, colors, and app assets into a shopping experience that feels like your store.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-base font-medium leading-6 text-slate-200">
              {brandControls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <details className="mt-6 max-w-[48ch]">
              <summary className="cursor-pointer rounded-sm text-base font-medium text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
                Branding details
              </summary>
              <p className={`mt-3 ${supportCopy}`}>
                Logo and colors can update without a new build. The native icon, launcher name, and splash require a new build.
              </p>
            </details>
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

      <section className="bg-[#121212]" aria-labelledby="included-heading">
        <div className={band}>
          <h2 id="included-heading" className={sectionHeading}>
            A clearer setup, with you in control.
          </h2>
          <p className={`mt-4 max-w-3xl ${supportCopy}`}>
            Work through your Shopify connection, catalog, branding and home layout with Cartaisy.
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className={cardTitle}>You bring</h3>
              <ul className="mt-4 space-y-2 text-base font-normal leading-[1.6] text-slate-200">
                {youBring.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={cardTitle}>With Cartaisy</h3>
              <ul className="mt-4 space-y-2 text-base font-normal leading-[1.6] text-slate-200">
                {withCartaisy.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <ul className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
            {offerPoints.map((item) => (
              <li key={item.title} className={card}>
                <h3 className={cardTitle}>{item.title}</h3>
                <p className={cardBody}>{item.body}</p>
              </li>
            ))}
          </ul>
          <Link
            href={offerPaths.pricing}
            className="mt-8 inline-flex min-h-11 items-center text-base font-semibold text-white underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 rounded-sm"
          >
            See what the offer includes
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
                  className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1b3a2f] lg:text-[2.75rem]"
                >
                  A guided path from store to app.
                </h2>
                <p className="mt-4 max-w-[64ch] text-base font-normal leading-[1.6] text-[#244538] lg:max-w-[36ch] lg:text-[1.25rem]">
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

      <section aria-labelledby="who-heading">
        <div className={band}>
          <h2 id="who-heading" className={sectionHeading}>
            Wherever you are in your Shopify journey
          </h2>
          <ul className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
            {homeAudiences.map((item) => (
              <li key={item.title} className={card}>
                <h3 className={cardTitle}>{item.title}</h3>
                <p className={cardBody}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
