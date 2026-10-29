#!/usr/bin/env node
// The car garden on my GitHub profile.
//
//   node scripts/garden.mjs render    redraw every image and README.md from garden/state.json
//   node scripts/garden.mjs water     (Actions) count open "Water the car" issues
//   node scripts/garden.mjs reply     (Actions) answer and close them, after the push
//   node scripts/garden.mjs daily     (Actions) add yesterday's contributions
//   node scripts/garden.mjs preview   local gallery of every stage in preview/

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderButton } from './lib/button.mjs';
import { carMesh, designFor } from './lib/cars.mjs';
import { OWNER, REPO, newState, ownerWater, visitorWater } from './lib/farm.mjs';
import { renderGarage } from './lib/garage.mjs';
import { contributions, replyAndClose, wateringIssues } from './lib/github.mjs';
import { STAGES, stageOf } from './lib/plant.mjs';
import { renderReadme } from './lib/readme.mjs';
import { renderScene } from './lib/scene.mjs';
import { toStl } from './lib/stl.mjs';
import { daysBetween, rng } from './lib/util.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE = path.join(ROOT, 'garden/state.json');
const OUTBOX = path.join(ROOT, 'garden/.outbox.json');
const COMMIT_MSG = path.join(ROOT, 'garden/.commit-message');
const PROFILE = `https://github.com/${OWNER}`;

const load = () => JSON.parse(fs.readFileSync(STATE, 'utf8'));
const save = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2) + '\n');
const write = (rel, content) => {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);

// Images get content-hashed names: GitHub's raw/main redirect drops query
// strings and its CDN caches each path for 5 minutes, so a new name is the
// only way a fresh drawing shows up right away.
function asset(name, content) {
  const hash = createHash('sha1').update(content).digest('hex').slice(0, 8);
  const file = `${name}.${hash}.svg`;
  const dir = path.join(ROOT, 'garden');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(`${name}.`) && f.endsWith('.svg') && f !== file) fs.rmSync(path.join(dir, f));
  }
  write(`garden/${file}`, content);
  return `garden/${file}`;
}

function render(state, now = new Date()) {
  const files = {
    sceneDay: asset('scene-day', renderScene(state, { mode: 'day', now })),
    sceneNight: asset('scene-night', renderScene(state, { mode: 'night', now })),
    garageDay: asset('garage-day', renderGarage(state, { mode: 'day' })),
    garageNight: asset('garage-night', renderGarage(state, { mode: 'night' })),
    button: asset('button', renderButton()),
  };
  const stl = toStl(carMesh(designFor(state.crop.number)), `crop${state.crop.number}`);
  write('README.md', renderReadme(state, { stl, now, files }));
}

const progress = (s) => `${s.crop.water}/${s.crop.goal}`;
const stageName = (s) => STAGES[stageOf(Math.min(1, s.crop.water / s.crop.goal))].toLowerCase();

const CHEERS = [
  'Just wait.',
  'The snail says thanks too.',
  'Somewhere, a toy car feels a little more real.',
  'Good things take time. Cars take water.',
  'It grew. Probably. Come back and check.',
];

async function water() {
  const token = process.env.GITHUB_TOKEN;
  const state = load();
  const issues = await wateringIssues(REPO, token);
  const outbox = [];
  const watered = [];
  let harvest = null;
  for (const issue of issues) {
    const who = issue.user.login;
    if (issue.user.type === 'Bot') {
      outbox.push({ issue: issue.number, body: 'Bots don’t get to water the car. 🤖' });
      continue;
    }
    const at = new Date().toISOString();
    const r = visitorWater(state, { who, at, issue: issue.number });
    let body;
    if (r.result === 'duplicate') body = 'Already counted. 💧';
    else if (r.result === 'cooldown') body = `🌱 Easy, @${who}: the soil is still wet from your last watering. Come back in about ${r.wait} h.`;
    else if (r.harvested) {
      harvest = r.harvested;
      body =
        `🎉 **@${who}, you gave the last drop!**\n\nCrop #${r.harvested.number} is harvested: a **${r.harvested.name}**, ` +
        `now parked in [the garage](${PROFILE}#-the-garage) with your name on the plate. A new seed is already in the ground.`;
      watered.push(who);
    } else if (r.drops === 0) {
      body = `🌱 It's ripe, @${who}, and the last drop is reserved for a visitor.`;
    } else {
      body = `💧 Thanks @${who}! +${r.drops} drops. Crop #${r.crop} is at **${progress(state)}** (${stageName(state)}). [Go see it](${PROFILE}).\n\n_${rng(issue.number).pick(CHEERS)}_`;
      watered.push(who);
    }
    outbox.push({ issue: issue.number, body });
  }
  if (!outbox.length) return console.log('No watering issues.');
  save(state);
  render(state);
  fs.writeFileSync(OUTBOX, JSON.stringify(outbox, null, 2));
  const msg = harvest
    ? `🎉 Crop #${harvest.number} harvested by @${harvest.by}`
    : watered.length
      ? `💧 ${watered.map((w) => `@${w}`).join(', ')} watered the car (${progress(state)})`
      : '🌱 Answer watering issues';
  fs.writeFileSync(COMMIT_MSG, msg);
  console.log(msg);
}

