// The hero image: the garden bed in front of the pink wall from the GIF,
// with the car plant, the sign, the watering can and the garage.

import { carSvg, designFor } from './cars.mjs';
import { label, measure } from './font.mjs';
import { plantSvg, STAGES, stageOf } from './plant.mjs';
import { clamp, daysBetween, esc, mix, n, rng } from './util.mjs';

export const W = 1200;
export const H = 540;

export const DAY = {
  skyTop: '#79c7f6', skyBottom: '#cdeeff', sun: '#ffd84d', sunRay: '#ffbf2e', cheek: '#ff9e7a', cloud: '#ffffff',
  wall: '#f59bc3', wallSpeck: '#e47fae', wallLight: '#fbbcd8', cap: '#e47aab', capLight: '#f9b6d4',
  frame: '#cf6598', interior: '#f3dfb6', interiorShade: '#dcc08b', floor: '#d6bb88', shelf: '#b98a52',
  stone: '#9273c6', stoneLight: '#ad90dc', mortar: '#5e4694',
  trim: '#3fc79c', trimLight: '#79e0bd', trimDark: '#249b76',
  soil: '#a5693a', soilDark: '#7f4b25', soilLight: '#bd8250', grass: '#72d46c', grassDark: '#3f9f45',
  stem: '#4cae49', stemLight: '#8ed97c', leaf: '#61c657', leafDark: '#3a9a3a', leafLight: '#a5e894',
  wood: '#d99c58', woodDark: '#a96b33', grain: '#bd7f41', nail: '#6b4524', paint: '#fff6df', ink: '#3a2412',
  water: '#4fc3f7', waterDark: '#1e88e5', waterLight: '#c4ecff', can: '#a7bccc', canDark: '#7590a5', canLight: '#dde9f1',
  meterBg: '#5b3a20', tag: '#fbfbf4', outline: '#2b1a20',
  snailShell: '#e9894a', snailShellDark: '#b85f2a', snailBody: '#f3d3a6',
};

export const NIGHT = {
  ...DAY,
  skyTop: '#0a0f2c', skyBottom: '#2c2566', moon: '#fff1c4', moonDark: '#e3cf8f', star: '#fff8dc',
  wall: '#93557f', wallSpeck: '#7f4670', wallLight: '#a7678f', cap: '#7a406d', capLight: '#a86a95',
  frame: '#6f3a63', interior: '#e2c38f', interiorShade: '#b8935c', floor: '#c2a26c', shelf: '#8a6237',
  stone: '#4e4086', stoneLight: '#6556a3', mortar: '#2a2052',
  trim: '#1f8b6c', trimLight: '#3fb08c', trimDark: '#146a52',
  soil: '#6c4223', soilDark: '#4f2f18', soilLight: '#83532e', grass: '#3f9a4a', grassDark: '#296f34',
  stem: '#3b9844', stemLight: '#67bf69', leaf: '#46a84b', leafDark: '#2b7c33', leafLight: '#7ccc76',
  wood: '#a8743f', woodDark: '#7d4f27', grain: '#8f5f2f', nail: '#3e2814', paint: '#fff0cf', ink: '#2a190c',
  water: '#5cc8ff', waterDark: '#1e7fd6', waterLight: '#bfe9ff', can: '#8297a8', canDark: '#5c7285', canLight: '#b7c8d4',
  meterBg: '#3e2613', tag: '#e9e6d6', outline: '#150c16',
  snailShell: '#c4733f', snailShellDark: '#8e4d22', snailBody: '#d6b78c',
  glow: '#ffcf73', firefly: '#e8ff7a',
};

const PLANT_X = 400;
const PLANT_Y = 456;
const CAN_X = 214;
const CAN_Y = 470;
const SIGN_X = 702;

