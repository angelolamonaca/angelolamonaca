// Every crop grows a different car. The design is fixed when the seed is
// planted (it only depends on the crop number), so the bud you see ripening
// is exactly the car that ends up in the garage.
// Local car space: x 0..100 (rear to front), y 0..40 (roof to ground), y down.

import { arch, poly, rect, samplePolygon, svgPath } from './shape.mjs';
import { label } from './font.mjs';
import { darken, lighten, luminance, mix, n, rng, smoothstep } from './util.mjs';
import { box, cylinder, sphere, triangulate, orient } from './stl.mjs';

// `plain` is the everyday word for the color, for README copy.
export const PALETTE = [
  { name: 'Rosso', hex: '#e8322e', plain: 'red' },
  { name: 'Tangerine', hex: '#ff8a1f', plain: 'orange' },
  { name: 'Banana', hex: '#ffd23f', plain: 'yellow' },
  { name: 'Lime', hex: '#8bd346', plain: 'lime green' },
  { name: 'Lagoon', hex: '#1fb5a8', plain: 'teal' },
  { name: 'Azure', hex: '#2f80ed', plain: 'blue' },
  { name: 'Grape', hex: '#8e5cf7', plain: 'purple' },
  { name: 'Bubblegum', hex: '#ff6fb5', plain: 'pink' },
  { name: 'Pearl', hex: '#eef0f3', plain: 'white' },
  { name: 'Midnight', hex: '#33364a', plain: 'almost black' },
  { name: 'Mint', hex: '#7ee0c3', plain: 'mint green' },
  { name: 'Gold', hex: '#e2b33c', plain: 'gold' },
];

const STRIPES = ['#ffffff', '#24242c', '#ffd23f', '#2f80ed', '#e8322e'];

export const KINDS = { wedge: 'GT', bubble: 'Bug', pickup: 'Pickup', van: 'Van', formula: 'Racer' };