async function reply() {
  if (!fs.existsSync(OUTBOX)) return;
  const token = process.env.GITHUB_TOKEN;
  for (const { issue, body } of JSON.parse(fs.readFileSync(OUTBOX, 'utf8'))) {
    await replyAndClose(REPO, issue, body, token);
    console.log(`Replied to #${issue}`);
  }
  fs.rmSync(OUTBOX);
}

async function daily() {
  const state = load();
  const now = new Date();
  const yesterday = isoDay(now.getTime() - 864e5);
  let added = 0;
  if (state.contribCursor < yesterday) {
    const from = isoDay(Date.parse(state.contribCursor) + 864e5);
    const days = await contributions(OWNER, process.env.GITHUB_TOKEN, from, yesterday);
    for (const d of days) {
      if (d.date <= state.contribCursor || d.date > yesterday) continue;
      added += ownerWater(state, { date: d.date, contributions: d.count, at: now.toISOString() });
    }
    state.contribCursor = yesterday;
  }
  state.rev++;
  save(state);
  render(state, now);
  const msg = added ? `⌨️ Yesterday's commits watered the car (+${added}, ${progress(state)})` : `🌞 Day ${daysBetween(state.plantedOn, now).toLocaleString('en-US')}: the garden wakes up`;
  fs.writeFileSync(COMMIT_MSG, msg);
  console.log(msg);
}

function init() {
  if (fs.existsSync(STATE)) throw new Error('garden/state.json already exists');
  const [water = '0', cursor = isoDay(Date.now() - 864e5)] = process.argv.slice(3);
  const state = newState({ plantedOn: '2024-01-19', now: new Date(), water: Number(water), cursor });
  save(state);
  render(state);
  console.log(`Planted. Crop #1 at ${progress(state)}.`);
}

