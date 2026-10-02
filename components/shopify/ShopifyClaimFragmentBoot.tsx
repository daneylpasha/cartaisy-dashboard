import { SHOPIFY_CLAIM_FRAGMENT_BOOT } from '@/lib/shopify/claimFragmentBoot';

/**
 * Removes `#claim_token` as the document parses, before analytics or
 * hydration can read the URL. The nonce stays in memory only when this
 * visit is `claim=pending`. The script text is a constant in this repo.
 */
export function ShopifyClaimFragmentBoot() {
  return (
    <script id="shopify-claim-fragment" dangerouslySetInnerHTML={{ __html: SHOPIFY_CLAIM_FRAGMENT_BOOT }} />
  );
}
