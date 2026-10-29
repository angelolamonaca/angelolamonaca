// The car plant, drawn around its base at (0, 0) with y pointing down.
// g is the crop's growth, 0..1 (water / goal).

import { carSvg } from './cars.mjs';
import { bezier, lerp, mix, n, smoothstep } from './util.mjs';

export const STAGES = ['Planted', 'Sprout', 'Seedling', 'Budding', 'Blooming', 'Ripe'];

export function stageOf(g) {
  if (g < 0.05) return 0;
  if (g < 0.2) return 1;
  if (g < 0.4) return 2;
  if (g < 0.6) return 3;
  if (g < 0.8) return 4;
  return 5;
}

const leafPath = (L, W) =>
  `M0 0C${n(L * 0.22)} ${n(-W * 1.05)} ${n(L * 0.72)} ${n(-W * 0.95)} ${n(L)} ${n(L * 0.06)}` +
  `C${n(L * 0.7)} ${n(W * 0.75)} ${n(L * 0.25)} ${n(W * 0.85)} 0 0Z`;

function leaf(L, W, P, ol) {
  const veins = [0.32, 0.52, 0.72]
    .map((v) => `M${n(L * v)} ${n(-W * 0.06 + L * 0.03 * v)}l${n(L * 0.11)} ${n(-W * 0.42)}`)
    .join('');
  return (
    `<path d="${leafPath(L, W)}" fill="${P.leaf}" stroke="${ol}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M${n(L * 0.05)} 0Q${n(L * 0.5)} ${n(-W * 0.12)} ${n(L * 0.93)} ${n(L * 0.055)}" stroke="${P.leafDark}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
    `<path d="${veins}" stroke="${P.leafDark}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M${n(L * 0.18)} ${n(-W * 0.5)}Q${n(L * 0.42)} ${n(-W * 0.82)} ${n(L * 0.66)} ${n(-W * 0.62)}" stroke="${P.leafLight}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`
  );
}

function sepal(L, P, ol) {
  const W = L * 0.34;
  return `<path d="M0 0C${n(L * 0.25)} ${n(-W)} ${n(L * 0.75)} ${n(-W * 0.6)} ${n(L)} 0C${n(L * 0.75)} ${n(W * 0.6)} ${n(L * 0.25)} ${n(W)} 0 0Z" fill="${P.leaf}" stroke="${ol}" stroke-width="2.6" stroke-linejoin="round"/>`;
}

const sparkle = (x, y, r, delay) =>
  `<g transform="translate(${n(x)} ${n(y)})"><path class="spk" style="animation-delay:${delay}s" d="M0 ${-r}Q${n(r * 0.18)} ${n(-r * 0.18)} ${r} 0Q${n(r * 0.18)} ${n(r * 0.18)} 0 ${r}Q${n(-r * 0.18)} ${n(r * 0.18)} ${-r} 0Q${n(-r * 0.18)} ${n(-r * 0.18)} 0 ${-r}Z" fill="#fff7c2"/></g>`;

