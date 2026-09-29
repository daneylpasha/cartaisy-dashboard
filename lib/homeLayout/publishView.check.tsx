import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePublishBar } from '@/components/app-builder/HomePublishBar';
import { HOME_PUBLISH_COPY } from '@/lib/homeLayout/publish';

function render(
  status: 'not_published' | 'published' | 'draft',
  canPublish: boolean,
  success: string | null = null,
  live = status !== 'not_published',
  initialConfirming = false
) {
  return renderToStaticMarkup(
    createElement(HomePublishBar, {
      status,
      sections: [{ isVisible: true }],
      successMessage: success,
      isPublishing: false,
      canPublish,
      onPublish: () => {},
      live,
      isUnpublishing: false,
      onUnpublish: () => {},
      initialConfirming,
    })
  );
}

const fresh = render('not_published', true);
assert.match(fresh, /Not published yet/);
assert.match(fresh, /Nothing is saved/);
assert.match(fresh, new RegExp(HOME_PUBLISH_COPY.action));
assert.doesNotMatch(fresh, /Unpublish home/);
assert.doesNotMatch(fresh, /disabled=""/);

const live = render('published', false);
assert.match(live, /Published/);
assert.match(live, /home header/);
assert.match(live, /Unpublish home/);
assert.match(live, /disabled=""/);
assert.doesNotMatch(live, /These edits are not in the section order/);
assert.doesNotMatch(live, /smart default home until you publish again/);

const draft = render('draft', true);
assert.match(draft, /Draft/);
assert.match(draft, /not in the section order/);
assert.match(draft, /last published layout/);
assert.match(draft, /Unpublish home/);
assert.match(draft, new RegExp(HOME_PUBLISH_COPY.action));

const offline = render('draft', true, null, false);
assert.match(offline, /Draft/);
assert.match(offline, /smart default/);
assert.match(offline, /Your draft is still here/);
assert.match(offline, new RegExp(HOME_PUBLISH_COPY.action));
assert.doesNotMatch(offline, /Unpublish home/);
assert.doesNotMatch(offline, /last published layout/);
assert.doesNotMatch(offline, /disabled=""/);

const confirming = render('published', false, null, true, true);
assert.match(confirming, /smart default home until you publish again/);
assert.match(confirming, /Your draft stays in the editor/);
assert.match(confirming, /Keep it published/);
assert.match(confirming, /Unpublish home/);
assert.doesNotMatch(confirming, /Publish home/);
assert.doesNotMatch(confirming, /delete|warning|permanent|cannot be undone|irreversible/i);
assert.doesNotMatch(confirming, /cartaisy|shpat_|access token|api key/i);

const confirmed = render('published', false, HOME_PUBLISH_COPY.success);
assert.match(confirmed, /reads this section order under the home header/);
assert.doesNotMatch(confirmed, /publishedAt/);
assert.doesNotMatch(confirmed, /cartaisy/i);
assert.doesNotMatch(confirmed, /shpat_|access token|api key/i);

const hidden = renderToStaticMarkup(
  createElement(HomePublishBar, {
    status: 'published',
    sections: [{ isVisible: false }],
    successMessage: null,
    isPublishing: false,
    canPublish: false,
    onPublish: () => {},
    live: true,
    isUnpublishing: false,
    onUnpublish: () => {},
  })
);
assert.match(hidden, /default home/);
