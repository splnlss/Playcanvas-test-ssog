import { expect, it } from 'vitest';
import { createXrLifecycle, vrMotion } from '../src/xr-state';

it('starts once, restores once on rejection/end, and allows another session', () => {
  const restored: string[] = [];
  const life = createXrLifecycle<string>(snapshot => restored.push(snapshot));
  expect(life.begin('fly snapshot')).toBe(true);
  expect(life.begin('wrong snapshot')).toBe(false);
  life.end(); life.end();
  expect(restored).toEqual(['fly snapshot']);
  expect(life.begin('orbit snapshot')).toBe(true);
  life.activate(); expect(life.state).toBe('active');
  life.end(); expect(restored).toEqual(['fly snapshot', 'orbit snapshot']);
});
it('restores desktop mode, pose, target and budget on five entry/exit cycles', () => {
  let restored = 0;
  const snapshot = { mode: 'fly', pose: [1, 2, 3], target: [4, 5, 6], budget: 2_000_000 };
  const life = createXrLifecycle<typeof snapshot>(value => {
    expect(value).toEqual(snapshot); restored++;
  });
  for (let i = 0; i < 5; i++) { life.begin(snapshot); life.activate(); life.end(); }
  expect(restored).toBe(5);
});
it('pauses all artificial movement for menus or disconnected controllers', () => {
  for (const paused of [true, false]) {
    const motion = vrMotion([1, 1], paused ? [1, 1] : null, 0, true, paused, 0.05, 1.5);
    expect(motion.delta).toEqual([0, 0, 0]); expect(motion.degrees).toBe(0);
  }
});
it('uses the dominant right axis and headset yaw without diagonal speed gain', () => {
  const vertical = vrMotion([0, 1], [0.5, 0.9], Math.PI / 2, true, false, 0.05, 1.5);
  expect(vertical.degrees).toBe(0); expect(vertical.delta[1]).toBeGreaterThan(0);
  expect(vertical.delta[0]).toBeLessThan(0); expect(Math.hypot(...vertical.delta)).toBeLessThanOrEqual(0.07500001);
  const turn = vrMotion([0, 0], [0.9, 0.3], 0, true, false, 0.05, 1.5);
  expect(turn.degrees).toBe(-30); expect(turn.delta[1]).toBe(0);
});

import { EventHandler } from 'playcanvas';
import { observeXrEnd } from '../src/xr-state';
it('refreshes toolbar only after native session teardown and unsubscribes on disposal', async () => {
  const events = new EventHandler(); let active = true;
  const observed: boolean[] = [];
  const dispose = observeXrEnd(events, () => observed.push(active));
  events.fire('end'); active = false;
  await Promise.resolve();
  expect(observed).toEqual([false]);
  dispose(); events.fire('end'); await Promise.resolve();
  expect(observed).toEqual([false]);
});
