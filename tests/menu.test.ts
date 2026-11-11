import { expect, it } from 'vitest';
import { panelRow } from '../src/menu-hit';

it('maps visible button rows and rejects gutters, outside points, and the header', () => {
  // 900px-high texture, row 0 starts at 180px and is 84px high.
  expect(panelRow(0, 0.5 - 220 / 900, 6)).toBe(0);
  expect(panelRow(0, 0.5 - 720 / 900, 6)).toBe(5);
  expect(panelRow(0, 0.5 - 270 / 900, 6)).toBe(-1);
  expect(panelRow(0.6, 0.5 - 220 / 900, 6)).toBe(-1);
  expect(panelRow(0, 0.49, 6)).toBe(-1);
});

import { menuPage } from '../src/menu-hit';
it('keeps every guide action reachable in bounded XR menu pages', () => {
  const items = Array.from({ length: 14 }, (_, i) => i);
  expect(menuPage(items, 0).items).toEqual([0, 1, 2, 3, 4]);
  expect(menuPage(items, 1).items).toEqual([5, 6, 7, 8, 9]);
  expect(menuPage(items, 2).items).toEqual([10, 11, 12, 13]);
  expect(menuPage(items, 3).page).toBe(0);
  expect(menuPage([0, 1], 0).items).toEqual([0, 1]);
});

import { wrapMenuText } from '../src/menu-hit';
it('keeps guide failures readable above XR buttons and includes the recovery instruction', () => {
  const text = 'Final voice recording, checked captions and mouth cues are not configured. Add them in src/guide/config.ts, then reload.';
  const lines = wrapMenuText(text);
  expect(lines.join(' ')).toBe(text);
  expect(lines.every(line => line.length <= 54)).toBe(true);
  expect(panelRow(0, 0.5 - 250 / 1024, 6, 1024, 300)).toBe(-1);
  expect(panelRow(0, 0.5 - 340 / 1024, 6, 1024, 300)).toBe(0);
  expect(panelRow(0, 0.5 - 840 / 1024, 6, 1024, 300)).toBe(5);
});