// Kinds and colors each walk their own fixed shuffle. 5 and 12 are coprime,
// so all 60 combinations come up before any repeats.
const shuffled = (arr, seed) => {
  const r = rng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const KIND_ORDER = shuffled(['bubble', 'pickup', 'van', 'formula'], 'kinds').concat('wedge');
const COLOR_ORDER = shuffled(PALETTE.slice(1), 'colors').concat(PALETTE[0]);

export function designFor(crop) {
  // Crop 1 is the toy car from the 2024 GIF finally growing up: a red wedge.
  if (crop === 1) return finish({ crop, kind: 'wedge', color: PALETTE[0], stripe: null, spoiler: false });
  const r = rng(`crop-${crop}`);
  const kind = KIND_ORDER[(crop - 2) % KIND_ORDER.length];
  const color = COLOR_ORDER[(crop - 2) % COLOR_ORDER.length];
  const stripe = r() < 0.5 ? r.pick(STRIPES.filter((s) => Math.abs(luminance(s) - luminance(color.hex)) > 0.2)) : null;
  const spoiler = kind === 'wedge' && r() < 0.6;
  return finish({ crop, kind, color, stripe, spoiler });
}

function finish(d) {
  return { ...d, hex: d.color.hex, name: `${d.color.name} ${KINDS[d.kind]}` };
}

const SILL = 33;

function geometry(d) {
  switch (d.kind) {
    case 'wedge':
      return {
        body: [
          ['M', 4, SILL], ['Q', 0.5, SILL, 0.5, 28.5], ['L', 1, 20], ['Q', 1.6, 15.8, 6, 15.2], ['L', 28, 12.6],
          ['C', 34, 5.2, 40, 3.6, 48, 3.6], ['L', 58, 3.6], ['C', 64.5, 3.6, 70, 8, 76, 12.6], ['L', 95, 17],
          ['Q', 100, 18.2, 100, 23], ['L', 99.6, 29], ['Q', 99.2, SILL, 95.5, SILL],
          ...arch(80, 31, 11, SILL), ...arch(22, 31, 11, SILL), ['Z'],
        ],
        windows: [[['M', 31.5, 12.3], ['C', 36.5, 6.6, 41, 5.4, 48, 5.4], ['L', 57.6, 5.4], ['C', 62.8, 5.4, 67.4, 8.7, 72, 12.4], ['Z']]],
        pillars: [[52.6, 5.4, 53.2, 12.4]],
        lines: [[35, 18.6, 61, 18.6], [35, 21.6, 61, 21.6], [35, 24.6, 61, 24.6], [42, 13, 43.5, 31], [46, 15.6, 50, 15.6]],
        shine: [[['M', 8, 16.2], ['Q', 18, 14.4, 27, 13.5]], [['M', 78, 14.4], ['L', 93, 17.8]]],
        head: [[93.5, 17.7], [98.8, 18.9], [98.4, 20.8], [93.2, 19.7]],
        tail: [[0.9, 18], [2.8, 17.8], [2.6, 23], [0.8, 23.2]],
        wheels: [{ x: 22, y: 31, r: 9 }, { x: 80, y: 31, r: 9 }],
        stripe: [27, 29.2],
        wing: d.spoiler ? { x0: 0, x1: 17, y0: 7.6, y1: 10.2, posts: [6, 12], base: 15 } : null,
        width: 42,
        belt: 12.6,
      };
    case 'bubble':
      return {
        body: [
          ['M', 6, SILL], ['Q', 1.5, SILL, 1.5, 28], ['C', 2, 19.5, 9, 13.8, 17, 12.6], ['C', 24, 1.2, 52, -0.2, 62.5, 10],
          ['C', 72, 11, 85, 14.5, 91, 21], ['Q', 95, 26, 93.8, SILL], ...arch(74, 31, 11, SILL), ...arch(20, 31, 11, SILL), ['Z'],
        ],
        windows: [[['M', 24.5, 12.6], ['C', 29.5, 5, 49.5, 3.4, 57.6, 10.4], ['L', 58.2, 12.8], ['Z']]],
        pillars: [[42, 4.4, 42, 12.7]],
        lines: [[45, 13.5, 45, 30], [48.5, 17, 52.5, 17], [31, 30.4, 63, 30.4]],
        shine: [[['M', 14, 15], ['C', 20, 7, 32, 3.4, 44, 3]]],
        headCircle: [89.6, 19.6, 2.6],
        tail: [[2.2, 20], [4.2, 19.4], [4, 24], [2.1, 24.2]],
        wheels: [{ x: 20, y: 31, r: 9 }, { x: 74, y: 31, r: 9 }],
        stripe: [21, 23.4],
        width: 40,
        belt: 12.6,
      };
    case 'pickup':
      return {
        body: [
          ['M', 4, SILL], ['Q', 1.5, SILL, 1.5, 30], ['L', 1.5, 18.2], ['L', 39.5, 18.2], ['L', 41.6, 8.4], ['Q', 42.6, 5, 46.4, 5],
          ['L', 60, 5], ['Q', 63.2, 5, 65.2, 8.2], ['L', 70.4, 16], ['L', 94, 18.2], ['Q', 99, 19.2, 99, 24], ['L', 99, 29.6],
          ['Q', 99, SILL, 95.6, SILL], ...arch(82, 31, 11, SILL), ...arch(20, 31, 11, SILL), ['Z'],
        ],
        windows: [[['M', 45.2, 8.2], ['L', 59.6, 8.2], ['Q', 61.6, 8.2, 62.8, 10.2], ['L', 66.4, 15.6], ['L', 45.2, 15.6], ['Z']]],
        pillars: [],
        lines: [[2, 21.4, 39, 21.4], [6.5, 18.8, 6.5, 32], [43.6, 16, 43.6, 31], [47, 19, 51, 19], [97.4, 20.6, 97.4, 28]],
        shine: [[['M', 72, 17.5], ['L', 92, 19.4]], [['M', 47, 6.6], ['L', 58, 6.6]]],
        head: [[95.6, 19.6], [98.6, 20], [98.6, 22.4], [95.4, 22.2]],
        tail: [[1.8, 19.2], [3.8, 19.2], [3.8, 23.4], [1.8, 23.4]],
        wheels: [{ x: 20, y: 31, r: 9 }, { x: 82, y: 31, r: 9 }],
        stripe: [24, 26.2],
        cargo: true,
        width: 44,
        belt: 15.6,
      };
    case 'van':
      return {
        body: [
          ['M', 4, SILL], ['Q', 1.5, SILL, 1.5, 30], ['L', 1.5, 7.2], ['Q', 1.5, 2.6, 6, 2.6], ['L', 67.6, 2.6], ['Q', 73.2, 2.6, 76.8, 7.4],
          ['L', 86, 17], ['Q', 97, 18.2, 97, 24.2], ['L', 97, 29.6], ['Q', 97, SILL, 93.6, SILL],
          ...arch(79, 31, 11, SILL), ...arch(21, 31, 11, SILL), ['Z'],
        ],
        windows: [rect(7, 6.5, 27, 15), rect(31, 6.5, 51, 15), [['M', 56, 6.5], ['L', 67.8, 6.5], ['Q', 71.6, 6.5, 74.2, 9.8], ['L', 78.8, 15.2], ['L', 56, 15.2], ['Z']]],
        pillars: [],
        lines: [[53.5, 5.5, 53.5, 31], [48, 22.5, 51.5, 22.5]],
        shine: [[['M', 8, 4.6], ['L', 64, 4.6]]],
        head: [[93.4, 19.6], [96.6, 20.2], [96.6, 22.6], [93.2, 22.4]],
        tail: [[1.8, 9], [3.6, 9], [3.6, 14.6], [1.8, 14.6]],
        wheels: [{ x: 21, y: 31, r: 9 }, { x: 79, y: 31, r: 9 }],
        stripe: [18.4, 21.6],
        width: 46,
        belt: 15.2,
      };
    case 'formula':
      return {
        body: [
          ['M', 8, 31.4], ['L', 4.6, 24], ['L', 17, 22.6], ['L', 31, 21.2], ['L', 39.4, 15.4], ['Q', 46, 12.2, 53, 15.4], ['L', 59, 20.4],
          ['L', 94, 23.8], ['Q', 100.4, 24.8, 99.8, 28.2], ['L', 96.4, 30.6], ['L', 60, 31.6], ['L', 30, 31.6], ['Z'],
        ],
        windows: [],
        pillars: [],
        lines: [[22, 26.5, 40, 26.5], [60, 28, 88, 27]],
        shine: [[['M', 60, 22.6], ['L', 90, 25.4]]],
        helmet: [46.4, 13.6, 4.4],
        visor: [[47.6, 12], [51.2, 12.4], [50.8, 14.4], [47.4, 14.2]],
        wing: { x0: -0.5, x1: 15.5, y0: 5.6, y1: 9.6, posts: [5.4, 11], base: 22.6 },
        frontWing: [89, 30.6, 103, 32.6],
        decal: [66, 25.6, 3.6],
        wheels: [{ x: 18, y: 30, r: 10, exposed: true }, { x: 82, y: 31.5, r: 8.5, exposed: true }],
        stripe: [26.4, 28.2],
        width: 30,
        belt: 20,
      };
  }
}

const GREEN = '#5fc556';

// SVG group for a car in local space.
//   k         0 = full paint, 1 = still a green bud
//   budWheels wheels drawn as little green buds
//   spin      wheels rotate (for the drive-in animation)
export function carSvg(d, { k = 0, budWheels = false, night = false, spin = false, uid = 'car', outline = '#2b1a20' } = {}) {
  const g = geometry(d);
  const base = night ? mix(d.hex, '#151036', 0.22) : d.hex;
  const body = mix(base, GREEN, k);
  const dark = darken(body, 0.32);
  const light = lighten(body, 0.55);
  const glass = mix(night ? '#1b2140' : '#2b3150', '#2f6f35', k);
  const glint = mix('#a9dcff', '#b5ecaa', k);
  const tire = budWheels ? '#3f9a3f' : '#25252b';
  const rim = budWheels ? '#8fdc7d' : '#cfd5dd';
  const ns = 'vector-effect="non-scaling-stroke"';
  const ol = (w) => `stroke="${outline}" stroke-width="${w}" stroke-linejoin="round" ${ns}`;
  const bodyD = svgPath(g.body);
  let s = `<g>`;

  // Dark wheel wells, visible in the gap between tire and arch.
  for (const w of g.wheels) {
    if (w.exposed) continue;
    const dx = Math.sqrt(11 * 11 - (SILL - w.y) ** 2);
    s += `<path d="M${n(w.x - dx)} ${SILL}A11 11 0 1 1 ${n(w.x + dx)} ${SILL}Z" fill="${mix('#1a1a1f', dark, 0.25)}"/>`;
  }

  if (g.wing) {
    const { x0, x1, y0, y1, posts, base: by } = g.wing;
    for (const px of posts) s += `<path d="M${n(px)} ${n(y1)}L${n(px + 0.6)} ${n(by)}" stroke="${outline}" stroke-width="2.4" stroke-linecap="round" ${ns}/>`;
    s += `<path d="${svgPath(rect(x0, y0, x1, y1))}" fill="${g.wing && d.kind === 'formula' ? dark : body}" ${ol(2.5)}/>`;
  }
  if (g.cargo) s += cargoPot(outline, ns);

  s += `<path d="${bodyD}" fill="${body}" ${ol(3)}/>`;
  if (d.stripe && k < 0.6) {
    s += `<clipPath id="${uid}-clip"><path d="${bodyD}"/></clipPath>`;
    s += `<rect clip-path="url(#${uid}-clip)" x="-2" y="${g.stripe[0]}" width="106" height="${n(g.stripe[1] - g.stripe[0])}" fill="${mix(d.stripe, GREEN, k)}" opacity="${n(1 - k)}"/>`;
  }
  for (const win of g.windows) {
    s += `<path d="${svgPath(win)}" fill="${glass}" ${ol(2)}/>`;
  }
  if (g.windows.length) {
    const [wx, wy] = [g.windows[0][0][1], g.windows[0][0][2]];
    s += `<path d="M${n(wx + 4)} ${n(wy - 1)}l4 -5" stroke="${glint}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
  }
  for (const [x1, y1, x2, y2] of g.pillars) s += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${body}" stroke-width="2.2"/>`;
  s += `<path d="${g.lines.map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`).join('')}" stroke="${dark}" stroke-width="0.9" stroke-linecap="round" fill="none"/>`;
  s += `<path d="${g.shine.map(svgPath).join('')}" stroke="${light}" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".9"/>`;
  if (g.head) s += `<path d="${svgPath(poly(g.head))}" fill="${mix('#fff3c0', GREEN, k * 0.6)}" ${ol(1.5)}/>`;
  if (g.headCircle) {
    const [hx, hy, hr] = g.headCircle;
    s += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${mix('#fff3c0', GREEN, k * 0.6)}" ${ol(1.5)}/>`;
  }
  if (g.tail) s += `<path d="${svgPath(poly(g.tail))}" fill="${mix('#ff4b4b', GREEN, k)}" ${ol(1.5)}/>`;
  if (g.helmet) {
    const [hx, hy, hr] = g.helmet;
    const helmetColor = luminance(d.hex) > 0.5 ? '#2f80ed' : '#ffd23f';
    s += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${mix(helmetColor, GREEN, k)}" ${ol(2)}/>`;
    s += `<path d="${svgPath(poly(g.visor))}" fill="${glass}" ${ol(1.2)}/>`;
  }
  if (g.frontWing) {
    const [x0, y0, x1, y1] = g.frontWing;
    s += `<path d="${svgPath(rect(x0, y0, x1, y1))}" fill="${dark}" ${ol(2)}/>`;
  }
  if (g.decal && k < 0.5) {
    const [cx, cy, r] = g.decal;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" ${ol(1.5)}/>`;
    s += label(String(d.crop), { x: cx, y: cy + 2, size: 4, fill: '#24242c', halo: 0, weight: 0.24 });
  }
  for (const w of g.wheels) s += wheel(w, { tire, rim, hub: dark, outline, spin, ns });
  return s + '</g>';
}

