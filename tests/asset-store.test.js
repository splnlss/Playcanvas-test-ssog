import { expect, it } from 'vitest';
import { AssetRegistry } from 'playcanvas';
import { ResourceLoader } from 'playcanvas/build/playcanvas/src/framework/handlers/loader.js';
import { createSplatAssets } from '../src/asset-store';

function nativeRegistry() {
  const loader = new ResourceLoader({ enableBundles: false });
  const pending = new Map(); let calls = 0;
  loader.addHandler('gsplat', {
    load(url, callback) { calls++; pending.set(url.original, callback); },
    open(_url, value) { return value; },
  });
  return { registry: new AssetRegistry(loader), pending, get calls() { return calls; } };
}
const resource = () => ({ destroyed: false, destroy() { this.destroyed = true; } });

it('keeps a retried same-URL resource alive until its current owner releases it', async () => {
  const native = nativeRegistry(); const store = createSplatAssets(native.registry);
  const first = store.acquire('/scene.sog'); first.release();
  const second = store.acquire('/scene.sog');
  const data = resource(); native.pending.get('/scene.sog')(null, data);
  await second.ready;
  expect(native.calls).toBe(1);
  expect(second.asset.resource.destroyed).toBe(false);
  second.release();
  expect(data.destroyed).toBe(true);
  expect(native.registry.list()).toHaveLength(0);
});
it('cleans up an abandoned load without destroying a different active scene', async () => {
  const native = nativeRegistry(); const store = createSplatAssets(native.registry);
  const first = store.acquire('/a.sog'); first.release();
  const second = store.acquire('/b.sog');
  const a = resource(), b = resource();
  native.pending.get('/a.sog')(null,a); native.pending.get('/b.sog')(null,b);
  await second.ready;
  expect(a.destroyed).toBe(true); expect(b.destroyed).toBe(false);
  store.destroy(); expect(b.destroyed).toBe(true);
});