// A local gallery with every growth stage, both themes, and a full garage.
function preview() {
  const base = load();
  const now = new Date();
  const stages = [0.02, 0.12, 0.3, 0.46, 0.62, 0.78, 0.9, 0.99];
  const cells = [];
  for (const g of stages) {
    for (const mode of ['day', 'night']) {
      const s = structuredClone(base);
      s.crop.water = Math.round(g * s.crop.goal);
      const file = `preview/stage-${Math.round(g * 100)}-${mode}.svg`;
      write(file, renderScene(s, { mode, now }));
      cells.push({ file: path.basename(file), caption: `${Math.round(g * 100)}% · ${STAGES[stageOf(g)]} · ${mode}` });
    }
  }
  // Six future crops in bloom, to see the variety.
  const crops = [];
  for (let c = 2; c <= 7; c++) {
    const s = structuredClone(base);
    s.crop = { number: c, water: 90, goal: 100, plantedAt: now.toISOString() };
    write(`preview/crop-${c}.svg`, renderScene(s, { mode: 'day', now }));
    crops.push({ file: `crop-${c}.svg`, caption: `crop #${c}: ${designFor(c).name}` });
  }
  // A garage after a few harvests, and the moment right after one.
  const g = structuredClone(base);
  const names = ['octocat', 'torvalds', 'sindresorhus', 'gaearon', 'yyx990803', 'tj', 'mojombo'];
  g.harvests = names.map((by, i) => ({ number: i + 1, by, at: new Date(now - (names.length - i) * 864e5 * 9).toISOString(), name: designFor(i + 1).name }));
  g.crop = { number: names.length + 1, water: 12, goal: 250, plantedAt: now.toISOString() };
  write('preview/garage-day.svg', renderGarage(g, { mode: 'day' }));
  write('preview/garage-night.svg', renderGarage(g, { mode: 'night' }));
  g.harvests[g.harvests.length - 1].at = now.toISOString();
  write('preview/harvest-day.svg', renderScene(g, { mode: 'day', now }));
  write('preview/harvest-night.svg', renderScene(g, { mode: 'night', now }));
  const stl = toStl(carMesh(designFor(base.crop.number)));
  write('preview/crop.stl', stl);
  const fig = ({ file, caption }) => `<figure><img src="${file}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
  write(
    'preview/index.html',
    `<!doctype html><meta charset="utf-8"><title>Car garden preview</title>
<style>body{font:14px system-ui;margin:24px;background:#f6f8fa;color:#1f2328}h2{margin-top:32px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:16px}figure{margin:0}img{width:100%;border-radius:8px;display:block;box-shadow:0 1px 3px #0002}figcaption{padding:4px 2px;color:#59636e}</style>
<h1>Car garden preview</h1><p>Local only. <a href="readme.html">README as GitHub renders it</a></p>
<h2>Growth stages</h2><div class="grid">${cells.map(fig).join('')}</div>
<h2>Other crops in bloom</h2><div class="grid">${crops.map(fig).join('')}</div>
<h2>After 7 harvests</h2><div class="grid">${fig({ file: 'harvest-day.svg', caption: 'scene right after a harvest (confetti plays once per load)' })}${fig({ file: 'harvest-night.svg', caption: 'same, night' })}</div>
<div class="grid">${fig({ file: 'garage-day.svg', caption: 'garage, day' })}${fig({ file: 'garage-night.svg', caption: 'garage, night' })}</div>`,
  );
  console.log(`Wrote ${cells.length + crops.length + 4} images to preview/.`);
  readmePreview();
}

// README.md as GitHub renders it (through its Markdown API), in a page shaped
// like a profile. The STL block is drawn with three.js as a stand-in for
// GitHub's own viewer.
function readmePreview() {
  let body;
  try {
    // "markdown" mode renders like a README file (soft line breaks). It leaves
    // the stl block as highlighted code; on github.com it becomes a 3D viewer.
    body = execFileSync('gh', ['api', 'markdown', '-f', 'mode=markdown', '-F', 'text=@README.md'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16e6 });
  } catch {
    return console.log('Skipped preview/readme.html (needs the gh CLI).');
  }
  write(
    'preview/readme.html',
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile README preview</title>
<base href="../">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css">
<style>
body{margin:0;background:#fff;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;color:#1f2328}
.layout{display:flex;gap:24px;max-width:1280px;margin:24px auto;padding:0 32px;box-sizing:border-box}
.side{width:296px;flex:none}.avatar{width:296px;height:296px;border-radius:50%;background:#d0d7de}
.side h1{font-size:24px;margin:16px 0 0}.side p{color:#59636e;font-size:20px;font-weight:300;margin:0}
.main{flex:1;min-width:0}.card{border:1px solid #d0d7de;border-radius:6px;padding:24px}
.crumb{font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:16px;color:#59636e}
.stl3d{height:420px;border:1px solid #d0d7de;border-radius:6px;overflow:hidden;position:relative;margin-bottom:16px}
.stl3d canvas{display:block}
@media (prefers-color-scheme:dark){body{background:#0d1117;color:#f0f6fc}.card,.stl3d{border-color:#3d444d}.avatar{background:#3d444d}.side p,.crumb{color:#9198a1}}
@media (max-width:760px){.layout{display:block;padding:0 16px}.side{width:auto;margin-bottom:16px}.avatar{width:96px;height:96px}}
</style></head><body>
<div class="layout"><div class="side"><div class="avatar"></div><h1>Angelo Lamonaca</h1><p>angelolamonaca</p></div>
<div class="main"><div class="card"><div class="crumb">angelolamonaca / README.md</div><article class="markdown-body">${body}</article></div></div></div>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
for (const block of document.querySelectorAll('.highlight-source-stl')) {
  const text = block.querySelector('pre').textContent;
  const sec = document.createElement('div');
  sec.className = 'stl3d';
  block.replaceWith(sec);
  const w = sec.clientWidth, h = sec.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h); renderer.setPixelRatio(devicePixelRatio); sec.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const geo = new STLLoader().parse(text); geo.computeBoundingBox(); geo.center();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9aa4b1, flatShading: true, metalness: .1, roughness: .7 }));
  mesh.rotation.x = -Math.PI / 2; scene.add(mesh);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(60, 120, 80); scene.add(dl);
  const cam = new THREE.PerspectiveCamera(40, w / h, 1, 2000); cam.position.set(90, 60, 120);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.autoRotate = true; ctl.autoRotateSpeed = 1.5;
  window.stlView = (x, y, z) => { cam.position.set(x, y, z); cam.lookAt(0, 0, 0); ctl.update(); renderer.render(scene, cam); };
  (function loop() { ctl.update(); renderer.render(scene, cam); requestAnimationFrame(loop); })();
}
</script></body></html>`,
  );
  console.log('Wrote preview/readme.html.');
}

const commands = { render: () => render(load()), water, reply, daily, init, preview };
const cmd = process.argv[2];
if (!commands[cmd]) {
  console.error(`Usage: node scripts/garden.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}
await commands[cmd]();
