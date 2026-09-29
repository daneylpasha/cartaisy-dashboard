import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOME_PUBLISH_COPY,
  homeLayoutIsLive,
  layoutsEqual,
  legacyPublishedAt,
  needsLegacyPublishBackfill,
  publishedFeedSections,
  publishStatusCopy,
  publishSuccessCopy,
  resolveHomeLayoutView,
  visiblePublishStatus,
  type HomeLayoutSectionSnapshot,
} from '@/lib/homeLayout/publish';

const here = dirname(fileURLToPath(import.meta.url));

const fallback: HomeLayoutSectionSnapshot[] = [
  { type: 'carousel', isVisible: true, position: 0 },
  { type: 'promo_banners', isVisible: true, position: 1 },
];

const saved: HomeLayoutSectionSnapshot[] = [
  { type: 'promo_banners', isVisible: true, position: 0 },
  { type: 'carousel', isVisible: false, position: 1 },
];

const fresh = resolveHomeLayoutView({
  storedSections: [],
  draftSections: [],
  publishedAt: null,
  fallback,
});
assert.equal(fresh.status, 'not_published');
assert.deepEqual(fresh.published, []);
assert.equal(fresh.draft.length, fallback.length);
assert.equal(homeLayoutIsLive(null, []), false);
assert.deepEqual(publishedFeedSections(null, []), []);

const legacy = resolveHomeLayoutView({
  storedSections: saved,
  draftSections: [],
  publishedAt: null,
  fallback,
});
assert.equal(legacy.status, 'published');
assert.deepEqual(legacy.draft.map((section) => section.type), ['promo_banners', 'carousel']);
assert.deepEqual(legacy.published.map((section) => section.type), ['promo_banners', 'carousel']);
assert.equal(homeLayoutIsLive(null, saved), true);
assert.equal(needsLegacyPublishBackfill(null, saved), true);
assert.equal(needsLegacyPublishBackfill(undefined, []), false);
assert.equal(needsLegacyPublishBackfill('2026-09-29T00:00:00.000Z', saved), false);
assert.deepEqual(
  publishedFeedSections(undefined, saved).map((section) => section.type),
  ['promo_banners', 'carousel']
);
const backfillNow = new Date('2026-09-29T00:00:00.000Z');
assert.equal(legacyPublishedAt('2026-09-28T12:00:00.000Z', backfillNow).toISOString(), '2026-09-28T12:00:00.000Z');
assert.equal(legacyPublishedAt(null, backfillNow).toISOString(), backfillNow.toISOString());

const legacyEdited = resolveHomeLayoutView({
  storedSections: saved,
  draftSections: [{ type: 'carousel', isVisible: true, position: 0 }],
  publishedAt: null,
  fallback,
});
assert.equal(legacyEdited.status, 'draft');
assert.deepEqual(legacyEdited.published.map((section) => section.type), ['promo_banners', 'carousel']);

const published = resolveHomeLayoutView({
  storedSections: saved,
  draftSections: saved,
  publishedAt: '2026-09-29T00:00:00.000Z',
  fallback,
});
assert.equal(published.status, 'published');
assert.equal(layoutsEqual(published.draft, published.published), true);
assert.equal(publishedFeedSections('2026-09-29T00:00:00.000Z', saved).length, 2);

const edited = resolveHomeLayoutView({
  storedSections: saved,
  draftSections: [{ type: 'carousel', isVisible: true, position: 0 }],
  publishedAt: new Date('2026-09-29T00:00:00.000Z'),
  fallback,
});
assert.equal(edited.status, 'draft');
assert.deepEqual(
  publishedFeedSections(new Date('2026-09-29T00:00:00.000Z'), saved).map((section) => section.type),
  ['promo_banners', 'carousel']
);

assert.equal(visiblePublishStatus('published', false), 'published');
assert.equal(visiblePublishStatus('published', true), 'draft');
assert.equal(visiblePublishStatus('not_published', true), 'not_published');
assert.equal(visiblePublishStatus('draft', false), 'draft');

assert.equal(publishStatusCopy('not_published', saved).label, 'Not published yet');
assert.match(publishStatusCopy('not_published', saved).detail, /Nothing is saved/);
assert.match(publishStatusCopy('published', saved).detail, /home header/);
assert.match(publishStatusCopy('published', [{ isVisible: false }]).detail, /default home/);
assert.match(publishStatusCopy('draft', saved).detail, /last published layout/);
assert.match(publishStatusCopy('not_published', []).detail, /Nothing is saved/);
assert.doesNotMatch(publishStatusCopy('published', saved).detail, /publishedAt/);
assert.doesNotMatch(publishSuccessCopy(saved), /publishedAt/);
assert.match(publishSuccessCopy(saved), /Published/);
assert.match(publishSuccessCopy([{ isVisible: false }]), /default home/);

for (const value of Object.values(HOME_PUBLISH_COPY)) {
  const text = typeof value === 'string' ? value : `${value.label} ${value.detail}`;
  assert.equal(/cartaisy/i.test(text), false);
  assert.equal(/shpat_|access token|api key/i.test(text), false);
}

const selector = readFileSync(join(here, '../../components/app-builder/CollectionSelector.tsx'), 'utf8');
const blockAt = selector.indexOf('<ShopifyCatalogBlockPanel');
const selectAt = selector.indexOf('<Select');
assert.ok(blockAt > 0);
assert.ok(selectAt > blockAt);
assert.match(selector, /block \?/);

const feed = readFileSync(join(here, '../../app/api/public/home-feed/route.ts'), 'utf8');
assert.match(feed, /publishedFeedSections/);
assert.match(feed, /homeLayoutIsLive/);
assert.doesNotMatch(feed, /DEFAULT_SECTIONS/);
assert.doesNotMatch(feed, /if \(!layout\?\.publishedAt\)/);
assert.match(feed, /published: false/);

const service = readFileSync(join(here, '../../lib/services/homeLayout.ts'), 'utf8');
assert.match(service, /needsLegacyPublishBackfill/);
assert.match(service, /\$set: \{ publishedAt \}/);
assert.doesNotMatch(service, /sections:\s*\[\]/);

const preview = readFileSync(join(here, '../../app/dashboard/app-builder/preview/page.tsx'), 'utf8');
assert.doesNotMatch(preview, /Module order for a published home/);
assert.doesNotMatch(preview, /cartaisy/i);

const builder = readFileSync(join(here, '../../app/dashboard/app-builder/page.tsx'), 'utf8');
assert.match(builder, /HomePublishBar/);
assert.match(builder, /\/api\/home-layout\/publish/);
assert.match(builder, /HOME_PUBLISH_COPY\.saveDraft/);
assert.doesNotMatch(builder, /Hide from app/);
assert.doesNotMatch(builder, /Saved successfully/);
