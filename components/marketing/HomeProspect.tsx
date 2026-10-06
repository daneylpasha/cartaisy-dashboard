import Link from 'next/link';
import {
  eligibility,
  homeIncludes,
  homeManaged,
  homePlatform,
  homeSteps,
  offerExcludes,
  offerPaths,
  offerPositioning,
} from '@/lib/marketing/offer';

const audiences = [
  { title: 'You already sell on Shopify', body: eligibility.operating },
  { title: 'You are planning a Shopify store', body: eligibility.prelaunch },
  { title: 'Start with the website', body: eligibility.websiteFirst },
] as const;

export default function HomeProspect() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pt-36">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-purple-200">{offerPositioning.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          {offerPositioning.headline}
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-200">{offerPositioning.subhead}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={offerPaths.fit}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {offerPositioning.primaryCta}
          </Link>
          <Link
            href={offerPaths.demo}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {offerPositioning.secondaryCta}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="who-heading">
        <h2 id="who-heading" className="text-2xl font-semibold text-white">
          Who it suits
        </h2>
        <ul className="mt-5 space-y-4">
          {audiences.map((item) => (
            <li key={item.title}>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="included-heading">
        <h2 id="included-heading" className="text-2xl font-semibold text-white">
          What managed includes
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-200">{homeManaged}</p>
        <ul className="mt-5 space-y-4">
          {homeIncludes.map((item) => (
            <li key={item.title}>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border border-white/10 p-4">
          <h3 className="font-semibold text-white">Where it is available</h3>
          <p className="mt-2 text-sm leading-6 text-slate-200">{homePlatform.android}</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{homePlatform.ios}</p>
        </div>
        <h3 className="mt-8 font-semibold text-white">Not included</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          {offerExcludes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link
          href={offerPaths.pricing}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          {offerPositioning.pricingCta}
        </Link>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="start-heading">
        <h2 id="start-heading" className="text-2xl font-semibold text-white">
          How to get started
        </h2>
        <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-6 text-slate-300">
          {homeSteps.map((step) => (
            <li key={step.title}>
              <span className="font-semibold text-white">{step.title}. </span>
              {step.body}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
