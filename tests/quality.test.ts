import { expect, it } from 'vitest';
import { createQuality } from '../src/quality';
const profiles = { low: { splatBudget: 250_000 }, medium: { splatBudget: 500_000 }, high: { splatBudget: 1_000_000 } };

it('applies distinct presets and preserves selection after session exit clears Auto', () => {
  const budgets: number[] = [];
  const q = createQuality(p => budgets.push(p.splatBudget), profiles);
  q.select('low'); q.select('high'); q.setAuto(true); q.setAuto(false); q.onEnter();
  expect(budgets).toEqual([250_000, 1_000_000, 1_000_000]);
  expect(q.state.preset).toBe('high'); expect(q.state.auto).toBe(false);
});
it('measures application FPS from elapsed frames, ignoring invalid dt', () => {
  const q = createQuality(() => {}, profiles);
  q.update(NaN, 72); q.update(0, 72);
  for (let i = 0; i < 60; i++) q.update(1 / 60, 72);
  expect(q.state.fps).toBeCloseTo(60);
});
it('reduces quality under sustained load and respects cooldown and manual override', () => {
  const q = createQuality(() => {}, profiles); q.setAuto(true);
  for (let i = 0; i < 80; i++) q.update(0.05, 72);
  expect(q.state.preset).toBe('low');
  q.select('high');
  for (let i = 0; i < 500; i++) q.update(0.05, 72);
  expect(q.state.preset).toBe('high'); expect(q.state.auto).toBe(false);
});
it('raises detail only after sustained near-target FPS and does not exceed high', () => {
  const q = createQuality(() => {}, profiles); q.select('low'); q.setAuto(true);
  for (let i = 0; i < 9 * 72; i++) q.update(1 / 72, 72);
  expect(q.state.preset).toBe('low');
  for (let i = 0; i < 2 * 72; i++) q.update(1 / 72, 72);
  expect(q.state.preset).toBe('medium');
  for (let i = 0; i < 25 * 72; i++) q.update(1 / 72, 72);
  expect(q.state.preset).toBe('high');
});

it('keeps Auto selected before entry and starts fresh performance measurements', () => {
  const q = createQuality(() => {}, profiles);
  for (let i = 0; i < 60; i++) q.update(1 / 60, 72);
  q.setAuto(true);
  q.onEnter();
  expect(q.state.auto).toBe(true);
  expect(q.state.fps).toBe(0);
  for (let i = 0; i < 80; i++) q.update(0.05, 72);
  expect(q.state.preset).toBe('low');
});

it('enables automatic quality on a fresh viewer', () => {
  const q = createQuality(() => {}, profiles);
  expect(q.state.auto).toBe(true);
});