const CSS = `
.sway{animation:sway 5.5s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes sway{from{transform:rotate(-1.7deg)}to{transform:rotate(1.7deg)}}
.lf{animation:lf 4.6s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes lf{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}
.bob{animation:bob 2.4s ease-in-out infinite alternate}
@keyframes bob{from{transform:translate(0,0)}to{transform:translate(0,-2px)}}
.spk{animation:spk 2.2s ease-in-out infinite;transform-origin:0 0;opacity:0}
@keyframes spk{0%,100%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1) rotate(45deg)}}
.ripe{animation:ripe 1.6s ease-in-out infinite alternate}
@keyframes ripe{from{opacity:.45}to{opacity:1}}
.drift{animation:drift linear infinite}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(1560px)}}
.spin{animation:spin 50s linear infinite;transform-origin:0 0}
@keyframes spin{to{transform:rotate(360deg)}}
.can{animation:can 11s ease-in-out infinite;transform-origin:0 0}
@keyframes can{0%,14%{transform:translate(0,0) rotate(0deg)}27%{transform:translate(98px,-118px) rotate(0deg)}33%,61%{transform:translate(98px,-118px) rotate(35deg)}67%{transform:translate(98px,-118px) rotate(0deg)}80%,100%{transform:translate(0,0) rotate(0deg)}}
.drop{animation:drop 11s linear infinite both;opacity:0}
@keyframes drop{0%{transform:translate(0,0);opacity:0}.6%{opacity:1}6%{transform:translate(0,104px);opacity:1}6.4%,100%{transform:translate(0,104px);opacity:0}}
.splash{animation:splash 11s ease-out infinite both;transform-origin:0 0;opacity:0}
@keyframes splash{0%{transform:scale(.2);opacity:0}1%{opacity:.9}7%{transform:scale(1.4);opacity:0}100%{opacity:0}}
.snail{animation:snail 210s linear infinite;animation-delay:-80s}
@keyframes snail{from{transform:translateX(-80px)}to{transform:translateX(1290px)}}
.squish{animation:squish 2.4s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes squish{from{transform:scaleX(1)}to{transform:scaleX(1.07)}}
.fill{animation:fill 1.6s cubic-bezier(.2,.8,.2,1) .4s both;transform-origin:0 0}
@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.shine{animation:shine 3.2s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(-60px)}60%,100%{transform:translateX(260px)}}
.swing{animation:swing 3.8s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes swing{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}
.blink{animation:blink 1s steps(2,jump-none) infinite}
@keyframes blink{50%{opacity:.25}}
.tw{animation:tw ease-in-out infinite alternate}
@keyframes tw{from{opacity:.25}to{opacity:1}}
.fly{animation:fly ease-in-out infinite alternate}
@keyframes fly{0%{transform:translate(0,0)}33%{transform:translate(18px,-14px)}66%{transform:translate(-12px,-24px)}100%{transform:translate(10px,8px)}}
.glowp{animation:glowp ease-in-out infinite alternate}
@keyframes glowp{from{opacity:.15}to{opacity:1}}
.flap{animation:flap .22s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes flap{from{transform:scaleX(1)}to{transform:scaleX(.25)}}
.bfly{animation:bfly 17s ease-in-out infinite}
@keyframes bfly{0%,100%{transform:translate(0,0)}20%{transform:translate(120px,-60px)}40%{transform:translate(220px,10px)}60%{transform:translate(90px,-110px)}80%{transform:translate(-40px,-40px)}}
.zz{animation:zz 4.5s ease-out infinite;opacity:0}
@keyframes zz{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(26px,-40px);opacity:0}}
.shoot{animation:shoot 13s linear infinite;opacity:0}
@keyframes shoot{0%,88%{transform:translate(0,0);opacity:0}89%{opacity:1}95%{transform:translate(-260px,90px);opacity:0}100%{opacity:0}}
.confetti{animation:confetti 3.6s cubic-bezier(.25,.6,.4,1) both;opacity:0;transform-box:fill-box;transform-origin:center}
@keyframes confetti{0%{transform:translate(0,0) rotate(0);opacity:1}90%{opacity:1}100%{transform:translate(var(--dx),560px) rotate(var(--rot));opacity:0}}
.wspin{animation:spin .6s linear infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;

export function renderScene(state, { mode = 'day', now = new Date() } = {}) {
  const night = mode === 'night';
  const P = night ? NIGHT : DAY;
  const crop = state.crop;
  const g = clamp(crop.water / crop.goal);
  const design = designFor(crop.number);
  const stage = stageOf(g);
  const day = daysBetween(state.plantedOn, now);
  const last = state.harvests[state.harvests.length - 1];
  const fresh = last && now - Date.parse(last.at) < 48 * 3600e3;

  const title = `Crop #${crop.number}: a ${design.name} growing out of the ground. Stage ${stage}/5, ${STAGES[stage].toLowerCase()}, ${crop.water} of ${crop.goal} drops.`;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t">`,
    `<title id="t">${esc(title)}</title>`,
    `<style>${CSS.replace(/\n/g, '')}</style>`,
    defs(P),
    sky(P, night),
    wall(P),
    garage(P, state, { night, fresh }),
    stones(P),
    trim(P),
    snail(P),
    soil(P),
    `<g transform="translate(${PLANT_X} ${PLANT_Y})">${g < 0.05 ? mound(P) + plantSvg({ g, design, P, night }) : plantSvg({ g, design, P, night }) + mound(P)}</g>`,
    plantTag(P, crop, design),
    sign(P, { crop, g, day }),
    can(P),
    night ? fireflies(P) : butterflies(P),
    foreground(P),
    night ? `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` : '',
    fresh ? confetti(last.number) : '',
    '</svg>',
  ];
  return parts.join('');
}

