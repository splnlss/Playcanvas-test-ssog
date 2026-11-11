import { flightDelta, snapTurn } from './movement';

export function createXrLifecycle<T>(restore: (snapshot: T) => void) {
  let state: 'idle' | 'starting' | 'active' = 'idle';
  let saved: { value: T } | undefined;
  return {
    get state() { return state; },
    begin(snapshot: T) {
      if (state !== 'idle') return false;
      saved = { value: snapshot }; state = 'starting'; return true;
    },
    activate() { if (state === 'starting') state = 'active'; },
    end() {
      const previous = saved; saved = undefined; state = 'idle';
      if (previous) restore(previous.value);
    },
  };
}

export function vrMotion(left: [number,number] | null, right: [number,number] | null, yaw: number, armed: boolean, paused: boolean, dt: number, speed: number) {
  if (!left || !right || paused) return { delta: [0,0,0] as [number,number,number], degrees: 0, armed: false };
  const dead = (value: number) => Number.isFinite(value) && Math.abs(value) > 0.15 ? value : 0;
  const [rx, ry] = right.map(dead);
  const horizontal = Math.abs(rx) > Math.abs(ry);
  // Vertical dominance never rearms a still-deflected horizontal stick.
  const turn = horizontal || Math.abs(rx) < 0.2 ? snapTurn(rx, armed) : { degrees: 0, armed };
  return { delta: flightDelta([dead(left[0]), horizontal ? 0 : ry, dead(left[1])], yaw, speed, dt), ...turn };
}

import type { EventHandler } from 'playcanvas';
export function observeXrEnd(events: EventHandler, refresh: () => void) {
  let disposed = false;
  const afterTeardown = () => queueMicrotask(() => { if (!disposed) refresh(); });
  events.on('end',afterTeardown);
  return () => { disposed = true; events.off('end',afterTeardown); };
}
