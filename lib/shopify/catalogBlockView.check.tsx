import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShopifyCatalogBlockPanel } from '@/components/shopify/ShopifyCatalogBlockPanel';

function html(block: 'reconnect' | 'billing'): string {
  return renderToStaticMarkup(
    createElement(ShopifyCatalogBlockPanel, { block, shop: 'northline.myshopify.com' })
  );
}

const reconnect = html('reconnect');
const billing = html('billing');

assert.equal(reconnect.includes('Sync again'), false);
assert.equal(billing.includes('Sync again'), false);
assert.ok(reconnect.includes('Reconnect Shopify'));
assert.ok(reconnect.includes('Reconnect to load this catalog again.'));
assert.ok(reconnect.includes('bg-slate-950'));
assert.ok(billing.includes('Shopify billing needs attention'));
assert.ok(billing.includes('will not change that'));
assert.equal(billing.includes('bg-slate-950'), false);
assert.equal(reconnect.includes('Cartaisy'), false);
assert.equal(billing.includes('Cartaisy'), false);
assert.equal(reconnect.includes('shpat_'), false);

console.log('catalog block panel ok');
