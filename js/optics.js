/* =========================================================
   optics.js – 2D-Raytracing mit dem Brechungsgesetz (Snellius)
   Koordinaten: SVG-System (x nach rechts, y nach unten)
   ========================================================= */
(function () {
  'use strict';
  const DEG = Math.PI / 180;
  const EPS = 1e-6;

  const V = {
    v: (x, y) => ({ x, y }),
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    mul: (a, s) => ({ x: a.x * s, y: a.y * s }),
    dot: (a, b) => a.x * b.x + a.y * b.y,
    cross: (a, b) => a.x * b.y - a.y * b.x,
    len: (a) => Math.hypot(a.x, a.y),
    norm: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
    fromAngle: (deg) => ({ x: Math.cos(deg * DEG), y: Math.sin(deg * DEG) }),
    angle: (a) => Math.atan2(a.y, a.x) / DEG,
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  };

  /* Abstand Punkt – Strecke */
  function distPointSeg(p, a, b) {
    const ab = V.sub(b, a);
    const l2 = V.dot(ab, ab) || 1;
    let t = V.dot(V.sub(p, a), ab) / l2;
    t = Math.max(0, Math.min(1, t));
    return V.dist(p, V.add(a, V.mul(ab, t)));
  }

  /* ---------- Körper ---------- */
  function segPiece(a, b, centroid) {
    const d = V.sub(b, a);
    let nrm = V.norm({ x: d.y, y: -d.x });
    const mid = V.mul(V.add(a, b), 0.5);
    if (V.dot(nrm, V.sub(mid, centroid)) < 0) nrm = V.mul(nrm, -1);
    return { type: 'seg', a, b, nrm };
  }

  function centroidOf(pts) {
    let x = 0, y = 0;
    pts.forEach((p) => { x += p.x; y += p.y; });
    return { x: x / pts.length, y: y / pts.length };
  }

  function polygon(points, n, extra) {
    const c = centroidOf(points);
    const pieces = points.map((p, i) => segPiece(p, points[(i + 1) % points.length], c));
    const d = 'M' + points.map((p) => p.x.toFixed(2) + ' ' + p.y.toFixed(2)).join(' L') + ' Z';
    return Object.assign({ n, pieces, path: d, points }, extra || {});
  }

  function rect(x, y, w, h, n) {
    return polygon([{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], n);
  }

  /* Halbzylinder: gerade Seite auf Höhe cy, Rundung nach unten ('down') oder oben ('up') */
  function halfCylinder(cx, cy, r, n, side) {
    side = side || 'down';
    const sgn = side === 'down' ? 1 : -1;
    const c = { x: cx, y: cy };
    const centroid = { x: cx, y: cy + sgn * r * 0.42 };
    const flat = segPiece({ x: cx - r, y: cy }, { x: cx + r, y: cy }, centroid);
    const arc = {
      type: 'arc', c, r, sign: 1,
      valid: (p) => (p.y - cy) * sgn >= -1e-7,
    };
    const sweep = side === 'down' ? 1 : 0;
    const path = `M${cx - r} ${cy} L${cx + r} ${cy} A${r} ${r} 0 0 ${sweep} ${cx - r} ${cy} Z`;
    return { n, pieces: [flat, arc], path };
  }

  /* Bikonvexe (kind='convex') oder bikonkave (kind='concave') Linse
     cx, cy: Mitte; a: halbe Höhe; R: Krümmungsradius */
  function lens(opts) {
    const { cx, cy, a, n } = opts;
    let R = Math.max(opts.R, a + 0.5);
    const s = R - Math.sqrt(R * R - a * a);
    const pieces = [];
    let path, info;
    if (opts.kind === 'concave') {
      const tc = opts.tc != null ? opts.tc : 6;
      const xL = cx - tc / 2, xR = cx + tc / 2;
      const cL = { x: xL - R, y: cy }, cR = { x: xR + R, y: cy };
      const eL = xL - s, eR = xR + s;
      pieces.push({ type: 'arc', c: cL, r: R, sign: -1, valid: (p) => Math.abs(p.y - cy) <= a + 1e-7 && p.x >= cL.x });
      pieces.push({ type: 'arc', c: cR, r: R, sign: -1, valid: (p) => Math.abs(p.y - cy) <= a + 1e-7 && p.x <= cR.x });
      pieces.push({ type: 'seg', a: { x: eL, y: cy - a }, b: { x: eR, y: cy - a }, nrm: { x: 0, y: -1 } });
      pieces.push({ type: 'seg', a: { x: eL, y: cy + a }, b: { x: eR, y: cy + a }, nrm: { x: 0, y: 1 } });
      path = `M${eL} ${cy - a} A${R} ${R} 0 0 1 ${eL} ${cy + a} L${eR} ${cy + a} A${R} ${R} 0 0 1 ${eR} ${cy - a} Z`;
      info = { thickness: tc, edge: tc + 2 * s, sag: s, left: eL, right: eR };
    } else {
      const e = opts.edge != null ? opts.edge : 3;
      const t = 2 * s + e;
      const xL = cx - t / 2, xR = cx + t / 2;
      const cL = { x: xL + R, y: cy }, cR = { x: xR - R, y: cy };
      pieces.push({ type: 'arc', c: cL, r: R, sign: 1, valid: (p) => Math.abs(p.y - cy) <= a + 1e-7 && p.x <= cL.x });
      pieces.push({ type: 'arc', c: cR, r: R, sign: 1, valid: (p) => Math.abs(p.y - cy) <= a + 1e-7 && p.x >= cR.x });
      if (e > 0) {
        pieces.push({ type: 'seg', a: { x: cx - e / 2, y: cy - a }, b: { x: cx + e / 2, y: cy - a }, nrm: { x: 0, y: -1 } });
        pieces.push({ type: 'seg', a: { x: cx - e / 2, y: cy + a }, b: { x: cx + e / 2, y: cy + a }, nrm: { x: 0, y: 1 } });
      }
      path = `M${cx - e / 2} ${cy - a} A${R} ${R} 0 0 0 ${cx - e / 2} ${cy + a} L${cx + e / 2} ${cy + a} A${R} ${R} 0 0 0 ${cx + e / 2} ${cy - a} Z`;
      info = { thickness: t, edge: e, sag: s, left: xL, right: xR };
    }
    return { n, pieces, path, lensInfo: info, R };
  }

  /* Linse als Prismenstapel: Bögen durch Sehnen ersetzt */
  function prismLens(opts) {
    const { cx, cy, a, n } = opts;
    const R = Math.max(opts.R, a + 0.5);
    const e = opts.edge != null ? opts.edge : 3;
    const s = R - Math.sqrt(R * R - a * a);
    const t = 2 * s + e;
    const xL = cx - t / 2;
    const cLx = xL + R;
    const fr = opts.zones || [-1, -0.6, -0.2, 0.2, 0.6, 1];
    const left = fr.map((f) => { const y = f * a; return { x: cLx - Math.sqrt(R * R - y * y), y: cy + y }; });
    const right = left.map((p) => ({ x: 2 * cx - p.x, y: p.y })).reverse();
    const pts = left.concat(right);
    const body = polygon(pts, n);
    body.dividers = fr.slice(1, -1).map((f) => {
      const y = f * a; const x = cLx - Math.sqrt(R * R - y * y);
      return { a: { x, y: cy + y }, b: { x: 2 * cx - x, y: cy + y } };
    });
    return body;
  }

  /* ---------- Schnittpunkte ---------- */
  function hitSeg(o, d, p) {
    const e = V.sub(p.b, p.a);
    const den = V.cross(d, e);
    if (Math.abs(den) < 1e-12) return null;
    const w = V.sub(p.a, o);
    const t = V.cross(w, e) / den;
    const u = V.cross(w, d) / den;
    if (t > EPS && u >= -1e-9 && u <= 1 + 1e-9) return t;
    return null;
  }

  function hitArc(o, d, p) {
    const f = V.sub(o, p.c);
    const b = V.dot(f, d);
    const c = V.dot(f, f) - p.r * p.r;
    const disc = b * b - c;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const ts = [-b - sq, -b + sq];
    for (const t of ts) {
      if (t > EPS) {
        const q = V.add(o, V.mul(d, t));
        if (p.valid(q)) return t;
      }
    }
    return null;
  }

  function normalAt(p, q) {
    if (p.type === 'seg') return p.nrm;
    const r = V.norm(V.sub(q, p.c));
    return p.sign > 0 ? r : V.mul(r, -1);
  }

  /* ---------- Strahlverfolgung ----------
     scene: Array von Körpern {n, pieces}
     liefert {segments:[{a,b,I,main,n}], events:[{p, nIn, n1, n2, inDeg, outDeg, tir, main}], end:{o,d} } */
  function trace(scene, origin, dir, opts) {
    opts = opts || {};
    const maxDepth = opts.maxDepth || 14;
    const partial = !!opts.partial;
    const minI = opts.minI || 0.035;
    const maxLen = opts.maxLen || 2400;
    const n0 = opts.n0 || 1;
    const segments = [];
    const events = [];
    let end = null;
    const stack = [{ o: origin, d: V.norm(dir), I: 1, n: opts.nStart || n0, depth: 0, main: true }];

    while (stack.length) {
      const r = stack.pop();
      let best = null;
      for (const body of scene) {
        for (const p of body.pieces) {
          const t = p.type === 'seg' ? hitSeg(r.o, r.d, p) : hitArc(r.o, r.d, p);
          if (t != null && (!best || t < best.t)) best = { t, p, body };
        }
      }
      if (!best || r.depth >= maxDepth) {
        const b = V.add(r.o, V.mul(r.d, maxLen));
        segments.push({ a: r.o, b, I: r.I, main: r.main, n: r.n, open: true });
        if (r.main) end = { o: r.o, d: r.d };
        continue;
      }
      const q = V.add(r.o, V.mul(r.d, best.t));
      segments.push({ a: r.o, b: q, I: r.I, main: r.main, n: r.n });
      const nrm = normalAt(best.p, q);
      const entering = V.dot(r.d, nrm) < 0;
      const n1 = r.n;
      const n2 = entering ? best.body.n : n0;
      const nIn = entering ? nrm : V.mul(nrm, -1); // zeigt zur Einfallsseite
      const cosi = Math.min(1, -V.dot(r.d, nIn));
      const eta = n1 / n2;
      const k = 1 - eta * eta * (1 - cosi * cosi);
      const refl = V.norm(V.add(r.d, V.mul(nIn, 2 * cosi)));
      const inDeg = Math.acos(cosi) / DEG;
      if (k < 0) {
        events.push({ p: q, nIn, n1, n2, inDeg, outDeg: null, tir: true, main: r.main, dIn: r.d, dOut: refl, body: best.body });
        stack.push({ o: q, d: refl, I: r.I, n: n1, depth: r.depth + 1, main: r.main });
        continue;
      }
      const cost = Math.sqrt(k);
      const tdir = V.norm(V.add(V.mul(r.d, eta), V.mul(nIn, eta * cosi - cost)));
      const rs = Math.pow((n1 * cosi - n2 * cost) / (n1 * cosi + n2 * cost), 2);
      const rp = Math.pow((n1 * cost - n2 * cosi) / (n1 * cost + n2 * cosi), 2);
      const R = (rs + rp) / 2;
      events.push({ p: q, nIn, n1, n2, inDeg, outDeg: Math.acos(cost) / DEG, tir: false, main: r.main, dIn: r.d, dOut: tdir, R, body: best.body });
      if (partial && r.I * R > minI) {
        stack.push({ o: q, d: refl, I: r.I * R, n: n1, depth: r.depth + 1, main: false });
      }
      stack.push({ o: q, d: tdir, I: partial ? r.I * (1 - R) : r.I, n: n2, depth: r.depth + 1, main: r.main });
    }
    return { segments, events, end };
  }

  /* Brennpunkt: achsnaher Parallelstrahl, Schnittpunkt der austretenden Geraden mit der Achse */
  function focus(scene, axisY, xStart, h) {
    h = h || 1.5;
    const tr = trace(scene, { x: xStart, y: axisY - h }, { x: 1, y: 0 });
    if (!tr.end || tr.events.length < 2) return null;
    const { o, d } = tr.end;
    if (Math.abs(d.y) < 1e-9) return null;
    const t = (axisY - o.y) / d.y;
    const x = o.x + d.x * t;
    return { x, y: axisY, virtual: t < 0 };
  }

  function snell(alphaDeg, n1, n2) {
    const s = (n1 / n2) * Math.sin(alphaDeg * DEG);
    if (Math.abs(s) > 1) return null;
    return Math.asin(s) / DEG;
  }

  window.Optics = { V, DEG, polygon, rect, halfCylinder, lens, prismLens, trace, focus, snell, distPointSeg };
})();
