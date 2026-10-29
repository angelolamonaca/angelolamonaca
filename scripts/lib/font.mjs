// A hand-made single-stroke "sign painter" font. SVG images on GitHub cannot
// load web fonts, so every label is drawn as stroked paths instead of <text>.
// Glyphs live on a 6-unit cap height (y = 0 top, y = 6 baseline).

import { n } from './util.mjs';

const G = {
  A: [4, 'M0 6L2 0L4 6M0.75 3.9L3.25 3.9'],
  B: [4, 'M0 3L2.6 3Q3.9 3 3.9 4.5Q3.9 6 2.6 6L0 6L0 0L2.3 0Q3.6 0 3.6 1.5Q3.6 3 2.3 3'],
  C: [4, 'M4 1.1Q3.3 0 2.1 0Q0 0 0 3Q0 6 2.1 6Q3.3 6 4 4.9'],
  D: [4, 'M0 0L0 6L1.7 6Q4 6 4 3Q4 0 1.7 0Z'],
  E: [3.8, 'M3.8 0L0 0L0 6L3.8 6M0 3L3 3'],
  F: [3.8, 'M3.8 0L0 0L0 6M0 3L3 3'],
  G: [4, 'M4 1.1Q3.3 0 2.1 0Q0 0 0 3Q0 6 2.1 6Q4 6 4 3.6L2.4 3.6'],
  H: [4, 'M0 0L0 6M4 0L4 6M0 3L4 3'],
  I: [3, 'M0.2 0L2.8 0M1.5 0L1.5 6M0.2 6L2.8 6'],
  J: [4, 'M1.2 0L4 0M3 0L3 4.4Q3 6 1.5 6Q0 6 0 4.6'],
  K: [4, 'M0 0L0 6M3.9 0L0 3.7M1.4 2.6L4 6'],
  L: [3.8, 'M0 0L0 6L3.8 6'],
  M: [5, 'M0 6L0 0L2.5 3.6L5 0L5 6'],
  N: [4, 'M0 6L0 0L4 6L4 0'],
  O: [4, 'M2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3Q4 0 2 0Z'],
  P: [4, 'M0 6L0 0L2.4 0Q4 0 4 1.65Q4 3.3 2.4 3.3L0 3.3'],
  Q: [4.2, 'M2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3Q4 0 2 0ZM2.7 4.5L4.2 6.3'],
  R: [4, 'M0 6L0 0L2.4 0Q4 0 4 1.65Q4 3.3 2.4 3.3L0 3.3M2.3 3.3L4 6'],
  S: [4, 'M3.9 1Q3.3 0 2 0Q0.1 0 0.1 1.55Q0.1 3 2 3Q3.9 3 3.9 4.5Q3.9 6 2 6Q0.6 6 0 4.9'],
  T: [4, 'M0 0L4 0M2 0L2 6'],
  U: [4, 'M0 0L0 4Q0 6 2 6Q4 6 4 4L4 0'],
  V: [4, 'M0 0L2 6L4 0'],
  W: [5.4, 'M0 0L1.3 6L2.7 2.2L4.1 6L5.4 0'],
  X: [4, 'M0.2 0L3.8 6M3.8 0L0.2 6'],
  Y: [4, 'M0 0L2 3.1L4 0M2 3.1L2 6'],
  Z: [4, 'M0.2 0L3.9 0L0.1 6L3.9 6'],
  0: [4, 'M2 0Q0 0 0 3Q0 6 2 6Q4 6 4 3Q4 0 2 0ZM1.1 4.4L2.9 1.6'],
  1: [3.4, 'M0.7 1.3L2 0L2 6M0.6 6L3.4 6'],
  2: [4, 'M0.2 1.2Q0.8 0 2.1 0Q3.9 0 3.9 1.7Q3.9 2.9 2.5 3.9L0.1 6L4 6'],
  3: [4, 'M0.2 0.8Q0.9 0 2 0Q3.8 0 3.8 1.5Q3.8 3 2 3Q4 3 4 4.5Q4 6 2 6Q0.7 6 0.1 5.2'],
  4: [4, 'M3 6L3 0L0 4.2L4 4.2'],
  5: [4, 'M3.8 0L0.5 0L0.3 2.6Q1 2.2 2 2.2Q4 2.2 4 4.1Q4 6 2 6Q0.7 6 0.1 5.2'],
  6: [4, 'M3.6 0.5Q3 0 2.1 0Q0 0 0 3.4Q0 6 2 6Q4 6 4 4.2Q4 2.5 2 2.5Q0.7 2.5 0.05 3.5'],
  7: [4, 'M0 0L4 0L1.6 6'],
  8: [4, 'M2 3Q0.3 3 0.3 1.5Q0.3 0 2 0Q3.7 0 3.7 1.5Q3.7 3 2 3Q0 3 0 4.5Q0 6 2 6Q4 6 4 4.5Q4 3 2 3Z'],
  9: [4, 'M0.4 5.5Q1 6 1.9 6Q4 6 4 2.6Q4 0 2 0Q0 0 0 1.8Q0 3.5 2 3.5Q3.3 3.5 3.95 2.5'],
  '.': [1, 'M0.5 6L0.5 6'],
  ',': [1, 'M0.7 5.7L0.2 7'],
  '!': [1, 'M0.5 0L0.5 3.9M0.5 6L0.5 6'],
  '?': [4, 'M0.1 1.2Q0.6 0 2 0Q3.9 0 3.9 1.6Q3.9 2.7 2.7 3.3Q2 3.7 2 4.4M2 6L2 6'],
  '-': [3, 'M0.3 3.2L2.7 3.2'],
  '/': [3, 'M0 6.2L3 -0.2'],
  ':': [1, 'M0.5 1.8L0.5 1.8M0.5 5.6L0.5 5.6'],
  '#': [4.4, 'M1.5 0.4L0.9 5.6M3.5 0.4L2.9 5.6M0.2 2L4.4 2M0 4L4.2 4'],
  '@': [5.6, 'M3.7 3Q3.7 1.8 2.8 1.8Q1.8 1.8 1.8 3.1Q1.8 4.2 2.7 4.2Q3.7 4.2 3.7 3ZM3.7 1.9L3.7 3.9Q3.7 4.7 4.5 4.7Q5.6 4.7 5.6 3Q5.6 0 2.8 0Q0 0 0 3Q0 6 2.8 6Q3.8 6 4.6 5.6'],
  "'": [1, 'M0.5 0L0.5 1.7'],
  '+': [3.6, 'M0 3L3.6 3M1.8 1.2L1.8 4.8'],
  '(': [1.8, 'M1.6 -0.2Q0 1.5 0 3Q0 4.5 1.6 6.2'],
  ')': [1.8, 'M0.2 -0.2Q1.8 1.5 1.8 3Q1.8 4.5 0.2 6.2'],
  '%': [4.4, 'M0.3 6L4.1 0M1 0.6L1 0.6M3.4 5.4L3.4 5.4'],
  '·': [1, 'M0.5 3L0.5 3'],
  '=': [3.6, 'M0 2.2L3.6 2.2M0 4L3.6 4'],
  '>': [3.4, 'M0 1L3.4 3L0 5'],
  ' ': [2.4, ''],
};

