import Link from 'next/link';
import { Check } from 'lucide-react';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';
import { homeSubmitTitle, type HomeSubmitNotice } from '@/lib/storeSubmit/contract';

const LINK =
  'mt-4 inline-flex text-sm font-medium text-slate-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

function NoticeLine({ notice }: { notice: HomeSubmitNotice }) {
  if (notice.tone === 'progress') {
    return (
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-950 motion-safe:animate-pulse" />
        <p className="text-sm leading-6 text-slate-600">
          <span className="font-medium text-slate-950">{notice.label}. </span>
          {notice.body}
        </p>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3">
      {notice.tone === 'submitted' ? (
        <span
          aria-hidden
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white"
        >
          <Check className="size-4" strokeWidth={2.5} />
        </span>
      ) : (
        <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-red-700" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{notice.label}</p>
        <p className="font-heading text-sm font-semibold tracking-tight text-slate-950">{notice.headline}</p>
        <p
          className={`mt-1 text-sm leading-6 ${notice.tone === 'failed' ? 'text-red-800' : 'text-slate-600'}`}
          role={notice.tone === 'failed' ? 'alert' : 'status'}
        >
          {notice.body}
        </p>
      </div>
    </li>
  );
}

/**
 * Quiet store-submit notes on Home. Absent until a submit is moving, sent, or failed.
 * Build is where the merchant starts or retries a submit.
 */
export function HomeSubmitCard({ notices }: { notices: HomeSubmitNotice[] }) {
  const title = homeSubmitTitle(notices);
  if (!title) return null;
  const retry = notices.every((notice) => notice.tone === 'failed');

  return (
    <section data-home-submit="" className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-5">
      <h2 className="font-heading text-sm font-semibold tracking-tight text-slate-950">{title}</h2>
      <ul className="mt-3 space-y-3">
        {notices.map((notice) => (
          <NoticeLine key={notice.platform} notice={notice} />
        ))}
      </ul>
      <Link href={BUILD_MY_APP_HREF} className={LINK}>
        {retry ? 'Open Build to try again' : 'Open Build'}
      </Link>
    </section>
  );
}
