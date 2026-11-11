import { describe, expect, it } from 'vitest';
import { resolveScene, scenes, validateScene } from '../src/config';

describe('configured scene selection', () => {
  it('selects default and single-file sources by stable ID', () => {
    expect(resolveScene('').source.kind).toBe('streamed-sog');
    expect(resolveScene('?scene=single').source.kind).toBe('sog');
  });
  it('rejects unknown IDs including inherited object keys', () => {
    expect(() => resolveScene('?scene=toString')).toThrow('Unknown scene');
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid scene scale %s', scale => {
    const scene = structuredClone(scenes.sample); scene.transform.scale = scale;
    expect(() => validateScene(scene)).toThrow('scale');
  });
  it('requires attribution and permission reference', () => {
    const scene = structuredClone(scenes.sample); scene.attribution = '';
    expect(() => validateScene(scene)).toThrow('attribution');
    scene.attribution = 'Author'; scene.licenseUrl = '';
    expect(() => validateScene(scene)).toThrow('license');
  });
  it('rejects unsafe or mismatched source URLs', () => {
    for (const manifestUrl of ['javascript:alert(1)', 'https://host/scene.sog', '']) {
      const scene = structuredClone(scenes.sample); scene.source = { kind: 'streamed-sog', manifestUrl };
      expect(() => validateScene(scene)).toThrow('source');
    }
  });
  it('requires strictly ascending positive streamed budgets', () => {
    const scene = structuredClone(scenes.sample); scene.vrProfiles.low.splatBudget = 500_000;
    expect(() => validateScene(scene)).toThrow('budget');
  });
  it('requires valid start poses and avoids a degenerate look target', () => {
    const scene = structuredClone(scenes.sample); scene.desktop.target = [...scene.desktop.position];
    expect(() => validateScene(scene)).toThrow('target');
  });
});
