import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePublishBar } from '@/components/app-builder/HomePublishBar';
import { HOME_PUBLISH_COPY } from '@/lib/homeLayout/publish';

function render(status: 'not_published' | 'published' | 'draft', canPublish: boolean, success: string | null = null) {
  return renderToStaticMarkup(
    createElement(HomePublishBar, {
      status,
      sections: [{ isVisible: true }],
      successMessage: success,
      isPublishing: false,
      canPublish,
      onPublish: () => {},
    })
  );
}

const fresh = render('not_published', true);
assert.match(fresh, /Not published yet/);
assert.match(fresh, /Nothing is saved/);
assert.match(fresh, new RegExp(HOME_PUBLISH_COPY.action));
assert.doesNotMatch(fresh, /disabled=""/);

const live = render('published', false);
assert.match(live, /Published/);
assert.match(live, /home header/);
assert.match(live, /disabled=""/);
assert.doesNotMatch(live, /These edits are not in the section order/);

const draft = render('draft', true);
assert.match(draft, /Draft/);
assert.match(draft, /not in the section order/);
assert.match(draft, /last published layout/);
assert.match(draft, new RegExp(HOME_PUBLISH_COPY.action));

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
  })
);
assert.match(hidden, /default home/);
