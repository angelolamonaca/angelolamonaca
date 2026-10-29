// A tiny path language shared by the 2D drawings and the 3D model:
//   ['M',x,y] ['L',x,y] ['Q',cx,cy,x,y] ['C',x1,y1,x2,y2,x,y]
//   ['A',cx,cy,r,a0,a1]  arc around a center, angles in degrees (screen space)
//   ['Z']

import { n } from './util.mjs';

const rad = (d) => (d * Math.PI) / 180;

export function svgPath(cmds) {
  let d = '';
  for (const c of cmds) {
    switch (c[0]) {
      case 'M':
      case 'L':
        d += `${c[0]}${n(c[1])} ${n(c[2])}`;
        break;
      case 'Q':
        d += `Q${n(c[1])} ${n(c[2])} ${n(c[3])} ${n(c[4])}`;
        break;
      case 'C':
        d += `C${n(c[1])} ${n(c[2])} ${n(c[3])} ${n(c[4])} ${n(c[5])} ${n(c[6])}`;
        break;
      case 'A': {
        const [, cx, cy, r, a0, a1] = c;
        const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
        const sweep = a1 > a0 ? 1 : 0;
        d += `A${n(r)} ${n(r)} 0 ${large} ${sweep} ${n(cx + r * Math.cos(rad(a1)))} ${n(cy + r * Math.sin(rad(a1)))}`;
        break;
      }
      case 'Z':
        d += 'Z';
        break;
    }
  }
  return d;
}

// Flatten a closed path into polygon points.
export function samplePolygon(cmds, steps = 6) {
  const pts = [];
  let cur = [0, 0];
  const push = (p) => {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.05) pts.push(p);
    cur = p;
  };
  for (const c of cmds) {
    switch (c[0]) {
      case 'M':
      case 'L':
        push([c[1], c[2]]);
        break;
      case 'Q': {
        const [x0, y0] = cur;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const u = 1 - t;
          push([u * u * x0 + 2 * u * t * c[1] + t * t * c[3], u * u * y0 + 2 * u * t * c[2] + t * t * c[4]]);
        }
        break;
      }
      case 'C': {
        const [x0, y0] = cur;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const u = 1 - t;
          push([
            u * u * u * x0 + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5],
            u * u * u * y0 + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6],
          ]);
        }
        break;
      }
      case 'A': {
        const [, cx, cy, r, a0, a1] = c;
        const k = Math.max(3, Math.round(Math.abs(a1 - a0) / 15));
        for (let i = 1; i <= k; i++) {
          const a = rad(a0 + ((a1 - a0) * i) / k);
          push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
        break;
      }
    }
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length > 1 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.05) pts.pop();
  return pts;
}

// Wheel arch: a line to where the arch meets the sill, then an arc over the wheel.
export function arch(cx, cy, r, sill) {
  const dy = sill - cy;
  const dx = Math.sqrt(r * r - dy * dy);
  const a0 = (Math.atan2(dy, dx) * 180) / Math.PI;
  return [
    ['L', cx + dx, sill],
    ['A', cx, cy, r, a0, -180 - a0],
  ];
}

export const rect = (x0, y0, x1, y1) => [['M', x0, y0], ['L', x1, y0], ['L', x1, y1], ['L', x0, y1], ['Z']];
export const poly = (pts) => [['M', ...pts[0]], ...pts.slice(1).map((p) => ['L', ...p]), ['Z']];
