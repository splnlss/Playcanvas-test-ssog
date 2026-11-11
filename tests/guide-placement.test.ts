import { expect, it } from 'vitest';
import { guidePlacement, worldGuidePose } from '../src/guide/placement';
import type { GuidePose } from '../src/guide/sequence';
const standing: GuidePose = { position: [0, 0, 0.6], yaw: 0, seated: 0, distance: 0, moving: false, opacity: 1 };
it('places the seated pelvis bottom on the measured Ronda pipe top in world meters', () => {
  const placement = guidePlacement('ronda', false)!;
  const seated = worldGuidePose({ ...standing, seated: 1 }, placement);
  expect(seated.position[0]).toBeCloseTo(-2.2);
  expect(seated.position[2]).toBeCloseTo(-3.55);
  expect(seated.position[1] + seated.hipHeight - 0.11).toBeCloseTo(1.02);
  expect(seated.yaw).toBeCloseTo(-90);
});
it('enters 4 m to the right of the new opening view and never follows later camera movement', () => {
  const placement = guidePlacement('ronda', false)!;
  const start = worldGuidePose({ ...standing, position: [4, 0, 1.5], yaw: -90 }, placement);
  expect(start.position[0]).toBeCloseTo(-3.7);
  expect(start.position[1]).toBeCloseTo(0.25);
  expect(start.position[2]).toBeCloseTo(0.45);
  expect(start.yaw).toBeCloseTo(-180);
  expect(guidePlacement('ronda-full', false)).toEqual(placement);
  expect(guidePlacement('sample', false)).toBeUndefined();
});
it('retains the synthetic fixture geometry and avoids moving the hips twice during seating', () => {
  const placement = guidePlacement('ronda', true)!;
  const approach = worldGuidePose(standing, placement);
  const seated = worldGuidePose({ ...standing, seated: 1 }, placement);
  expect(approach.position).toEqual([0, 0, 0.6]);
  expect(seated.position).toEqual([0, 0, 0]);
  expect(seated.hipHeight - 0.11).toBeCloseTo(0.6);
});
