import assert from 'node:assert/strict';
import { installQrGrid } from '@/lib/build/installQr';

const ANDROID = 'https://expo.dev/accounts/northwind/builds/android';
const IOS = 'https://u.expo.dev/artifact/ios';

function signature(url: string): string {
  const grid = installQrGrid(url);
  assert.ok(grid);
  return grid.cells.map((dark) => (dark ? '1' : '0')).join('');
}

const android = installQrGrid(ANDROID);
assert.ok(android);
assert.ok(android.size >= 21 + 8);
assert.equal(android.cells.length, android.size * android.size);
const quiet = 4;
assert.equal(android.cells[quiet * android.size + quiet], true);
assert.equal(android.cells.slice(0, quiet).some(Boolean), false);
assert.equal(signature(ANDROID).includes('expo.dev'), false);
assert.notEqual(signature(ANDROID), signature(IOS));

assert.equal(installQrGrid('http://expo.dev/accounts/northwind/builds/android'), null);
assert.equal(installQrGrid('https://user:pass@expo.dev/artifact'), null);
assert.equal(installQrGrid('https://expo.dev/accounts/northwind/builds/shpat_secret'), null);
assert.equal(installQrGrid('https://expo.dev/a?access_token=secret'), null);
assert.equal(installQrGrid(''), null);
assert.equal(installQrGrid('not a url'), null);

const padded = installQrGrid(`  ${ANDROID}  `);
assert.ok(padded);
assert.equal(signature(`  ${ANDROID}  `), signature(ANDROID));

console.log('install qr ok');