function defs(P) {
  return (
    `<defs>` +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.skyTop}"/><stop offset="1" stop-color="${P.skyBottom}"/></linearGradient>` +
    `<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.waterLight}"/><stop offset=".45" stop-color="${P.water}"/><stop offset="1" stop-color="${P.waterDark}"/></linearGradient>` +
    `<linearGradient id="gshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.interiorShade}"/><stop offset=".55" stop-color="${P.interior}" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="ripeGlow"><stop offset="0" stop-color="#fff6a8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6a8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="lamp"><stop offset="0" stop-color="${P.glow ?? '#ffcf73'}" stop-opacity=".55"/><stop offset="1" stop-color="${P.glow ?? '#ffcf73'}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ff"><stop offset="0" stop-color="${P.firefly ?? '#e8ff7a'}" stop-opacity=".8"/><stop offset="1" stop-color="${P.firefly ?? '#e8ff7a'}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="vignette" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>` +
    `</defs>`
  );
}

// ---------------------------------------------------------------- sky
function sky(P, night) {
  let s = `<rect width="${W}" height="140" fill="url(#sky)"/>`;
  if (!night) {
    s += cloud(P, 90, 40, 1, 150, -75);
    s += cloud(P, 40, 70, 0.75, 190, -128);
    s += cloud(P, 200, 30, 0.6, 230, -40);
    s += sun(P);
    return s;
  }
  const r = rng('stars');
  for (let i = 0; i < 46; i++) {
    const x = r.range(0, W);
    const y = r.range(8, 112);
    if (x < 190 && y < 130) continue;
    const big = r() < 0.18;
    const d = n(r.range(1.6, 4.2));
    const dl = n(-r.range(0, 4));
    s += big
      ? `<path class="tw" style="animation-duration:${d}s;animation-delay:${dl}s" transform="translate(${n(x)} ${n(y)})" d="M0 -4Q.6 -.6 4 0Q.6 .6 0 4Q-.6 .6 -4 0Q-.6 -.6 0 -4Z" fill="${P.star}"/>`
      : `<circle class="tw" style="animation-duration:${d}s;animation-delay:${dl}s" cx="${n(x)}" cy="${n(y)}" r="${n(r.range(0.8, 1.8))}" fill="${P.star}"/>`;
  }
  s += `<g transform="translate(980 26)"><path class="shoot" d="M0 0L46 -14" stroke="${P.star}" stroke-width="2.5" stroke-linecap="round"/></g>`;
  s += moon(P);
  return s;
}

