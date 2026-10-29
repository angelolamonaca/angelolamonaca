// The "Water the car" button under the garden.

import { label, measure } from './font.mjs';

export function renderButton() {
  const text = 'WATER THE CAR';
  const size = 22;
  const tw = measure(text, size);
  const W = Math.round(tw + 150);
  const H = 96;
  const ol = '#2b1a20';
  const pill = `M48 8H${W - 48}A40 40 0 0 1 ${W - 48} 88H48A40 40 0 0 1 48 8Z`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t"><title id="t">Water the car</title>` +
    `<style>.b{animation:b 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes b{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}` +
    `.s{animation:s 3.4s ease-in-out infinite}@keyframes s{0%{transform:translateX(-120px)}55%,100%{transform:translateX(${W + 40}px)}}` +
    `.d{animation:d 1.8s ease-in-out infinite}@keyframes d{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}` +
    `@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0ff"/><stop offset="1" stop-color="#1e7fe0"/></linearGradient>` +
    `<clipPath id="c"><path d="${pill}"/></clipPath></defs>` +
    `<g class="b">` +
    `<path d="${pill}" transform="translate(0 4)" fill="#0f4f8f"/>` +
    `<path d="${pill}" fill="url(#bg)" stroke="${ol}" stroke-width="5"/>` +
    `<g clip-path="url(#c)"><rect x="40" y="14" width="${W - 80}" height="20" rx="10" fill="#fff" opacity=".28"/>` +
    `<g class="s"><path d="M0 96L40 0H70L30 96Z" fill="#fff" opacity=".3"/></g></g>` +
    `<g class="d"><g transform="translate(56 50)"><path d="M0 -26Q16 -6 16 6A16 16 0 0 1 -16 6Q-16 -6 0 -26Z" fill="#e8f7ff" stroke="${ol}" stroke-width="4"/>` +
    `<path d="M-7 4Q-7 12 0 14" stroke="#7cc8f7" stroke-width="3.5" fill="none" stroke-linecap="round"/></g></g>` +
    label(text, { x: 96 + tw / 2, y: 59, size, fill: '#fff6df', outline: ol }) +
    `</g></svg>`
  );
}
