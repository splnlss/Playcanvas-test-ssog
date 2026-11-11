import { describe, expect, it } from 'vitest';
import { turnAroundPivot } from '../src/movement';

describe('head-pivot turns', () => {
  it('keeps an offset head in place when the body rotates 90 degrees', () => {
    // A root at zero and a head at x=1 must move the root to (1,0,1).
    const turned = turnAroundPivot({ position: [0, 0, 0], rotation: [0, 0, 0, 1] }, [1, 1.6, 0], 90);
    expect(turned.position[0]).toBeCloseTo(1);
    expect(turned.position[1]).toBeCloseTo(0);
    expect(turned.position[2]).toBeCloseTo(1);
    expect(turned.rotation[1]).toBeCloseTo(Math.SQRT1_2);
    expect(turned.rotation[3]).toBeCloseTo(Math.SQRT1_2);
  });

  it('does not translate a centered player during a 30 degree turn', () => {
    const pose = { position: [2, 0, 3] as [number, number, number], rotation: [0, 0, 0, 1] as [number, number, number, number] };
    const turned = turnAroundPivot(pose, [2, 1.6, 3], 30);
    expect(turned.position).toEqual([2, 0, 3]);
    expect(turned.rotation[1]).toBeCloseTo(0.258819);
    expect(pose.rotation).toEqual([0, 0, 0, 1]);
  });
});

import { flightDelta, snapTurn } from '../src/movement';

it('moves 1.5 meters per second and caps a three-axis diagonal at the same speed', () => {
  const forward = flightDelta([0, 0, 1], 0, 1.5, 0.05);
  expect(forward[2] * 20).toBeCloseTo(-1.5);
  expect(Math.hypot(...flightDelta([1, 1, 1], 0, 1.5, 0.05)) * 20).toBeCloseTo(1.5);
  expect(flightDelta([0, 0, 1], 0, 3, 0.05)[2] * 20).toBeCloseTo(-3);
});

it('rotates horizontal movement by yaw and clamps stalled frames', () => {
  expect(flightDelta([0, 0, 1], Math.PI / 2, 1.5, 0.05)[0]).toBeCloseTo(-0.075);
  expect(flightDelta([0, 1, 0], Math.PI / 2, 1.5, 0.05)[1]).toBeCloseTo(0.075);
  expect(flightDelta([0, 0, 1], 0, 1.5, 2)[2]).toBeCloseTo(-0.075);
  expect(flightDelta([0, 0, 1], 0, 1.5, NaN)).toEqual([0, 0, 0]);
});

it('snap-turns once per deflection and rearms only near neutral', () => {
  expect(snapTurn(0.9, true)).toEqual({ degrees: -30, armed: false });
  expect(snapTurn(0.9, false)).toEqual({ degrees: 0, armed: false });
  expect(snapTurn(0.1, false)).toEqual({ degrees: 0, armed: true });
  expect(snapTurn(-0.9, true)).toEqual({ degrees: 30, armed: false });
});
