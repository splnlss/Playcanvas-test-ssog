import { expect, it } from 'vitest';
import { projectSunShadow, sunRay } from '../src/guide/shadow';
it('casts down and right from the fixture opening view and stays on the receiver plane', () => {
  const ray = sunRay(0);
  const point = projectSunShadow([0, 2, 0], 0.01, ray);
  expect(point[0]).toBeCloseTo(1.393); expect(point[1]).toBe(0.01); expect(point[2]).toBeCloseTo(0.995);
});
it('rotates sunlight with authored scene alignment rather than the moving camera', () => {
  const ray = sunRay(-90);
  const p = projectSunShadow([-2.2, 2.25, -3.55], 0.25, ray);
  expect(p[0]).toBeCloseTo(-3.2); expect(p[1]).toBe(0.25); expect(p[2]).toBeCloseTo(-2.15);
});
it('keeps receiver contacts fixed and avoids projecting points below the ground backwards', () => {
  expect(projectSunShadow([1, 0.25, 3], 0.25, sunRay(0))).toEqual([1, 0.25, 3]);
  expect(projectSunShadow([1, 0.1, 3], 0.25, sunRay(0))).toEqual([1, 0.25, 3]);
});