function sun(P) {
  const ol = P.outline;
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    rays += `M${n(c * 54)} ${n(s * 54)}L${n(c * 70)} ${n(s * 70)}`;
  }
  return (
    `<g transform="translate(98 70)">` +
    `<g class="spin"><path d="${rays}" stroke="${ol}" stroke-width="10" stroke-linecap="round"/><path d="${rays}" stroke="${P.sunRay}" stroke-width="5" stroke-linecap="round"/></g>` +
    `<circle r="42" fill="${P.sun}" stroke="${ol}" stroke-width="4"/>` +
    `<circle cx="-24" cy="14" r="7" fill="${P.cheek}" opacity=".55"/><circle cx="24" cy="14" r="7" fill="${P.cheek}" opacity=".55"/>` +
    // Shades on, obviously.
    `<path d="M-33 -10L-5 -10Q-3 -10 -3.6 -6Q-5 5 -17 5Q-29 5 -32.4 -6Q-33 -10 -33 -10ZM3 -10L31 -10Q33 -10 32.4 -6Q31 5 19 5Q7 5 3.6 -6Q3 -10 3 -10Z" fill="#1d1d24" stroke="${ol}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M-5 -7Q0 -10 5 -7M-33 -9L-41 -13M33 -9L41 -13" stroke="${ol}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path d="M-27 -6L-21 -6M9 -6L15 -6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M-12 20Q3 27 16 15" stroke="${ol}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
    `</g>`
  );
}

function moon(P) {
  const ol = P.outline;
  return (
    `<g transform="translate(102 68)">` +
    `<circle r="62" fill="${P.moon}" opacity=".12"/><circle r="46" fill="${P.moon}" opacity=".14"/>` +
    `<circle r="34" fill="${P.moon}" stroke="${ol}" stroke-width="4"/>` +
    `<circle cx="-13" cy="-12" r="6" fill="${P.moonDark}"/><circle cx="14" cy="10" r="4" fill="${P.moonDark}"/><circle cx="-4" cy="17" r="3" fill="${P.moonDark}"/>` +
    // Fast asleep: it has been waiting for 1000+ days too.
    `<path d="M-17 -1Q-11 4 -5 -1M5 -1Q11 4 17 -1M-6 11Q0 15 6 11" stroke="${ol}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    [0, 1.5, 3]
      .map((dl, i) => `<g transform="translate(${28 + i * 6} ${-30 - i * 6})"><g class="zz" style="animation-delay:${dl}s">${label('Z', { x: 0, y: 0, size: 9 + i * 3, fill: P.star, outline: ol, halo: 0.2 })}</g></g>`)
      .join('') +
    `</g>`
  );
}

function cloud(P, x, y, s, dur, delay) {
  const blobs = [[-40, 8, 22], [-14, -6, 28], [16, -2, 26], [42, 10, 18], [0, 12, 24], [-26, 14, 18], [28, 14, 18]];
  const out = blobs.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}"/>`).join('');
  const fill = blobs.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('');
  return (
    `<g class="drift" style="animation-duration:${dur}s;animation-delay:${delay}s"><g transform="translate(${x - 280} ${y}) scale(${s})">` +
    `<g fill="${P.outline}">${out}</g><g fill="${P.cloud}">${fill}</g>` +
    `<path d="M-30 4Q-20 -8 -6 -10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/></g></g>`
  );
}

// ---------------------------------------------------------------- wall
function wall(P) {
  const ol = P.outline;
  let s = `<rect y="120" width="${W}" height="280" fill="${P.wall}"/>`;
  const r = rng('wall');
  let specks = '';
  let lights = '';
  for (let i = 0; i < 320; i++) {
    const x = r.range(0, W);
    const y = r.range(142, 328);
    if (x > 860 && x < 1160 && y > 180) continue;
    const c = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r.range(0.8, 2.6))}"/>`;
    if (r() < 0.7) specks += c;
    else lights += c;
  }
  s += `<g fill="${P.wallSpeck}" opacity=".7">${specks}</g><g fill="${P.wallLight}" opacity=".8">${lights}</g>`;
  // Coping along the top of the wall.
  s += `<rect y="138" width="${W}" height="9" fill="${P.wallSpeck}" opacity=".6"/>`;
  s += `<rect y="120" width="${W}" height="20" fill="${P.cap}" stroke="${ol}" stroke-width="4"/>`;
  s += `<path d="M0 125H${W}" stroke="${P.capLight}" stroke-width="3"/>`;
  return s;
}

