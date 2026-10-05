import Link from 'next/link';
import {
  eligibility,
  managedOffer,
  offerExcludes,
  offerIncludes,
  offerPaths,
  offerPositioning,
  ownership,
} from '@/lib/marketing/offer';

const card = 'rounded-2xl border border-white/10 bg-white/5 p-6';

export default function HomeProspect() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:px-8 lg:pt-36">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-purple-200">{offerPositioning.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            {offerPositioning.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{offerPositioning.subhead}</p>
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
        </div>
        <div className={card}>
          <h2 className="text-lg font-semibold text-white">{managedOffer.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">{managedOffer.structure}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{managedOffer.notIncludedInTheProduct}</p>
          <Link
            href={offerPaths.pricing}
            className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {offerPositioning.pricingCta}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="who-heading">
        <h2 id="who-heading" className="text-2xl font-semibold text-white">
          Who it is for
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className={card}>
            <h3 className="font-semibold text-white">Operating store</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200">{eligibility.operating}</p>
          </article>
          <article className={card}>
            <h3 className="font-semibold text-white">Pre-launch</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200">{eligibility.prelaunch}</p>
          </article>
          <article className={card}>
            <h3 className="font-semibold text-white">Website first</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200">{eligibility.websiteFirst}</p>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8" aria-labelledby="included-heading">
        <div>
          <h2 id="included-heading" className="text-2xl font-semibold text-white">
            Included, with the limits we can stand behind
          </h2>
          <ul className="mt-6 space-y-4">
            {offerIncludes.map((item) => (
              <li key={item.title} className={card}>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Not part of the offer</h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-200">
            {offerExcludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-6 text-slate-300">{ownership.accounts}</p>
        </div>
      </section>
    </>
  );
}
