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
