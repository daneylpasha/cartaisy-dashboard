import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppSwitcherPanel } from '@/components/dashboard/AppSwitcher';
import { clearStoreScopedClientCaches } from '@/lib/dashboard/storeCaches';
import { resetShellBrandingSessions, type ShellBrandingSession } from '@/lib/dashboard/shellBranding';
import {
  NEW_APP_PATH,
  SWITCH_APP_PATH,
  appSwitcherModel,
  canAddApp,
  createStoreBody,
  otherApps,
  parseActiveStore,
  parseStoreList,
  readAppName,
  safeStoreLabel,
  sessionWithActiveStore,
  storeFailureMessage,
  switchStoreBody,
} from '@/lib/auth/stores';

const here = dirname(fileURLToPath(import.meta.url));

const NORTH = '507f1f77bcf86cd799439011';
const SOUTH = '507f1f77bcf86cd799439012';

assert.equal(canAddApp('super_admin', NORTH), true);
assert.equal(canAddApp('super_admin', '  '), false);
assert.equal(canAddApp('super_admin', undefined), false);
assert.equal(canAddApp('admin', NORTH), false);
assert.equal(canAddApp('moderator', NORTH), false);

assert.deepEqual(readAppName('  Second app  '), { ok: true, name: 'Second app' });
assert.equal(readAppName('  ').ok, false);
assert.equal(readAppName('A').ok, false);
assert.equal(readAppName('a'.repeat(101)).ok, false);
assert.equal(readAppName('shpat_secret').ok, false);
assert.equal(createStoreBody('  Harbor  ')?.name, 'Harbor');
assert.equal(createStoreBody(' '), null);
assert.deepEqual(switchStoreBody(`  ${SOUTH}  `), { storeId: SOUTH });
assert.equal(switchStoreBody('  '), null);
assert.equal(switchStoreBody('shpat_x'), null);

assert.equal(safeStoreLabel('  Northwind  '), 'Northwind');
assert.equal(safeStoreLabel('shpat_logo'), 'App');
assert.equal(safeStoreLabel(''), 'App');

const listed = parseStoreList({
  status: 'success',
  data: {
    activeStoreId: NORTH,
    stores: [
      { id: NORTH, name: 'Northwind', slug: 'northwind', logoUrl: 'https://cdn.example.com/shpat_secret.png' },
      { id: SOUTH, name: '  Second app  ', slug: 'second-app' },
      { id: 'shpat_bad', name: 'Hidden' },
      { id: SOUTH, name: 'Duplicate' },
      { name: 'Missing id' },
    ],
  },
});
assert.ok(listed);
assert.equal(listed.activeStoreId, NORTH);
assert.deepEqual(listed.stores, [
  { id: NORTH, name: 'Northwind' },
  { id: SOUTH, name: 'Second app' },
]);
assert.equal(JSON.stringify(listed).includes('shpat_'), false);
assert.equal(parseStoreList({ status: 'error', data: { activeStoreId: NORTH, stores: [] } }), null);

assert.deepEqual(otherApps(listed.stores, NORTH), [{ id: SOUTH, name: 'Second app' }]);
assert.deepEqual(otherApps(listed.stores, 'missing'), listed.stores);

const singleOwner = appSwitcherModel({
  stores: [{ id: NORTH, name: 'Northwind' }],
  activeStoreId: NORTH,
  canAdd: true,
});
assert.equal(singleOwner.mode, 'menu');
assert.equal(singleOwner.showAdd, true);
assert.equal(singleOwner.showSwitchLabel, false);
assert.deepEqual(singleOwner.others, []);
assert.equal(singleOwner.triggerLabel, 'Add app');

const singleGuest = appSwitcherModel({
  stores: [{ id: NORTH, name: 'Northwind' }],
  activeStoreId: NORTH,
  canAdd: false,
});
assert.equal(singleGuest.mode, 'name');
assert.equal(singleGuest.showAdd, false);

const multiGuest = appSwitcherModel({
  stores: listed.stores,
  activeStoreId: NORTH,
  canAdd: false,
});
assert.equal(multiGuest.mode, 'menu');
assert.equal(multiGuest.showSwitchLabel, true);
assert.equal(multiGuest.showAdd, false);
assert.equal(multiGuest.triggerLabel, 'Switch app');

const loadingOwner = appSwitcherModel({ stores: null, activeStoreId: NORTH, canAdd: true });
assert.equal(loadingOwner.mode, 'menu');
assert.equal(loadingOwner.showSwitchLabel, false);
const loadingGuest = appSwitcherModel({ stores: null, activeStoreId: NORTH, canAdd: false });
assert.equal(loadingGuest.mode, 'name');