function wheel({ x, y, r }, { tire, rim, hub, outline, spin, ns }) {
  const spokes = [0, 72, 144, 216, 288]
    .map((a) => {
      const t = (a * Math.PI) / 180;
      return `M0 0L${n(Math.cos(t) * r * 0.5)} ${n(Math.sin(t) * r * 0.5)}`;
    })
    .join('');
  return (
    `<g transform="translate(${n(x)} ${n(y)})"><g${spin ? ' class="wspin"' : ''}>` +
    `<circle r="${r}" fill="${tire}" stroke="${outline}" stroke-width="3" ${ns}/>` +
    `<circle r="${n(r * 0.58)}" fill="${rim}" stroke="${outline}" stroke-width="2" ${ns}/>` +
    `<path d="${spokes}" stroke="${darken(rim, 0.35)}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<circle r="${n(r * 0.17)}" fill="${hub}"/></g></g>`
  );
}

// Pickups carry a seedling in the bed, ready for the next crop.
function cargoPot(outline, ns) {
  return (
    `<path d="M13 18.4L14 11.6L24 11.6L25 18.4Z" fill="#c8693a" stroke="${outline}" stroke-width="2" stroke-linejoin="round" ${ns}/>` +
    `<path d="M19 11.6Q19 6 18.5 4" stroke="#3f9a3f" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M18.6 6.4Q14.4 5.4 14.2 2.4Q18.4 2.6 18.6 6.4ZM18.8 5.2Q22.6 3.4 24.4 5.6Q21 7.6 18.8 5.2Z" fill="#6fd36b" stroke="${outline}" stroke-width="1.5" stroke-linejoin="round" ${ns}/>`
  );
}

