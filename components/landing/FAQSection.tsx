import Link from 'next/link';
import { homeFaqs, offerPaths } from '@/lib/marketing/offer';

const homepageFaqs = homeFaqs.map((faq) =>
  faq.question === 'Does Cartaisy guarantee sales?'
    ? {
        ...faq,
        question: 'What results should I expect?',
        answer: faq.answer.replace(/^No\. /, ''),
      }
    : faq,
);

export default function FAQSection() {
  return (
    <section className="bg-[#121212]" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 id="faq-heading" className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-white lg:text-[2.75rem]">
          Before you get started.
        </h2>
        <div className="mt-6 space-y-3">
        {homepageFaqs.map((faq) => (
          <details key={faq.question} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <summary className="cursor-pointer rounded-sm text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
              {faq.question}
            </summary>
            <p className="mt-3 text-base font-normal leading-[1.6] text-slate-200">{faq.answer}</p>
          </details>
        ))}
        </div>
        <Link
          href={offerPaths.docsFaq}
          className="mt-8 inline-flex min-h-11 items-center rounded-sm text-base font-semibold text-white underline decoration-white/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          Read all FAQs
        </Link>
      </div>
    </section>
  );
}
