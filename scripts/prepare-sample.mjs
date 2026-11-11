// Offline content preparation only; the viewer never downloads conversion tooling.
import { mkdir, mkdtemp, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = 'https://raw.githubusercontent.com/playcanvas/engine/main/examples/assets/splats/';
const out = new URL('../public/sample/', import.meta.url);
await mkdir(out, { recursive: true });
for (const name of ['apartment.sog', 'apartment.txt']) {
  const response = await fetch(source + name);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  await writeFile(new URL(name, out), new Uint8Array(await response.arrayBuffer()));
}
const work = await mkdtemp(join(tmpdir(), 'sog-sample-'));
const tool = (...args) => {
  const result = spawnSync('npm', ['exec', '--yes', '--package', '@playcanvas/splat-transform@3.11.1', '--', 'splat-transform', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`splat-transform failed: ${result.status}`);
};
const full = new URL('apartment.sog', out).pathname;
for (const [name, ratio] of [['mid', '50%'], ['low', '12.5%']]) {
  tool(full, '--filter-harmonics', '0', '--decimate', ratio, join(work, name + '.ply'));
}
tool(full, '--filter-harmonics', '0', join(work, 'full.ply'));
tool(join(work, 'full.ply'), '--tag-lod', '0', join(work, 'mid.ply'), '--tag-lod', '1', join(work, 'low.ply'), '--tag-lod', '2',
  new URL('streamed/lod-meta.json', out).pathname, '--filter-harmonics', '0',
  '--lod-chunk-count', '128', '--lod-chunk-extent', '4', '--sh-iterations', '1', '--gpu', 'cpu');
await copyFile(new URL('apartment.txt', out), new URL('streamed/ATTRIBUTION.txt', out));
console.log('Prepared CC BY 4.0 sample: public/sample (generated assets ignored by Git).');