function garage(P, state, { night, fresh }) {
  const ol = P.outline;
  const [x0, y0, x1, y1] = [872, 196, 1148, 392];
  const [ix0, iy0, ix1] = [886, 210, 1134];
  const last = state.harvests[state.harvests.length - 1];
  let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${P.frame}" stroke="${ol}" stroke-width="4"/>`;
  s += `<rect x="${ix0}" y="${iy0}" width="${ix1 - ix0}" height="${y1 - iy0}" fill="${P.interior}" stroke="${ol}" stroke-width="3"/>`;
  s += `<rect x="${ix0 + 1.5}" y="${iy0 + 1.5}" width="${ix1 - ix0 - 3}" height="120" fill="url(#gshade)"/>`;
  // Shelf with paint cans, a spare tire, the floor.
  s += `<rect x="900" y="252" width="96" height="7" fill="${P.shelf}" stroke="${ol}" stroke-width="2.5"/>`;
  for (const [cx, c] of [[912, '#e8322e'], [934, '#2f80ed'], [956, '#ffd23f'], [976, '#8bd346']]) {
    s += `<rect x="${cx - 8}" y="236" width="16" height="16" rx="2" fill="${c}" stroke="${ol}" stroke-width="2.2"/><path d="M${cx - 8} 240H${cx + 8}" stroke="${ol}" stroke-width="1.6"/>`;
  }
  s += `<circle cx="1100" cy="250" r="20" fill="none" stroke="${ol}" stroke-width="13"/><circle cx="1100" cy="250" r="20" fill="none" stroke="#33333b" stroke-width="9"/>`;
  s += `<rect x="${ix0 + 1.5}" y="366" width="${ix1 - ix0 - 3}" height="24" fill="${P.floor}"/><path d="M${ix0} 366H${ix1}" stroke="${ol}" stroke-width="2" opacity=".5"/>`;
  // Plaque over the door.
  s += `<rect x="944" y="160" width="132" height="28" rx="4" fill="${P.paint}" stroke="${ol}" stroke-width="3"/>`;
  s += label(`GARAGE: ${state.harvests.length}`, { x: 1010, y: 180, size: 12, fill: P.ink, outline: P.paint, halo: 0 });

  if (last) {
    const d = designFor(last.number);
    s += `<g transform="translate(913 312) scale(1.95)">${carSvg(d, { night, uid: 'parked', outline: ol })}</g>`;
    s += label(`#${last.number} @${last.by}`.toUpperCase().slice(0, 22), { x: 1010, y: 298, size: 11, fill: P.ink, outline: P.interior, halo: 0 });
  } else {
    s += label('RESERVED', { x: 1012, y: 320, size: 20, fill: '#d64545', outline: P.interior, halo: 0, weight: 0.24 });
    s += label(`FOR CROP #${state.crop.number}`, { x: 1012, y: 344, size: 11, fill: P.ink, outline: P.interior, halo: 0 });
    s += `<path d="M916 384L940 370M1080 384L1104 370" stroke="#e0b43a" stroke-width="5" stroke-linecap="round"/>`;
  }

  if (night) {
    // A bare bulb, and the light it throws out onto the bed.
    s += `<ellipse cx="1010" cy="330" rx="260" ry="190" fill="url(#lamp)"/>`;
    s += `<path d="M1010 210V226" stroke="${ol}" stroke-width="2"/><circle cx="1010" cy="232" r="7" fill="#fff3c4" stroke="${ol}" stroke-width="2"/>`;
  }
  return s;
}

function stones(P) {
  const ol = P.outline;
  const r = rng('stones');
  let s = `<rect y="326" width="872" height="64" fill="${P.mortar}"/>`;
  for (const [y, off] of [[328, 0], [359, -34]]) {
    let x = off;
    while (x < 872) {
      const w = r.range(54, 96);
      const ww = Math.min(w, 870 - x);
      if (ww > 14) {
        const xx = Math.max(x, 2);
        const wr = ww - (xx - x);
        s += `<rect x="${n(xx)}" y="${y}" width="${n(wr - 4)}" height="28" rx="11" fill="${mix(P.stone, P.stoneLight, r() * 0.35)}" stroke="${ol}" stroke-width="3"/>`;
        s += `<path d="M${n(xx + 9)} ${y + 8}Q${n(xx + 12)} ${y + 4} ${n(xx + 22)} ${y + 4}" stroke="${P.stoneLight}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>`;
      }
      x += w;
    }
  }
  return s;
}

function trim(P) {
  const ol = P.outline;
  return (
    `<rect y="388" width="${W}" height="16" fill="${P.trim}" stroke="${ol}" stroke-width="3.5"/>` +
    `<path d="M0 392H${W}" stroke="${P.trimLight}" stroke-width="2.5"/>`
  );
}

