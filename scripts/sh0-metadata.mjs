/** Metadata-only derivative: reuse remote geometry/base color, never request higher SH. */
export function sh0Metadata(input, sourceUrl) {
  if (![2, 3].includes(input.version)) throw new Error('Expected SOG metadata version 2 or 3.');
  const meta = structuredClone(input);
  delete meta.shN;
  for (const section of [meta.means, meta.quats, meta.scales, meta.sh0, ...(meta.blind ?? [])]) {
    if (section?.files) section.files = section.files.map(file => new URL(file, sourceUrl).href);
  }
  return meta;
}