// ---------------------------------------------------------------------------
// 3D: the same silhouette extruded with a narrower roof, plus wheels.
// Model space: X = length, Y = width, Z = up (millimetres, ~100 long).

export function carMesh(d) {
  const g = geometry(d);
  const tris = [];
  const P = samplePolygon(g.body, 6).map(([x, y]) => [x, 40 - y]);
  const zBelt = 40 - g.belt;
  const zTop = Math.max(...P.map((p) => p[1]));
  const half = (z) => (g.width / 2) * (1 - 0.3 * smoothstep(zBelt - 2, zTop, z));

  // Side panels, triangulated from the silhouette.
  for (const [a, b, c] of triangulate(P)) {
    for (const side of [1, -1]) {
      const v = [a, b, c].map((i) => [P[i][0], side * half(P[i][1]), P[i][1]]);
      tris.push(orient(v, [0, side, 0]));
    }
  }
  // Skin around the silhouette.
  const area = P.reduce((s, p, i) => {
    const q = P[(i + 1) % P.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0);
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    const q = P[(i + 1) % P.length];
    const [dx, dz] = [q[0] - p[0], q[1] - p[1]];
    const out = area > 0 ? [dz, 0, -dx] : [-dz, 0, dx];
    const A = [p[0], half(p[1]), p[1]];
    const B = [q[0], half(q[1]), q[1]];
    const C = [q[0], -half(q[1]), q[1]];
    const D = [p[0], -half(p[1]), p[1]];
    tris.push(orient([A, B, C], out), orient([A, C, D], out));
  }
  // Wheels.
  for (const w of g.wheels) {
    const tw = w.exposed ? 9 : 7.5;
    const zc = 40 - w.y;
    const sideY = w.exposed ? g.width / 2 + 0.6 : g.width / 2 - tw + 2;
    for (const side of [1, -1]) {
      const y0 = side * sideY;
      const y1 = side * (sideY + tw);
      tris.push(...cylinder([w.x, Math.min(y0, y1), zc], w.r, Math.abs(y1 - y0), 18));
      // Hub caps stand slightly proud of the tire.
      const hy = side > 0 ? Math.max(y0, y1) : Math.min(y0, y1) - 0.8;
      tris.push(...cylinder([w.x, hy, zc], w.r * 0.55, 0.8, 12));
    }
  }
  if (g.wing) {
    const { x0, x1, y0, y1, posts, base } = g.wing;
    const wy = g.width / 2 - 2;
    tris.push(...box([x0, -wy, 40 - y1], [x1, wy, 40 - y0]));
    for (const px of posts) for (const side of [1, -1]) {
      const yc = side * (wy - 5);
      tris.push(...box([px - 0.8, yc - 0.8, 40 - base - 1], [px + 0.8, yc + 0.8, 40 - y1]));
    }
  }
  if (g.frontWing) {
    const [x0, y0, x1, y1] = g.frontWing;
    tris.push(...box([x0, -g.width / 2 - 8, 40 - y1], [x1, g.width / 2 + 8, 40 - y0]));
  }
  if (g.helmet) {
    const [hx, hy, hr] = g.helmet;
    tris.push(...sphere([hx, 0, 40 - hy], hr, 10, 7));
  }
  return tris;
}