function snail(P) {
  const ol = P.outline;
  return (
    `<g class="snail"><g transform="translate(0 388)"><g class="squish">` +
    `<path d="M-18 0Q-20 -8 -10 -8L14 -8Q22 -9 24 -18Q26 -22 28 -17Q29 -6 22 0Z" fill="${P.snailBody}" stroke="${ol}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M22 -16L24 -27M26 -17L31 -26" stroke="${ol}" stroke-width="2"/><circle cx="24" cy="-28" r="2.2" fill="${ol}"/><circle cx="31.4" cy="-27" r="2.2" fill="${ol}"/>` +
    `<circle cx="0" cy="-17" r="14" fill="${P.snailShell}" stroke="${ol}" stroke-width="2.8"/>` +
    `<path d="M0 -17m-3 0a3 3 0 1 1 6 0a6 6 0 1 1 -12 0a9.5 9.5 0 1 1 19 0" fill="none" stroke="${P.snailShellDark}" stroke-width="2.2" stroke-linecap="round"/>` +
    `</g></g></g>`
  );
}

function soil(P) {
  const ol = P.outline;
  let top = 'M0 405';
  for (let x = 0; x < W; x += 100) top += `Q${x + 50} ${x % 200 ? 409 : 400} ${x + 100} 405`;
  let s = `<path d="${top}V${H}H0Z" fill="${P.soil}"/><path d="${top}" stroke="${ol}" stroke-width="4" fill="none"/>`;
  const r = rng('soil');
  let dark = '';
  let light = '';
  for (let i = 0; i < 120; i++) {
    const e = `<ellipse cx="${n(r.range(0, W))}" cy="${n(r.range(418, 536))}" rx="${n(r.range(3, 10))}" ry="${n(r.range(1.6, 4))}"/>`;
    if (r() < 0.6) dark += e;
    else light += e;
  }
  s += `<g fill="${P.soilDark}" opacity=".55">${dark}</g><g fill="${P.soilLight}" opacity=".55">${light}</g>`;
  s += `<path d="M0 470Q300 458 600 468T1200 464M0 506Q300 496 600 506T1200 500" stroke="${P.soilDark}" stroke-width="2.5" fill="none" opacity=".45"/>`;
  for (let i = 0; i < 16; i++) s += tuft(P, r.range(10, W - 10), 406 + r.range(0, 4), r.range(0.7, 1.1));
  return s;
}

function tuft(P, x, y, s) {
  return (
    `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">` +
    `<path d="M-9 0Q-10 -10 -14 -16Q-6 -10 -3 0ZM-3 0Q-2 -16 1 -22Q3 -12 3 0ZM2 0Q6 -10 13 -14Q9 -6 8 0Z" fill="${P.grass}" stroke="${P.outline}" stroke-width="2.2" stroke-linejoin="round"/></g>`
  );
}

function mound(P) {
  const ol = P.outline;
  return (
    `<path d="M-62 6Q-50 -14 0 -15Q50 -14 62 6Z" fill="${P.soilDark}" stroke="${ol}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<ellipse cx="-30" cy="-4" rx="7" ry="3" fill="${P.soilLight}" opacity=".7"/><ellipse cx="22" cy="-6" rx="5" ry="2.4" fill="${P.soilLight}" opacity=".7"/><ellipse cx="38" cy="0" rx="6" ry="2.6" fill="${P.soil}"/>`
  );
}

function plantTag(P, crop, design) {
  const ol = P.outline;
  const l1 = `CROP #${crop.number}`;
  const l2 = design.name.toUpperCase();
  const w = Math.max(measure(l1, 11), measure(l2, 9)) + 22;
  return (
    `<g transform="translate(486 492) rotate(-7)">` +
    `<path d="M-4 0V22H4V0Z" fill="${P.tag}" stroke="${ol}" stroke-width="2.5"/>` +
    `<rect x="${n(-w / 2)}" y="-44" width="${n(w)}" height="44" rx="6" fill="${P.tag}" stroke="${ol}" stroke-width="3"/>` +
    label(l1, { x: 0, y: -26, size: 11, fill: P.ink, outline: P.tag, halo: 0 }) +
    label(l2, { x: 0, y: -10, size: 9, fill: '#3a9a3a', outline: P.tag, halo: 0 }) +
    `</g>`
  );
}

