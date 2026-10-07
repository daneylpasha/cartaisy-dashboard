import { ChevronRight } from 'lucide-react';
import {
  shopifyPermissionCategories,
  shopifyPermissionNames,
  shopifyPermissionNamesSummary,
  shopifyPermissionsCaveat,
  shopifyPermissionsIntro,
} from '@/lib/marketing/offer';

const summaryClass =
  'flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-[4px] text-base font-medium text-[#f6f3ee] marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6C4A1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210] [&::-webkit-details-marker]:hidden';

export default function ShopifyPermissionsDisclosure() {
  return (
    <div className="mt-3 min-w-0 space-y-4 text-sm leading-7">
      <p>{shopifyPermissionsIntro}</p>
      <ul className="list-disc space-y-2 pl-5">
        {shopifyPermissionCategories.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>{shopifyPermissionsCaveat}</p>
      <details className="group min-w-0">
        <summary className={summaryClass}>
          <ChevronRight className="size-4 shrink-0 text-[#B6C4A1] transition-transform group-open:rotate-90" aria-hidden />
          <span>{shopifyPermissionNamesSummary}</span>
        </summary>
        <ul className="mt-3 min-w-0 space-y-1 break-all pl-7">
          {shopifyPermissionNames.map((name) => (
            <li key={name} className="break-all">
              {name}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
