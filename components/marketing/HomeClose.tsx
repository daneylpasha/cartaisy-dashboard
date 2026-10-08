import Link from 'next/link';
import { offerPaths } from '@/lib/marketing/offer';
import { inkPrimaryMotionClass } from '@/lib/marketing/publicInk';

const band = 'bg-[#e7efe4] text-[#1b3a2f]';
const primary =
  `inline-flex h-12 items-center justify-center rounded-[4px] border border-[#1b3a2f] bg-white px-5 text-sm font-semibold text-[#111210] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b3a2f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7efe4] ${inkPrimaryMotionClass} hover:border-[#111210]`;
const textLink =
  'inline-flex h-12 items-center rounded-[4px] text-base font-semibold text-[#1b3a2f] underline decoration-[#1b3a2f]/40 underline-offset-4 hover:text-[#143028] hover:decoration-[#143028] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b3a2f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7efe4]';

export default function HomeClose() {
  return (
    <section className={band} aria-labelledby="close-heading">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2
          id="close-heading"
          className="font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] lg:text-[2.75rem]"
        >
          Let’s talk about your store.
        </h2>
        <p className="mt-4 max-w-[46ch] text-base font-normal leading-[1.6] lg:text-[1.25rem]">
          Explore Cartaisy, share what you want to build, and discuss the scope and price before work begins.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={offerPaths.walkthrough} className={primary}>
            Request a walkthrough
          </Link>
          <Link href={offerPaths.demo} className={textLink}>
            See how it works
          </Link>
        </div>
        <p className="mt-8 text-sm font-normal leading-6">
          Cartaisy is a product of RenderNext LLC, registered in Texas, United States.
        </p>
      </div>
    </section>
  );
}
