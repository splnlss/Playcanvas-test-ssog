import { expect, it } from 'vitest';
import { createDesktopInput, orbitTarget } from '../src/desktop';

it('clears held keys on pointer loss, focus loss, and disabling', () => {
  for (const reason of ['pointer', 'focus', 'enabled'] as const) {
    const input = createDesktopInput();
    input.set('enabled', true); input.set('pointer', true); input.set('focus', true);
    input.key('KeyW', true);
    expect(input.axes).toEqual([0, 0, 1]);
    input.set(reason, false); input.set(reason, true);
    expect(input.axes).toEqual([0, 0, 0]);
  }
});

it('puts an orbit target three meters ahead of the current pose', () => {
  expect(orbitTarget({ position: [1, 2, 3], rotation: [0, 0, 0, 1] }, 3)).toEqual([1, 2, 0]);
});
