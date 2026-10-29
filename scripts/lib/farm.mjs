// The rules of the garden. Everything lives in garden/state.json.

import { designFor } from './cars.mjs';

export const OWNER = 'angelolamonaca';
export const REPO = `${OWNER}/${OWNER}`;

export const VISITOR_DROPS = 5; // one click from a visitor
export const OWNER_DAILY_CAP = 30; // my contributions count 1 drop each, up to this per day
export const COOLDOWN_HOURS = 20; // "once a day", with some slack for time zones
export const goalFor = (crop) => Math.min(300, 100 + 25 * (crop - 1));

const LOG_SIZE = 40;
const ISSUE_MEMORY = 400;

export function newState({ plantedOn, now, water = 0, cursor }) {
  return {
    version: 1,
    plantedOn,
    crop: { number: 1, water, goal: goalFor(1), plantedAt: `${plantedOn}T16:00:11Z` },
    harvests: [],
    gardeners: {},
    ownerDrops: water,
    log: [{ at: now.toISOString(), who: OWNER, kind: 'sprouted', drops: water }],
    lastWatered: {},
    processedIssues: [],
    contribCursor: cursor,
    rev: 1,
  };
}

function log(state, entry) {
  state.log.unshift(entry);
  state.log.length = Math.min(state.log.length, LOG_SIZE);
}

function harvest(state, by, at) {
  const { crop } = state;
  const record = { number: crop.number, by, at, name: designFor(crop.number).name, plantedAt: crop.plantedAt };
  state.harvests.push(record);
  const next = crop.number + 1;
  const overflow = crop.water - crop.goal;
  state.crop = { number: next, water: Math.max(0, overflow), goal: goalFor(next), plantedAt: at };
  log(state, { at, who: by, kind: 'harvest', crop: record.number, name: record.name });
  return record;
}

// A visitor's watering. Returns what happened, for the reply comment.
export function visitorWater(state, { who, at, issue }) {
  const now = Date.parse(at);
  if (issue && state.processedIssues.includes(issue)) return { result: 'duplicate' };
  const remember = () => {
    if (!issue) return;
    state.processedIssues.unshift(issue);
    state.processedIssues.length = Math.min(state.processedIssues.length, ISSUE_MEMORY);
  };
  const last = state.lastWatered[who];
  if (last && now - Date.parse(last) < COOLDOWN_HOURS * 3600e3) {
    remember();
    const wait = Math.ceil((Date.parse(last) + COOLDOWN_HOURS * 3600e3 - now) / 3600e3);
    return { result: 'cooldown', wait };
  }
  remember();
  state.lastWatered[who] = at;
  for (const [k, v] of Object.entries(state.lastWatered)) {
    if (now - Date.parse(v) > 2 * COOLDOWN_HOURS * 3600e3) delete state.lastWatered[k];
  }
  // When I water my own plant it counts like my commits: off the gardeners
  // wall, and never the last drop.
  const owner = who === OWNER;
  const crop = state.crop.number;
  const drops = owner ? Math.min(VISITOR_DROPS, Math.max(0, state.crop.goal - 1 - state.crop.water)) : VISITOR_DROPS;
  state.crop.water += drops;
  if (owner) state.ownerDrops += drops;
  else state.gardeners[who] = (state.gardeners[who] ?? 0) + drops;
  log(state, { at, who, kind: 'visitor', drops, issue });
  const harvested = !owner && state.crop.water >= state.crop.goal ? harvest(state, who, at) : null;
  state.rev++;
  return { result: 'watered', drops, crop, harvested };
}

// My own contributions water the plant too, but never the last drop:
// harvesting is always a visitor's moment.
export function ownerWater(state, { date, contributions, at }) {
  const room = Math.max(0, state.crop.goal - 1 - state.crop.water);
  const drops = Math.min(contributions, OWNER_DAILY_CAP, room);
  if (drops > 0) {
    state.crop.water += drops;
    state.ownerDrops += drops;
  }
  if (contributions > 0) log(state, { at, who: OWNER, kind: 'commits', date, contributions, drops });
  state.rev++;
  return drops;
}