function sign(P, { crop, g, day }) {
  const ol = P.outline;
  const text = 'JUST WAIT.';
  const size = 27;
  const tw = measure(text, size);
  const bw = tw + 54;
  const bh = 74;
  const ripe = crop.water >= crop.goal - 1;
  let s = '';
  // Post.
  s += `<rect x="${SIGN_X - 10}" y="240" width="20" height="252" fill="${P.woodDark}" stroke="${ol}" stroke-width="3.5"/>`;
  s += `<path d="M${SIGN_X - 30} 494Q${SIGN_X} 478 ${SIGN_X + 30} 494Z" fill="${P.soilDark}" stroke="${ol}" stroke-width="3"/>`;
  // Main board.
  s +=
    `<g transform="translate(${SIGN_X} 266) rotate(-2.5)">` +
    `<path d="M${n(-bw / 2)} ${-bh / 2 + 3}L${n(bw / 2)} ${-bh / 2}L${n(bw / 2 + 3)} ${bh / 2}L${n(-bw / 2 + 2)} ${bh / 2 + 3}Z" fill="${P.wood}" stroke="${ol}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M${n(-bw / 2 + 14)} -18Q-40 -24 20 -17T${n(bw / 2 - 16)} -20M${n(-bw / 2 + 24)} 22Q-10 16 40 23T${n(bw / 2 - 30)} 20" stroke="${P.grain}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    [[-bw / 2 + 10, -bh / 2 + 11], [bw / 2 - 10, -bh / 2 + 9], [-bw / 2 + 11, bh / 2 - 8], [bw / 2 - 9, bh / 2 - 10]]
      .map(([x, y]) => `<circle cx="${n(x)}" cy="${n(y)}" r="3" fill="${P.nail}"/>`)
      .join('') +
    label(text, { x: 0, y: 13, size, fill: P.paint, outline: ol }) +
    `</g>`;

  // Water meter.
  const barW = 172;
  const fillW = Math.max(0, barW * g);
  s +=
    `<g transform="translate(${SIGN_X} 344) rotate(1.6)">` +
    `<path d="M-120 -30L118 -32L120 30L-118 31Z" fill="${P.wood}" stroke="${ol}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M-100 -16Q-108 -4 -108 2A8 8 0 0 0 -92 2Q-92 -4 -100 -16Z" fill="url(#water)" stroke="${ol}" stroke-width="2.5"/>` +
    `<rect x="-82" y="-15" width="${barW}" height="18" rx="9" fill="${P.meterBg}" stroke="${ol}" stroke-width="3"/>` +
    (fillW > 1
      ? `<clipPath id="bar"><rect x="-80.5" y="-13.5" width="${n(fillW - 3)}" height="15" rx="7.5"/></clipPath>` +
        `<g clip-path="url(#bar)"><g transform="translate(-80.5 -13.5)"><g class="fill"><rect width="${n(barW)}" height="15" fill="url(#water)"/></g>` +
        `<g class="shine"><path d="M0 15L14 0H24L10 15Z" fill="#fff" opacity=".45"/></g></g></g>`
      : '') +
    label(`CROP #${crop.number}`, { x: -88, y: 22, size: 10, fill: P.ink, outline: P.wood, halo: 0, anchor: 'start' }) +
    (ripe
      ? label('RIPE! 1 DROP TO GO', { x: 94, y: 22, size: 10, fill: '#c62828', outline: P.wood, halo: 0, anchor: 'end', cls: 'blink' })
      : label(`${crop.water}/${crop.goal}`, { x: 94, y: 22, size: 10, fill: P.ink, outline: P.wood, halo: 0, anchor: 'end' })) +
    `</g>`;

  // Day counter, swinging under the meter.
  const dayText = `DAY ${day.toLocaleString('en-US')}`;
  const dw = measure(dayText, 12) + 20;
  s +=
    `<g transform="translate(${SIGN_X + 58} 373)"><g class="swing">` +
    `<path d="M-14 0L${n(-dw / 2 + 8)} 20M14 0L${n(dw / 2 - 8)} 20" stroke="${ol}" stroke-width="1.8"/>` +
    `<rect x="${n(-dw / 2)}" y="18" width="${n(dw)}" height="30" rx="5" fill="${P.tag}" stroke="${ol}" stroke-width="3"/>` +
    label(dayText, { x: 0, y: 39, size: 12, fill: P.ink, outline: P.tag, halo: 0 }) +
    `</g></g>`;
  return s;
}

