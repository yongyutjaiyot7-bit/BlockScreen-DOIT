import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// Use an isolated temp DB so tests don't touch real data.
const dbFile = path.join(tmpdir(), `stock-test-${randomUUID()}.db`);
process.env.DB_PATH = dbFile;
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/server.js');

let server, base;
before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
  for (const ext of ['', '-wal', '-shm']) {
    try { rmSync(dbFile + ext); } catch {}
  }
});

test('create product, check stock, adjust', async () => {
  const created = await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: 'SKU-001', name: 'Widget', quantity: 5, location: 'A1' }),
  }).then((r) => r.json());
  assert.equal(created.sku, 'SKU-001');
  assert.equal(created.quantity, 5);

  const check = await fetch(`${base}/api/check/SKU-001`).then((r) => r.json());
  assert.equal(check.quantity, 5);
  assert.equal(check.inStock, true);

  const adjusted = await fetch(`${base}/api/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: 'SKU-001', delta: -2, reason: 'sale' }),
  }).then((r) => r.json());
  assert.equal(adjusted.quantity, 3);
});

test('cannot go below zero', async () => {
  await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: 'SKU-002', name: 'Gadget', quantity: 1 }),
  });
  const res = await fetch(`${base}/api/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: 'SKU-002', delta: -5 }),
  });
  assert.equal(res.status, 400);
});

test('unknown sku returns 404', async () => {
  const res = await fetch(`${base}/api/check/NOPE`);
  assert.equal(res.status, 404);
});

test('qrcode endpoint returns png', async () => {
  await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: 'SKU-003', name: 'Thing' }),
  });
  const res = await fetch(`${base}/api/qrcode/SKU-003`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 0);
  assert.equal(buf[0], 0x89); // PNG magic byte
});
