import { expect, it } from 'vitest';
import { createLoadState } from '../src/load-state';

it('ignores late content and errors from a replaced scene load', () => {
  const loading = createLoadState();
  const oldLoad = loading.begin();
  const current = loading.begin();
  expect(loading.ready(oldLoad)).toBe(false);
  expect(loading.fail(oldLoad, 'old error')).toBe(false);
  expect(loading.state).toBe('loading');
  expect(loading.ready(current)).toBe(true);
  expect(loading.state).toBe('ready');
});

it('does not treat initial metadata as rendered content or revive a failed load', () => {
  const loading = createLoadState();
  const attempt = loading.begin();
  expect(loading.state).toBe('loading');
  expect(loading.fail(attempt, 'Missing chunk')).toBe(true);
  expect(loading.ready(attempt)).toBe(false);
  expect(loading.state).toBe('error');
  expect(loading.error).toBe('Missing chunk');
});

it('invalidates outstanding completions on disposal', () => {
  const loading = createLoadState();
  const attempt = loading.begin();
  loading.cancel();
  expect(loading.state).toBe('idle');
  expect(loading.ready(attempt)).toBe(false);
  expect(loading.fail(attempt, 'late')).toBe(false);
});

import { createLoadDeadline } from '../src/load-state';
it('does not time out backgrounded loads and expires after visible rendering time', () => {
  const deadline = createLoadDeadline(1);
  for (let i=0;i<100;i++) expect(deadline.tick(0.1,false)).toBe(false);
  expect(deadline.tick(NaN,true)).toBe(false);
  // A resumed frame cannot spend 120 seconds of background time in one tick.
  expect(deadline.tick(120,true)).toBe(false);
  for (let i=0;i<8;i++) expect(deadline.tick(0.1,true)).toBe(false);
  expect(deadline.tick(0.1,true)).toBe(true);
});