export function plantSvg({ g, design, P, night }) {
  const ol = P.outline;
  if (g < 0.05) return planted({ g, design, P, night });

  const H = lerp(46, 292, smoothstep(0.05, 0.92, g));
  const sw = lerp(5, 14, smoothstep(0.05, 0.9, g));
  const p0 = [0, 0];
  const p1 = [-0.12 * H, -0.35 * H];
  const p2 = [0.12 * H, -0.68 * H];
  const p3 = [0.03 * H, -H];
  const stem = `M0 0C${n(p1[0])} ${n(p1[1])} ${n(p2[0])} ${n(p2[1])} ${n(p3[0])} ${n(p3[1])}`;
  const tip = { x: p3[0], y: p3[1] };

  let back = '';
  let front = '';

  // Leaves along the stem, alternating sides, bigger at the bottom.
  const leaves = g < 0.2 ? 0 : Math.round(lerp(2, 10, smoothstep(0.2, 0.95, g)));
  const Lmax = lerp(32, 96, smoothstep(0.2, 0.9, g));
  let leafSvg = '';
  for (let i = 0; i < leaves; i++) {
    const t = 0.2 + (0.55 * (i + 0.5)) / leaves;
    const at = bezier(p0, p1, p2, p3, t);
    const side = i % 2 ? 1 : -1;
    const L = Lmax * (1 - 0.42 * ((t - 0.2) / 0.55));
    const ang = -8 - 40 * ((t - 0.2) / 0.55);
    leafSvg +=
      `<g transform="translate(${n(at.x)} ${n(at.y)}) scale(${side} 1) rotate(${n(ang)})">` +
      `<g class="lf" style="animation-delay:${n(-i * 0.7)}s">${leaf(L, L * 0.4, P, ol)}</g></g>`;
  }

  // Seed leaves while it is still a sprout.
  if (g < 0.22) {
    const c = lerp(10, 24, smoothstep(0.05, 0.2, g));
    for (const side of [-1, 1]) {
      leafSvg +=
        `<g transform="translate(${n(tip.x)} ${n(tip.y + 2)}) scale(${side} 1) rotate(-32)">` +
        `<g class="lf" style="animation-delay:${side * 0.8}s">${leaf(c, c * 0.62, P, ol)}</g></g>`;
    }
  }

  // Stem: outline, body, highlight.
  back +=
    `<path d="${stem}" stroke="${ol}" stroke-width="${n(sw + 5.5)}" fill="none" stroke-linecap="round"/>` +
    `<path d="${stem}" stroke="${P.stem}" stroke-width="${n(sw)}" fill="none" stroke-linecap="round"/>` +
    `<path d="${stem}" transform="translate(${n(-sw * 0.22)} 0)" stroke="${P.stemLight}" stroke-width="${n(sw * 0.22)}" fill="none" stroke-linecap="round" opacity=".75"/>`;
  back += leafSvg;

  // Bud, calyx and the car itself.
  if (g >= 0.2) {
    const budT = smoothstep(0.2, 0.5, g);
    const open = smoothstep(0.5, 0.8, g);
    const spread = lerp(10, 68, open);
    const Ls = lerp(14, 26, budT) + open * 14;
    const s = lerp(0.6, 2.25, smoothstep(0.45, 0.95, g));
    const k = 1 - smoothstep(0.5, 0.86, g);

    const sep = (ang, scale = 1) =>
      `<g transform="translate(${n(tip.x)} ${n(tip.y + 3)}) rotate(${n(ang)})">${sepal(Ls * scale, P, ol)}</g>`;

    let calyxBack = sep(-90) + sep(-90 - spread) + sep(-90 + spread);
    let calyxFront = open > 0.05 ? sep(-90 - spread * 0.5 - 25, 0.8) + sep(-90 + spread * 0.5 + 25, 0.8) : '';

    let bud = '';
    const budFade = 1 - smoothstep(0.02, 0.2, open);
    if (budFade > 0.01) {
      const ry = lerp(9, 24, budT);
      const rx = lerp(6, 15, budT);
      const cy = tip.y - ry * 0.75;
      bud += `<g opacity="${n(budFade)}"><ellipse cx="${n(tip.x)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${P.leaf}" stroke="${ol}" stroke-width="3"/>`;
      // A sliver of paint peeks out of the bud before it opens.
      const peek = smoothstep(0.36, 0.5, g);
      if (peek > 0) {
        bud += `<path d="M${n(tip.x - rx * 0.55)} ${n(cy - ry * 0.55)}Q${n(tip.x)} ${n(cy - ry * 1.25)} ${n(tip.x + rx * 0.55)} ${n(cy - ry * 0.55)}Q${n(tip.x)} ${n(cy - ry * 0.75)} ${n(tip.x - rx * 0.55)} ${n(cy - ry * 0.55)}Z" fill="${mix(design.hex, P.leaf, 1 - peek * 0.8)}" stroke="${ol}" stroke-width="2"/>`;
      }
      bud += `<path d="M${n(tip.x - rx * 0.35)} ${n(cy - ry * 0.2)}Q${n(tip.x - rx * 0.1)} ${n(cy - ry * 0.75)} ${n(tip.x + rx * 0.15)} ${n(cy - ry * 0.85)}" stroke="${P.leafLight}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
    }

    let car = '';
    if (open > 0.05) {
      const glow = g >= 0.97 ? `<ellipse class="ripe" cx="${n(tip.x)}" cy="${n(tip.y - 22 * s)}" rx="${n(70 * s)}" ry="${n(34 * s)}" fill="url(#ripeGlow)"/>` : '';
      car =
        glow +
        `<g transform="translate(${n(tip.x - 50 * s)} ${n(tip.y - 38 * s)}) scale(${n(s)})">` +
        `<g class="${g >= 0.8 ? 'bob' : ''}">${carSvg(design, { k, budWheels: g < 0.72, night, uid: 'crop', outline: ol })}</g></g>`;
    }

    let sparkles = '';
    if (g >= 0.8) {
      const cx = tip.x;
      const cy = tip.y - 22 * s;
      sparkles =
        sparkle(cx - 58 * s, cy - 18 * s, 9, 0) +
        sparkle(cx + 56 * s, cy - 24 * s, 11, 0.7) +
        sparkle(cx + 38 * s, cy + 22 * s, 7, 1.3) +
        sparkle(cx - 34 * s, cy - 34 * s, 6, 1.9);
    }
    back += calyxBack + bud + car;
    front += calyxFront + sparkles;
  }

  return `<g class="sway">${back}${front}</g>`;
}

// Stage 0: a toy car stuck nose-first in the mound, like in the GIF.
// Drawn on top of the mound; the buried half is clipped away.
function planted({ g, design, P, night }) {
  const ol = P.outline;
  const sprout = g > 0.015;
  const clumps = [[-6, -11, 7], [6, -12, 6], [17, -10, 7], [27, -8, 5]]
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${n(r * 0.55)}" fill="${P.soilDark}" stroke="${ol}" stroke-width="2.4"/>`)
    .join('');
  return (
    `<clipPath id="ground"><rect x="-200" y="-200" width="400" height="189"/></clipPath>` +
    `<g clip-path="url(#ground)"><g transform="translate(14 -6) rotate(30) translate(-60 -28)">` +
    carSvg(design, { k: 0, night, uid: 'seed', outline: ol }) +
    `</g></g>` +
    clumps +
    (sprout
      ? `<g transform="translate(-40 -9)"><path d="M0 0Q-2 -10 1 -18" stroke="${ol}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
        `<path d="M0 0Q-2 -10 1 -18" stroke="${P.stem}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<g transform="translate(1 -18) rotate(-40)">${leaf(11, 7, P, ol)}</g>` +
        `<g transform="translate(1 -18) scale(-1 1) rotate(-40)">${leaf(9, 6, P, ol)}</g></g>`
      : '')
  );
}
