/** Local panel coordinates after inverse world transform; excludes header and gutters. */
export function panelRow(x: number, y: number, count: number) {
  if (Math.abs(x) > 0.46875 || Math.abs(y) > 0.5) return -1;
  const pixel = (0.5 - y) * 900 - 180;
  const row = Math.floor(pixel / 100);
  return row >= 0 && row < count && pixel % 100 <= 84 ? row : -1;
}
