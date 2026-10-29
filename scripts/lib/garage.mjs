// The garage: every harvested car, parked with its gardener's plate.

import { carSvg, designFor } from './cars.mjs';
import { label, measure } from './font.mjs';
import { esc, n } from './util.mjs';

const W = 1200;
const SLOT_W = 300;
const SLOT_H = 178;
const TOP = 30;
const MAX_SHOWN = 11;

const THEMES = {
  day: { floor: '#ece6da', wall: '#d8cfbf', line: '#e0b43a', ink: '#3a2412', plate: '#fdf6d8', ghost: '#b9ad97', outline: '#2b1a20', lamp: '#fff3c4' },
  night: { floor: '#27253a', wall: '#1d1b2c', line: '#c9a93a', ink: '#2a190c', plate: '#efe6c4', ghost: '#5b5776', outline: '#0e0a12', lamp: '#ffd27a' },
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const stamp = (iso) => {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')} ${d.getUTCFullYear()}`;
};

export function renderGarage(state, { mode = 'day' } = {}) {
  const night = mode === 'night';
  const T = THEMES[mode];
  const shown = state.harvests.slice(-MAX_SHOWN);
  const hidden = state.harvests.length - shown.length;
  const rows = Math.ceil((shown.length + 1) / 4);
  const slots = rows * 4;
  const H = TOP + rows * SLOT_H + 14;
  const title = state.harvests.length
    ? `The garage: ${state.harvests.length} harvested car${state.harvests.length > 1 ? 's' : ''}, each named after the gardener who gave the last drop.`
    : `The garage is empty. Slot #${state.crop.number} is reserved for whoever gives the last drop.`;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t"><title id="t">${esc(title)}</title>`;
  s += `<style>.lt{animation:lt 3s ease-in-out infinite alternate}@keyframes lt{from{opacity:.55}to{opacity:1}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>`;
  s += `<rect width="${W}" height="${H}" rx="18" fill="${T.floor}"/>`;
  s += `<path d="M18 0H${W - 18}A18 18 0 0 1 ${W} 18V${TOP}H0V18A18 18 0 0 1 18 0Z" fill="${T.wall}"/>`;
  for (let i = 0; i < 4; i++) {
    const x = SLOT_W * i + SLOT_W / 2;
    s += `<ellipse class="lt" style="animation-delay:${-i * 0.7}s" cx="${x}" cy="${TOP + 4}" rx="70" ry="10" fill="${T.lamp}" opacity=".8"/>`;
    s += `<rect x="${x - 26}" y="${TOP - 8}" width="52" height="8" rx="3" fill="${T.outline}"/>`;
  }

  for (let i = 0; i < slots; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = col * SLOT_W;
    const y = TOP + row * SLOT_H;
    const h = shown[i];
    const number = h ? h.number : state.crop.number + (i - shown.length);
    if (col > 0) s += `<path d="M${x} ${y + 18}V${y + SLOT_H - 10}" stroke="${T.line}" stroke-width="6" stroke-linecap="round"/>`;
    s += label(`#${number}`, { x: x + 18, y: y + SLOT_H - 14, size: 14, fill: T.line, outline: T.floor, halo: 0, anchor: 'start' });
    // Further slots stay empty: only the next car is known yet.
    if (!h && i > shown.length) continue;

    const d = designFor(number);
    const cx = x + SLOT_W / 2;
    const scale = 2.2;
    const carTop = y + 118 - 40 * scale;
    if (h) {
      s += `<ellipse cx="${cx}" cy="${y + 120}" rx="104" ry="8" fill="#000" opacity="${night ? 0.35 : 0.14}"/>`;
      s += `<g transform="translate(${n(cx - 50 * scale)} ${n(carTop)}) scale(${scale})">${carSvg(d, { night, uid: `g${number}`, outline: T.outline })}</g>`;
      s += plate(T, `@${h.by}`, cx, y + 128);
      s += label(stamp(h.at), { x: cx, y: y + 170, size: 9, fill: T.ghost, outline: T.floor, halo: 0 });
    } else {
      // The crop that's growing right now, as a dashed outline.
      const ghost = carSvgOutline(d);
      s += `<g transform="translate(${n(cx - 50 * scale)} ${n(carTop)}) scale(${scale})">${ghost(T)}</g>`;
      s += plate(T, 'YOUR NAME HERE?', cx, y + 128);
      s += label('GIVE THE LAST DROP', { x: cx, y: y + 170, size: 9, fill: T.ghost, outline: T.floor, halo: 0 });
    }
  }
  if (hidden > 0) {
    s += label(`+${hidden} OLDER`, { x: W - 20, y: TOP - 10, size: 11, fill: T.line, outline: T.wall, halo: 0, anchor: 'end' });
  }
  return s + '</svg>';
}

function plate(T, text, cx, y) {
  const t = text.toUpperCase().slice(0, 20);
  const w = measure(t, 11) + 26;
  return (
    `<rect x="${n(cx - w / 2)}" y="${y}" width="${n(w)}" height="26" rx="5" fill="${T.plate}" stroke="${T.outline}" stroke-width="3"/>` +
    `<circle cx="${n(cx - w / 2 + 7)}" cy="${y + 13}" r="1.8" fill="${T.outline}"/><circle cx="${n(cx + w / 2 - 7)}" cy="${y + 13}" r="1.8" fill="${T.outline}"/>` +
    label(t, { x: cx, y: y + 18.5, size: 11, fill: T.ink, outline: T.plate, halo: 0 })
  );
}

// Dashed silhouette of a design (body + wheels), for the empty slot.
function carSvgOutline(d) {
  return (T) => {
    const svg = carSvg(d, { k: 0, uid: 'ghost', outline: T.ghost });
    // Keep only the outline strokes: drop every fill and dash the strokes.
    return `<g opacity=".9">${svg
      .replace(/fill="[^"]*"/g, 'fill="none"')
      .replace(/stroke="(?!none)[^"]*"/g, `stroke="${T.ghost}"`)
      .replace(/<path /g, '<path stroke-dasharray="5 4" ')}</g>`;
  };
}
