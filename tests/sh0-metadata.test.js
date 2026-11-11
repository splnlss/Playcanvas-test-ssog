import { expect, it } from 'vitest';
import { sh0Metadata } from '../scripts/sh0-metadata.mjs';

it('removes higher-order SH downloads while preserving geometry and base color', () => {
  const input = { version: 2, count: 42, means: { mins: [0, 1, 2], files: ['means_l.webp', 'means_u.webp'] }, sh0: { files: ['sh0.webp'] }, shN: { files: ['shN_centroids.webp', 'shN_labels.webp'] } };
  const result = sh0Metadata(input, 'https://example.com/lod/4_0/meta.json');
  expect(result.shN).toBeUndefined();
  expect(result.means.files).toEqual(['https://example.com/lod/4_0/means_l.webp', 'https://example.com/lod/4_0/means_u.webp']);
  expect(result.sh0.files).toEqual(['https://example.com/lod/4_0/sh0.webp']);
  expect(result.count).toBe(42);
  expect(input.shN.files).toHaveLength(2);
});
