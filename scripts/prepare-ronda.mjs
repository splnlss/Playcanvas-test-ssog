import { mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sh0Metadata } from './sh0-metadata.mjs';

const source = 'https://pub-dd92ae5131ec49f1bbd411b51a858249.r2.dev/01_SLV_RondaJoseph/20260820_RondaLobato/web/lod/lod-meta.json';
const output = new URL('../public/ronda-sh0/', import.meta.url);
const json = async url => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
};
const save = async (name, data) => {
  const path = fileURLToPath(new URL(name, output));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path + '.tmp', JSON.stringify(data));
  await rename(path + '.tmp', path);
};
const manifest = await json(source);
if (!Array.isArray(manifest.filenames) || !manifest.filenames.every(name => /^\d+_\d+\/meta\.json$/.test(name))) throw new Error('Unexpected streamed SOG chunk paths.');
const queue = [...manifest.filenames];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let name; (name = queue.shift()) !== undefined;) {
    const url = new URL(name, source).href;
    await save(name, sh0Metadata(await json(url), url));
  }
}));
// Publish the manifest only after all local metadata is ready.
await save('lod-meta.json', manifest);
console.log(`Prepared ${manifest.filenames.length} SH0 chunk metadata files; geometry/base-color textures remain on R2.`);
