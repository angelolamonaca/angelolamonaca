// Minimal mesh toolkit and ASCII STL writer. GitHub renders ```stl code
// blocks in Markdown as an interactive 3D viewer.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normal = ([a, b, c]) => {
  const v = cross(sub(b, a), sub(c, a));
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};

// Wind a triangle so its normal points along `out`.
export const orient = (t, out) => (dot(normal(t), out) < 0 ? [t[0], t[2], t[1]] : t);

// Ear clipping for a simple 2D polygon. Returns index triples.
export function triangulate(pts) {
  const area = pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const sign = area > 0 ? 1 : -1;
  const idx = pts.map((_, i) => i);
  const tris = [];
  const crossAt = (a, b, c) => (pts[b][0] - pts[a][0]) * (pts[c][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[c][0] - pts[a][0]);
  const inside = (p, a, b, c) => {
    const s1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const s2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0]);
    const s3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0]);
    return (s1 * sign > 0 && s2 * sign > 0 && s3 * sign > 0);
  };
  let guard = 0;
  while (idx.length > 3 && guard++ < 20000) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length];
      const b = idx[i];
      const c = idx[(i + 1) % idx.length];
      if (crossAt(a, b, c) * sign <= 1e-9) continue;
      if (idx.some((j) => j !== a && j !== b && j !== c && inside(pts[j], pts[a], pts[b], pts[c]))) continue;
      tris.push([a, b, c]);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) {
      // Only degenerate (collinear) vertices left: drop the flattest one.
      let best = 0;
      let bestV = Infinity;
      for (let i = 0; i < idx.length; i++) {
        const v = Math.abs(crossAt(idx[(i + idx.length - 1) % idx.length], idx[i], idx[(i + 1) % idx.length]));
        if (v < bestV) [best, bestV] = [i, v];
      }
      idx.splice(best, 1);
    }
  }
  if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
  return tris;
}

// Cylinder along +Y starting at `base`.
export function cylinder([cx, y0, cz], r, h, seg) {
  const tris = [];
  const y1 = y0 + h;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const p = (a, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    const mid = (a0 + a1) / 2;
    const out = [Math.cos(mid), 0, Math.sin(mid)];
    tris.push(orient([p(a0, y0), p(a1, y0), p(a1, y1)], out), orient([p(a0, y0), p(a1, y1), p(a0, y1)], out));
    tris.push(orient([[cx, y0, cz], p(a1, y0), p(a0, y0)], [0, -1, 0]));
    tris.push(orient([[cx, y1, cz], p(a0, y1), p(a1, y1)], [0, 1, 0]));
  }
  return tris;
}

export function box([x0, y0, z0], [x1, y1, z1]) {
  const v = (i) => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
  const faces = [
    [[0, 2, 6, 4], [-1, 0, 0]], [[1, 5, 7, 3], [1, 0, 0]],
    [[0, 4, 5, 1], [0, -1, 0]], [[2, 3, 7, 6], [0, 1, 0]],
    [[0, 1, 3, 2], [0, 0, -1]], [[4, 6, 7, 5], [0, 0, 1]],
  ];
  return faces.flatMap(([[a, b, c, d], out]) => [orient([v(a), v(b), v(c)], out), orient([v(a), v(c), v(d)], out)]);
}

export function sphere([cx, cy, cz], r, seg, rings) {
  const tris = [];
  const p = (i, j) => {
    const th = (i / seg) * Math.PI * 2;
    const ph = (j / rings) * Math.PI;
    return [cx + r * Math.sin(ph) * Math.cos(th), cy + r * Math.sin(ph) * Math.sin(th), cz + r * Math.cos(ph)];
  };
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < seg; i++) {
      const a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1);
      const m = [(a[0] + c[0]) / 2 - cx, (a[1] + c[1]) / 2 - cy, (a[2] + c[2]) / 2 - cz];
      if (j > 0) tris.push(orient([a, b, c], m));
      if (j < rings - 1) tris.push(orient([a, c, d], m));
    }
  }
  return tris;
}

const f = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

export function toStl(tris, name = 'car') {
  let out = `solid ${name}\n`;
  for (const t of tris) {
    const [nx, ny, nz] = normal(t);
    out += `facet normal ${f(nx)} ${f(ny)} ${f(nz)}\nouter loop\n`;
    for (const v of t) out += `vertex ${f(v[0])} ${f(v[1])} ${f(v[2])}\n`;
    out += 'endloop\nendfacet\n';
  }
  return out + `endsolid ${name}\n`;
}
