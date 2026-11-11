/** Local panel coordinates after inverse world transform; excludes header and gutters. */
export function panelRow(x: number, y: number, count: number, height = 900, header = 180) {
  if (Math.abs(x) > 0.46875 || Math.abs(y) > 0.5) return -1;
  const pixel = (0.5 - y) * height - header;
  const row = Math.floor(pixel / 100);
  return row >= 0 && row < count && pixel % 100 <= 84 ? row : -1;
}

/** Reserve row six for paging when more than six actions are available. */
export function menuPage<T>(actions: T[], requested: number) {
  const size = actions.length > 6 ? 5 : 6;
  const pages = Math.max(1, Math.ceil(actions.length / size));
  const page = ((requested % pages) + pages) % pages;
  return { page, pages, items: actions.slice(page * size, (page + 1) * size) };
}

/** Bound text to readable rows instead of compressing a failure into one line. */
export function wrapMenuText(text: string, columns = 54, maxLines = 5) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (line && line.length + word.length + 1 > columns) { lines.push(line); line = ''; }
    let rest = word;
    while (rest.length > columns) { if (line) { lines.push(line); line = ''; } lines.push(rest.slice(0, columns)); rest = rest.slice(columns); }
    line += (line ? ' ' : '') + rest;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, columns - 1) + '…'; }
  return lines;
}