function can(P) {
  const ol = P.outline;
  // The spout tip ends up at (394, 344) while pouring; see the .can keyframes.
  const [sx, sy] = [394, 345];
  let drops = '';
  for (let i = 0; i < 8; i++) {
    const dl = n(3.63 + i * 0.4);
    drops += `<g transform="translate(${sx + (i % 3) * 4 - 4} ${sy})"><path class="drop" style="animation-delay:${dl}s" d="M0 -6Q4 0 4 2.5A4 4 0 0 1 -4 2.5Q-4 0 0 -6Z" fill="${P.water}" stroke="${ol}" stroke-width="1.5"/></g>`;
  }
  let splashes = '';
  for (let i = 0; i < 4; i++) {
    splashes += `<g transform="translate(${sx} 451)"><ellipse class="splash" style="animation-delay:${n(4.3 + i * 0.75)}s" rx="14" ry="4" fill="none" stroke="${P.waterLight}" stroke-width="2.5"/></g>`;
  }
  return (
    drops +
    splashes +
    `<g transform="translate(${CAN_X} ${CAN_Y})"><g class="can">` +
    `<path d="M-30 -48Q-2 -82 26 -48" stroke="${ol}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M-30 -48Q-2 -82 26 -48" stroke="${P.canDark}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M22 -20L54 -48L60 -44L28 -8Z" fill="${P.can}" stroke="${ol}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M51 -55L63 -41L67 -46Q61 -56 55 -59Z" fill="${P.canDark}" stroke="${ol}" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<path d="M-30 0L-27 -48H27L30 0Z" fill="${P.can}" stroke="${ol}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="M-27 -40H27" stroke="${P.canDark}" stroke-width="3"/><path d="M-18 -34V-6" stroke="${P.canLight}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M4 -30Q10 -21 10 -17A6 6 0 0 1 -2 -17Q-2 -21 4 -30Z" fill="${P.water}" stroke="${ol}" stroke-width="2"/>` +
    `</g></g>`
  );
}

function butterflies(P) {
  const ol = P.outline;
  const fly = (x, y, c, dur, delay) =>
    `<g transform="translate(${x} ${y})"><g class="bfly" style="animation-duration:${dur}s;animation-delay:${delay}s">` +
    `<g class="flap"><path d="M0 0Q-14 -16 -18 -6Q-20 4 0 2ZM0 2Q-12 10 -10 15Q-4 16 0 4Z" fill="${c}" stroke="${ol}" stroke-width="2"/></g>` +
    `<g class="flap" style="animation-direction:alternate-reverse"><path d="M0 0Q14 -16 18 -6Q20 4 0 2ZM0 2Q12 10 10 15Q4 16 0 4Z" fill="${c}" stroke="${ol}" stroke-width="2"/></g>` +
    `<path d="M0 -4V8" stroke="${ol}" stroke-width="3" stroke-linecap="round"/></g></g>`;
  return fly(250, 250, '#ffb347', 17, -3) + fly(560, 200, '#7ad7ff', 21, -11);
}

function fireflies(P) {
  const r = rng('fireflies');
  let s = '';
  for (let i = 0; i < 14; i++) {
    const x = r.range(40, 1160);
    const y = r.range(180, 520);
    const d = n(r.range(5, 9));
    const b = n(r.range(1.4, 3));
    s +=
      `<g transform="translate(${n(x)} ${n(y)})"><g class="fly" style="animation-duration:${d}s;animation-delay:${n(-r.range(0, 9))}s">` +
      `<g class="glowp" style="animation-duration:${b}s;animation-delay:${n(-r.range(0, 3))}s"><circle r="12" fill="url(#ff)"/><circle r="2.4" fill="${P.firefly}"/></g></g></g>`;
  }
  return s;
}

function foreground(P) {
  return tuft(P, 70, 540, 1.5) + tuft(P, 560, 542, 1.3) + tuft(P, 1110, 540, 1.6) + tuft(P, 900, 541, 1.1);
}

function confetti(seed) {
  const r = rng(`confetti-${seed}`);
  const colors = ['#e8322e', '#ffd23f', '#2f80ed', '#8bd346', '#ff6fb5', '#ffffff'];
  let s = '';
  for (let i = 0; i < 48; i++) {
    const x = r.range(250, 1150);
    s += `<rect class="confetti" style="--dx:${n(r.range(-80, 80))}px;--rot:${n(r.range(-720, 720))}deg;animation-delay:${n(r.range(0, 1.2))}s" x="${n(x)}" y="${n(r.range(-60, -10))}" width="${n(r.range(6, 11))}" height="${n(r.range(4, 7))}" fill="${r.pick(colors)}"/>`;
  }
  return s;
}