const SPACING = 1.5;

const glyph = (ch) => G[ch] ?? G[ch.toUpperCase()] ?? G['?'];

export function measure(text, size) {
  const s = size / 6;
  const chars = [...text];
  const units = chars.reduce((w, ch) => w + glyph(ch)[0], 0) + SPACING * Math.max(0, chars.length - 1);
  return units * s;
}

// Path data for `text` with its baseline at y. size = cap height in px.
export function textPath(text, { x = 0, y = 0, size = 12, anchor = 'start' } = {}) {
  const s = size / 6;
  const width = measure(text, size);
  let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const top = y - 6 * s;
  let d = '';
  for (const ch of text) {
    const [w, path] = glyph(ch);
    let isX = true;
    let prevNum = false;
    for (const tok of path.match(/[A-Z]|-?\d*\.?\d+/g) ?? []) {
      if (tok >= 'A' && tok <= 'Z') {
        d += tok;
        isX = true;
        prevNum = false;
        continue;
      }
      const v = parseFloat(tok);
      const str = isX ? n(cx + v * s) : n(top + v * s);
      d += (prevNum && !str.startsWith('-') ? ' ' : '') + str;
      isX = !isX;
      prevNum = true;
    }
    cx += (w + SPACING) * s;
  }
  return { d, width };
}

// Painted lettering: a fat dark outline under a lighter stroke.
export function label(text, { x, y, size, anchor = 'middle', fill = '#fff6df', outline = '#2b1a20', weight = 0.2, halo = 0.22, cls = '' }) {
  const { d } = textPath(text, { x, y, size, anchor });
  const w = size * weight;
  const o = w + size * halo;
  const c = cls ? ` class="${cls}"` : '';
  return `<g${c} fill="none" stroke-linecap="round" stroke-linejoin="round">${
    halo > 0 ? `<path d="${d}" stroke="${outline}" stroke-width="${n(o)}"/>` : ''
  }<path d="${d}" stroke="${fill}" stroke-width="${n(w)}"/></g>`;
}
