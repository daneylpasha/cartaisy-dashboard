import Image from 'next/image';
import Link from 'next/link';
import {
  eligibility,
  homeIncludes,
  homeManaged,
  homePlatform,
  offerExcludes,
  offerPaths,
  offerPositioning,
} from '@/lib/marketing/offer';

const audiences = [
  { title: 'You already sell on Shopify', body: eligibility.operating },
  { title: 'You are planning a Shopify store', body: eligibility.prelaunch },
  { title: 'Start with the website', body: eligibility.websiteFirst },
] as const;

const offerPoints = homeIncludes.filter((item) => item.title !== 'Your brand');

const shell = 'mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-12';
const primaryAction =
  'inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
const secondaryAction =
  'inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
const band = 'mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20';

const brandControls = ['App name', 'Logo', 'Brand colors', 'App icon', 'Splash image'] as const;
const [headlineLead, headlineRest] = offerPositioning.headline.split(', ');

export default function HomeProspect() {
  return (
    <>
      <section className="overflow-x-clip pt-24 sm:pt-28">
        <div className={`${shell} grid items-start gap-8 lg:grid-cols-2 lg:gap-16`}>
          <div className="lg:pt-4">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-purple-200">{offerPositioning.eyebrow}</p>
            <h1 className="font-heading mt-4 max-w-[10.5em] text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f6f3ee] min-[400px]:text-[2.375rem] sm:max-w-none sm:text-[2.75rem] lg:text-[3.75rem] xl:text-[4.25rem]">
              {headlineLead}, <span className="lg:block">{headlineRest}</span>
            </h1>
            <p className="mt-5 max-w-[52ch] text-base leading-7 text-slate-300 sm:text-lg lg:text-xl lg:leading-8">
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
          <figure className="min-w-0 lg:pt-4">
            <Image
              src="/marketing/c01-hero-still.webp"
              alt="A phone showing a branded shopping app for a fictional home-goods store, with floating product cards."
              width={1536}
              height={1024}
              priority
              quality={90}
              sizes="(min-width: 1280px) 720px, (min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full"
            />
            <figcaption className="mt-3 text-sm leading-5 text-slate-400">
              Illustrative shopping experience — fictional merchant.
            </figcaption>
          </figure>
        </div>
        <div className={`${shell} mt-10 pb-4 lg:mt-14`}>
          <h2 className="text-sm font-semibold text-white">Availability</h2>
          <div className="mt-3 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
            <p className="text-sm leading-6 text-slate-200">{homePlatform.android}</p>
            <p className="text-sm leading-6 text-slate-200">{homePlatform.ios}</p>
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
              className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#f6f3ee] sm:text-[2.5rem] lg:text-[3rem]"
            >
              Your brand, made mobile.
            </h2>
            <p className="mt-4 max-w-[48ch] text-base leading-7 text-slate-300 sm:text-lg">
              Bring your logo, colors, and app assets into a shopping experience that feels like your store.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm leading-6 text-slate-200">
              {brandControls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-6 max-w-[48ch] text-sm leading-6 text-slate-400">
              Logo and colors can update without a new build. The native icon, launcher name, and splash require a new build.
            </p>
          </div>
          <figure className="order-2 min-w-0 lg:order-1">
            <Image
              src="/marketing/c01-brand-identities.webp"
              alt="Three fictional brand kits named STILL, ARC, and MIRA, with color swatches, a vase, a backpack, and a bottle."
              width={1536}
              height={1024}
              loading="lazy"
              quality={90}
              sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full"
            />
            <figcaption className="mt-3 text-sm leading-5 text-slate-400">Illustrative merchant identities.</figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="who-heading">
        <div className={band}>
          <h2 id="who-heading" className="text-3xl font-semibold tracking-tight text-white">
            Who it suits
          </h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {audiences.map((item) => (
              <li key={item.title}>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#121212]" aria-labelledby="included-heading">
        <div className={band}>
          <h2 id="included-heading" className="text-3xl font-semibold tracking-tight text-white">
            What managed includes
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">{homeManaged}</p>
          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            <ul className="space-y-5">
              {offerPoints.map((item) => (
                <li key={item.title}>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.body}</p>
                </li>
              ))}
            </ul>
            <div>
              <h3 className="font-semibold text-white">Not included</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                {offerExcludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link
                href={offerPaths.pricing}
                className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                {offerPositioning.pricingCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ee]" aria-labelledby="path-heading">
        <div className="h-14 bg-gradient-to-b from-[#121212] to-[#f7f4ee] sm:h-16" aria-hidden="true" />
        <div className={`${shell} pb-10 lg:pb-14`}>
          <div className="flex flex-col lg:grid">
            <figure className="order-2 overflow-hidden lg:order-none lg:col-start-1 lg:row-start-1">
              <Image
                src="/marketing/c01-ridgeline-setup.webp"
                alt="A fictional outdoor merchant named Ridgeline, shown as catalog, brand, build request, and home preview panels on a mountain landscape."
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
                  className="font-heading text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[#1b3a2f] sm:text-[2rem]"
                >
                  A guided path from store to app.
                </h2>
                <p className="mt-4 max-w-[36ch] text-base leading-7 text-[#244538]">
                  Connect your Shopify store, sync your catalog, set your brand, and prepare your app build with guidance from Cartaisy.
                </p>
                <Link
                  href={offerPaths.walkthrough}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#1b3a2f] px-5 text-sm font-semibold text-[#f7f4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b3a2f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ee]"
                >
                  {offerPositioning.walkthroughCta}
                </Link>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-5 text-[#3d5348]">Illustrative setup workflow — fictional merchant.</p>
          <div className="mt-5 grid gap-3 border-t border-[#1b3a2f]/15 pt-4 sm:grid-cols-2">
            <p className="text-sm leading-6 text-[#1b3a2f]">{homePlatform.android}</p>
            <p className="text-sm leading-6 text-[#1b3a2f]">{homePlatform.ios}</p>
          </div>
        </div>
        <div className="h-14 bg-gradient-to-b from-[#f7f4ee] to-[#121212] sm:h-16" aria-hidden="true" />
      </section>
    </>
  );
}