assert.deepEqual(parseActiveStore(
  {
    status: 'success',
    data: { user: { id: 'user', storeId: SOUTH, storeIds: [NORTH, SOUTH], storeName: 'Second app' } },
  },
  'Fallback',
), { storeId: SOUTH, storeName: 'Second app' });
assert.deepEqual(parseActiveStore(
  { data: { user: { storeId: SOUTH, storeName: '' }, store: { name: 'Second app' } } },
  'Second app',
), { storeId: SOUTH, storeName: 'Second app' });
assert.equal(parseActiveStore({ data: { user: { storeId: '', storeName: 'Nope' } } }, 'Fallback'), null);
assert.equal(parseActiveStore({ token: 'eyJ.eyJ.sig', refreshToken: 'eyJ.eyJ.sig' }, 'Fallback'), null);

const session = sessionWithActiveStore(
  {
    id: 'user',
    email: 'owner@example.com',
    role: 'super_admin',
    storeId: NORTH,
    storeName: 'Northwind',
  },
  { storeId: SOUTH, storeName: 'Second app' },
);
assert.equal(session.storeId, SOUTH);
assert.equal(session.storeName, 'Second app');
assert.equal(session.email, 'owner@example.com');
assert.equal(session.role, 'super_admin');
assert.equal('token' in session, false);

assert.match(storeFailureMessage(403, 'create'), /can't add an app/);
assert.match(storeFailureMessage(400, 'create'), /10 apps/);
assert.match(storeFailureMessage(403, 'switch'), /don't have access/);
assert.match(storeFailureMessage(404, 'switch'), /no longer available/);
assert.match(storeFailureMessage(409, 'switch'), /this email/);
assert.equal(SWITCH_APP_PATH, '/dashboard');
assert.equal(NEW_APP_PATH, '/dashboard/onboarding');

const shellHost = globalThis as { __cartaisyShellBranding?: Map<string, ShellBrandingSession> };
resetShellBrandingSessions();
shellHost.__cartaisyShellBranding?.set(NORTH, {
  storeId: NORTH,
  reloadKey: 0,
  promise: Promise.resolve(null),
  draft: null,
  settled: true,
});
const inflight = new Map<string, Promise<unknown>>();
inflight.set(NORTH, Promise.resolve(null));
(globalThis as { __cartaisyInflightBranding?: Map<string, Promise<unknown>> }).__cartaisyInflightBranding = inflight;
clearStoreScopedClientCaches();
assert.equal(shellHost.__cartaisyShellBranding?.size, 0);
assert.equal(inflight.size, 0);

function panel(props: Partial<Parameters<typeof AppSwitcherPanel>[0]>) {
  return renderToStaticMarkup(
    createElement(AppSwitcherPanel, {
      collapsed: false,
      storeName: 'Northwind',
      userName: 'Avery',
      logoUrl: null,
      mode: 'name',
      open: false,
      triggerLabel: 'Switch app',
      others: [],
      showAdd: false,
      showSwitchLabel: false,
      pendingId: null,
      note: null,
      listNote: null,
      onToggleOpen: () => undefined,
      onSelect: () => undefined,
      onAdd: () => undefined,
      ...props,
    }),
  );
}

const nameOnly = panel({});
assert.match(nameOnly, /Northwind/);
assert.doesNotMatch(nameOnly, /Switch app|Add app|aria-expanded/);
assert.match(nameOnly, /data-app-switcher="name"/);

const switchMenu = panel({
  mode: 'menu',
  open: true,
  triggerLabel: 'Switch app',
  others: [{ id: SOUTH, name: 'Second app' }],
  showSwitchLabel: true,
});
assert.match(switchMenu, /aria-label="Switch app"/);
assert.match(switchMenu, /Switch app/);
assert.match(switchMenu, /Second app/);
assert.doesNotMatch(switchMenu, /Add app/);

const addOnly = panel({
  mode: 'menu',
  open: true,
  triggerLabel: 'Add app',
  showAdd: true,
});
assert.match(addOnly, /aria-label="Add app"/);
assert.match(addOnly, />Add app</);
assert.doesNotMatch(addOnly, /Switch app/);

const collapsed = panel({ collapsed: true, mode: 'menu', open: true, showAdd: true, showSwitchLabel: true });
assert.match(collapsed, /Expand sidebar/);
assert.doesNotMatch(collapsed, /Switch app|Add app/);

const forbidden = [nameOnly, switchMenu, addOnly, collapsed].join('\n');
assert.doesNotMatch(forbidden, /Cartaisy|EXPO_TOKEN|shpat_|access_token|refreshToken/);

const authSource = readFileSync(join(here, 'auth-context.tsx'), 'utf8');
assert.match(authSource, /clearStoreScopedClientCaches\(\)/);
assert.match(authSource, /openAppDestination\(SWITCH_APP_PATH\)/);
assert.match(authSource, /openAppDestination\(NEW_APP_PATH\)/);
assert.match(authSource, /event\.persisted/);
assert.doesNotMatch(authSource, /EXPO_TOKEN|shpat_/);

const sidebarSource = readFileSync(join(here, '../../components/Sidebar.tsx'), 'utf8');
assert.match(sidebarSource, /AppSwitcher/);
assert.doesNotMatch(sidebarSource, /EXPO_TOKEN|shpat_|phone mock|simulator/);

console.log('auth store switcher checks passed');
