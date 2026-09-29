import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

/**
 * Quiet Home card while the newest preview is queued or building.
 * Build keeps the progress cards and the install-code wait frame.
 */
export function HomePreviewBuildingCard() {
  return (
    <section data-home-preview-building="" className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-5">
      <div className="min-w-0 max-w-md">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-slate-950">Your preview is building</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Open Build to follow progress. A scannable install code will appear there when it is ready.
        </p>
        <Button asChild className="mt-4 h-11 rounded-lg px-4">
          <Link href={BUILD_MY_APP_HREF}>Open Build</Link>
        </Button>
      </div>
    </section>
  );
}
