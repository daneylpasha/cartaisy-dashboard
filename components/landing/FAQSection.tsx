import { homeFaqs } from '@/lib/marketing/offer';

export default function FAQSection() {
  return (
    <section className="bg-[#121212]" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight text-white">
          Questions
        </h2>
        <div className="mt-6 space-y-3">
        {homeFaqs.map((faq) => (
          <details key={faq.question} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <summary className="cursor-pointer text-base font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-200">{faq.answer}</p>
          </details>
        ))}
        </div>
      </div>
    </section>
  );
}
