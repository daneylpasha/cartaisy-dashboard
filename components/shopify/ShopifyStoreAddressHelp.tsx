/**
 * Where to find the Shopify admin domain, and how to paste it.
 * Shared by the onboarding connect step and Settings → Shopify Connection.
 * Address validation stays in the existing normalizers.
 */

const TEXT = {
  xs: 'text-xs leading-5',
  sm: 'text-sm leading-6',
} as const;

const LABEL = {
  xs: 'text-[11px]',
  sm: 'text-xs',
} as const;

export function ShopifyStoreAddressHelp({
  id,
  retry = false,
  size = 'xs',
  note,
}: {
  id: string;
  /** After a failed connect, remind the merchant to try the address again. */
  retry?: boolean;
  /** Wizard helper is smaller than the settings card body. */
  size?: keyof typeof TEXT;
  /** A line that belongs only on that screen. */
  note?: string;
}) {
  return (
    <div id={id} className={`text-slate-500 ${TEXT[size]}`}>
      <p>
        Use the store address that ends in .myshopify.com, like your-store.myshopify.com. A custom
        domain such as shop.com, or the public storefront link, will not connect the app.
      </p>
      <p className={`mt-3 font-medium uppercase tracking-[0.14em] text-slate-400 ${LABEL[size]}`}>
        How to find it
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 marker:text-slate-300">
        <li>
          Open Shopify admin and check the address bar. If it shows your-store.myshopify.com, use
          that.
        </li>
        <li>
          If it shows admin.shopify.com/store/your-store, enter your-store.myshopify.com.
        </li>
        <li>Or open Settings, then Domains. The .myshopify.com domain is listed there.</li>
      </ul>
      <p className="mt-2">
        Paste the full address. https:// and anything after the domain are fine.
        {retry ? ' Then connect again.' : null}
      </p>
      {note ? <p className="mt-2">{note}</p> : null}
    </div>
  );
}
