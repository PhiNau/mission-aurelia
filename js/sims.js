/* =========================================================
   sims.js – interaktive Simulationen (SVG)
   ========================================================= */
(function () {
  'use strict';
  const { s, h, fmt } = UI;
  const O = Optics;
  const V = O.V;
  const DEG = O.DEG;
  let uid = 0;

  const MATERIALS = {
    wasser: { name: 'Wasser', n: 1.33, cls: 'mat-wasser' },
    glas: { name: 'Glas', n: 1.5, cls: 'mat-glas' },
    diamant: { name: 'Diamant', n: 2.42, cls: 'mat-diamant' },
  };

  /* ---------- Bühne ---------- */
  class Stage {
    constructor(container, opts) {
      opts = opts || {};
      this.id = 'st' + (++uid);
      this.w = opts.w || 800;
      this.h = opts.h || 460;
      this.wrap = h('div', { class: 'stage-wrap' });
      this.svg = s('svg', { viewBox: `0 0 ${this.w} ${this.h}`, class: 'stage' + (opts.interactive ? ' interactive' : ''), role: 'img', 'aria-label': opts.label || 'Simulation' });
      const defs = s('defs', null, this.svg);
      defs.innerHTML = `
        <filter id="${this.id}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
        <pattern id="${this.id}-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(140,170,255,0.08)" stroke-width="1"/></pattern>
        <radialGradient id="${this.id}-crystal" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#ffd34d"/><stop offset="1" stop-color="#ff8a00"/></radialGradient>`;
      this.defs = defs;
      this.root = s('g', { id: this.id + '-root' }, this.svg);
      s('rect', { x: 0, y: 0, width: this.w, height: this.h, class: 'stage-bg' }, this.root);
      s('rect', { x: 0, y: 0, width: this.w, height: this.h, fill: `url(#${this.id}-grid)` }, this.root);
      this.gBg = s('g', null, this.root);
      this.gBody = s('g', null, this.root);
      this.gRay = s('g', null, this.root);
      this.gOver = s('g', null, this.root);
      this.gUi = s('g', null, this.svg);
      this.wrap.append(this.svg);
      container.append(this.wrap);
    }
    url(name) { return `url(#${this.id}-${name})`; }
    pt(e) {
      const p = this.svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      const r = p.matrixTransform(this.svg.getScreenCTM().inverse());
      return { x: r.x, y: r.y };
    }
    pointer(handler) {
      const svg = this.svg;
      let active = false;
      svg.addEventListener('pointerdown', (e) => {
        const p = this.pt(e);
        if (handler.down && handler.down(p, e) === false) return;
        active = true;
        try { svg.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        e.preventDefault();
        if (handler.move) handler.move(p, e);
      });
      svg.addEventListener('pointermove', (e) => { if (active && handler.move) handler.move(this.pt(e), e); });
      const stop = () => { if (active) { active = false; if (handler.up) handler.up(); } };
      svg.addEventListener('pointerup', stop);
      svg.addEventListener('pointercancel', stop);
    }
  }

  /* ---------- Zeichenhelfer ---------- */
  function drawSegs(stage, parent, segs, o) {
    o = o || {};
    const glow = s('g', { filter: stage.url('glow'), class: 'ray-glow' + (o.cls ? ' ' + o.cls : '') }, parent);
    const core = s('g', { class: 'ray-core' + (o.cls ? ' ' + o.cls : '') }, parent);
    for (const sg of segs) {
      let a = sg.a, b = sg.b;
      if (o.clip) { const c = o.clip(a, b); if (!c) continue; a = c[0]; b = c[1]; }
      const I = sg.I == null ? 1 : sg.I;
      if (I < 0.02) continue;
      s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'stroke-width': 9, 'stroke-opacity': (0.6 * Math.min(1, I * 1.3)).toFixed(3) }, glow);
      s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'stroke-width': o.width || 2.4, 'stroke-opacity': Math.max(0.22, Math.min(1, I * 1.2)).toFixed(3) }, core);
      if (o.arrows !== false && I > 0.25 && (sg.main || o.allArrows)) {
        const L = V.dist(a, b);
        let pos = null;
        if (sg.open || o.clip) pos = Math.min(90, L * 0.5);
        else if (L > 46) pos = L * 0.5;
        if (pos != null && L > 20) arrow(core, a, b, pos);
      }
    }
  }
  /* Einfallslote an allen Auftreffpunkten (gestrichelt, senkrecht zur Grenzfläche) */
  function drawLots(parent, events, len) {
    let d = '';
    for (const e of events) {
      if (!e.main) continue;
      const n = e.nIn;
      d += `M${(e.p.x + n.x * len).toFixed(1)} ${(e.p.y + n.y * len).toFixed(1)} L${(e.p.x - n.x * len).toFixed(1)} ${(e.p.y - n.y * len).toFixed(1)} `;
    }
    if (d) s('path', { d, class: 'lot-local' }, parent);
  }
  function lotToggle(ctr, on, cb) {
    const tg = UI.toggle('Lote zeigen', on, cb);
    ctr.append(tg.el);
    return tg;
  }

  function arrow(parent, a, b, pos) {
    const d = V.norm(V.sub(b, a));
    const p = V.add(a, V.mul(d, pos));
    const ang = V.angle(d);
    s('path', { d: 'M7 0 L-5 -5.5 L-5 5.5 Z', transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`, class: 'ray-arrow' }, parent);
  }

  function drawLaser(parent, p, ang, cls) {
    const g = s('g', { transform: `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${ang.toFixed(2)})`, class: 'laser' + (cls ? ' ' + cls : '') }, parent);
    s('rect', { x: -66, y: -13, width: 58, height: 26, rx: 6, class: 'laser-body' }, g);
    s('rect', { x: -10, y: -7, width: 10, height: 14, rx: 2, class: 'laser-nozzle' }, g);
    s('circle', { cx: -53, cy: 0, r: 3.8, class: 'laser-led' }, g);
    s('rect', { x: -44, y: -8, width: 28, height: 3, rx: 1.5, fill: 'rgba(255,255,255,.22)' }, g);
    return g;
  }

  function arcPath(c, r, a1, a2) {
    const d = (((a2 - a1) % 360) + 540) % 360 - 180;
    const p1 = { x: c.x + r * Math.cos(a1 * DEG), y: c.y + r * Math.sin(a1 * DEG) };
    const p2 = { x: c.x + r * Math.cos((a1 + d) * DEG), y: c.y + r * Math.sin((a1 + d) * DEG) };
    return { d: `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`, mid: a1 + d / 2, span: Math.abs(d) };
  }
  function angleArc(parent, c, r, a1, a2, cls, label) {
    const arc = arcPath(c, r, a1, a2);
    if (arc.span < 0.5) return;
    s('path', { d: arc.d, class: 'angle-arc ' + cls }, parent);
    if (label) {
      const lr = r + 15;
      s('text', { x: c.x + lr * Math.cos(arc.mid * DEG), y: c.y + lr * Math.sin(arc.mid * DEG) + 6, class: 'angle-label ' + cls, 'text-anchor': 'middle', text: label }, parent);
    }
  }

  function bodyPath(parent, body, cls) {
    return s('path', { d: body.path, class: 'body ' + (cls || 'mat-glas') }, parent);
  }

  function crystal(parent, p, size, cls, stage) {
    const g = s('g', { transform: `translate(${p.x} ${p.y})`, class: 'crystal ' + (cls || '') }, parent);
    const r = size;
    s('path', { d: `M0 ${-r} L${r * 0.7} ${-r * 0.2} L${r * 0.45} ${r} L${-r * 0.45} ${r} L${-r * 0.7} ${-r * 0.2} Z`, fill: stage ? stage.url('crystal') : '#ffd34d', stroke: '#fff6c8', 'stroke-width': 1.5 }, g);
    s('path', { d: `M0 ${-r} L0 ${r} M${-r * 0.7} ${-r * 0.2} L${r * 0.7} ${-r * 0.2}`, stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1, fill: 'none' }, g);
    return g;
  }

  function label(parent, x, y, text, cls, anchor) {
    return s('text', { x, y, class: 'stage-label ' + (cls || ''), 'text-anchor': anchor || 'start', text }, parent);
  }

  function controls(container) {
    const c = h('div', { class: 'controls' });
    container.append(c);
    return c;
  }

  /* =========================================================
     1) Zielschuss: Kristall im Glasblock treffen
     ========================================================= */
  function target(container, opts) {
    opts = opts || {};
    const st = new Stage(container, { w: 800, h: 460, interactive: true, label: 'Laser und Glasblock mit Kristall' });
    const block = O.rect(250, 210, 500, 220, 1.5);
    bodyPath(st.gBody, block, 'mat-glas');
    label(st.gBg, 770, 40, 'Luft', 'lbl-air', 'end');
    label(st.gBody, 735, 415, 'Glas', 'lbl-glass', 'end');
    const L = { x: 70, y: 80 };
    const T = { x: 600, y: 375 };
    let ang = 30;
    let hit = false, reported = false, shots = 0;
    const gAim = s('g', null, st.gOver);
    const gCrystal = s('g', null, st.gBody);
    const cr = crystal(gCrystal, T, 15, '', st);
    const gLaser = s('g', null, st.gOver);
    const info = h('div', { class: 'readout' });
    container.append(info);
    const ctr = controls(container);
    const sl = UI.slider({ label: 'Richtung des Lasers', min: 3, max: 80, step: 0.1, fine: 0.2, value: ang, format: (v) => fmt(v, 1) + '°', onInput: (v) => { ang = v; render(); } });
    ctr.append(sl.el);

    function render() {
      const dir = V.fromAngle(ang);
      const tr = O.trace([block], L, dir, { partial: true });
      st.gRay.innerHTML = '';
      drawLots(st.gRay, tr.events, 55);
      drawSegs(st, st.gRay, tr.segments);
      gAim.innerHTML = '';
      const far = V.add(L, V.mul(dir, 1000));
      s('line', { x1: L.x, y1: L.y, x2: far.x, y2: far.y, class: 'aim-line' }, gAim);
      gLaser.innerHTML = '';
      drawLaser(gLaser, L, ang);
      // nur der erste Weg im Glas zählt (keine Treffer über Spiegelungen)
      const first = tr.segments.find((sg) => sg.main && sg.n > 1.01);
      hit = !!first && O.distPointSeg(T, first.a, first.b) < 17;
      cr.classList.toggle('hit', hit);
      info.innerHTML = hit
        ? '<b class="ok">Treffer!</b> Vergleicht die gestrichelte Ziellinie mit dem echten Strahl.'
        : 'Gelb gestrichelt: dorthin zielt der Laser. <span class="dim">Rot: der echte Lichtweg. Weiß gestrichelt: das Lot.</span>';
      if (hit && !reported) { reported = true; opts.onHit && opts.onHit(shots); }
    }
    st.pointer({
      move: (p) => {
        let a = V.angle(V.sub(p, L));
        a = Math.max(3, Math.min(80, a));
        ang = Math.round(a * 10) / 10;
        sl.set(ang, false);
        render();
      },
      up: () => { shots++; },
    });
    render();
    return { stage: st };
  }

  /* =========================================================
     2) Optische Scheibe mit Halbzylinder (Messlabor)
        mode 'in'  : Luft -> Glas (Laser oben)
        mode 'out' : Glas -> Luft (Laser unten, durch die Rundung)
     ========================================================= */
  function disc(container, opts) {
    opts = Object.assign({ mode: 'in', material: 'glas', alpha: 30, showBeta: false, lupe: true, materials: false, showAlpha: true }, opts);
    const st = new Stage(container, { w: 800, h: 540, interactive: !opts.static, label: 'Optische Scheibe mit Winkelskala und halbrundem Glaskörper' });
    const C = { x: 400, y: 270 };
    const RING = 180, RG = 150, RL = 215;
    let alpha = opts.alpha;
    let mat = opts.material;
    let showBeta = opts.showBeta;
    let lupeOn = false;
    let predictMode = null;
    let state = {};

    // Skala
    let ticks = '';
    for (let t = 0; t < 360; t++) {
      const len = t % 10 === 0 ? 15 : t % 5 === 0 ? 9 : 5;
      const dx = Math.sin(t * DEG), dy = -Math.cos(t * DEG);
      ticks += `M${(C.x + dx * RING).toFixed(2)} ${(C.y + dy * RING).toFixed(2)} L${(C.x + dx * (RING - len)).toFixed(2)} ${(C.y + dy * (RING - len)).toFixed(2)} `;
    }
    s('circle', { cx: C.x, cy: C.y, r: RING + 1, class: 'disc-face' }, st.gBg);
    s('path', { d: ticks, class: 'ticks' }, st.gBg);
    for (let t = 0; t < 360; t += 10) {
      const q = t % 180;
      const val = Math.min(q, 180 - q);
      const dx = Math.sin(t * DEG), dy = -Math.cos(t * DEG);
      s('text', { x: (C.x + dx * (RING + 14)).toFixed(1), y: (C.y + dy * (RING + 14) + 4).toFixed(1), class: 'tick-label', 'text-anchor': 'middle', text: val }, st.gBg);
    }
    s('line', { x1: C.x, y1: C.y - RING, x2: C.x, y2: C.y + RING, class: 'lot' }, st.gBg);
    s('line', { x1: C.x - RING, y1: C.y, x2: C.x + RING, y2: C.y, class: 'boundary-faint' }, st.gBg);
    label(st.gBg, C.x - 8, C.y - RING + 34, 'Lot', 'lbl-lot', 'end');
    label(st.gBg, 40, 50, 'Luft', 'lbl-air');
    const matLabel = label(st.gBg, 40, 510, '', 'lbl-glass');
    const gBody = s('g', null, st.gBody);
    const gAngles = s('g', null, st.gOver);
    const gPred = s('g', null, st.gOver);
    const gLaser = s('g', null, st.gOver);
    const gLupe = s('g', { class: 'lupe', style: 'display:none' }, st.gUi);

    // Lupe
    const LZ = { x: 690, y: 100, r: 88, k: 3 };
    const clipId = st.id + '-lupeclip';
    const cp = s('clipPath', { id: clipId }, st.defs);
    s('circle', { cx: LZ.x, cy: LZ.y, r: LZ.r }, cp);
    const lupeInner = s('g', { 'clip-path': `url(#${clipId})` }, gLupe);
    s('rect', { x: LZ.x - LZ.r, y: LZ.y - LZ.r, width: LZ.r * 2, height: LZ.r * 2, class: 'stage-bg' }, lupeInner);
    const use = s('use', { href: '#' + st.root.id }, lupeInner);
    s('circle', { cx: LZ.x, cy: LZ.y, r: LZ.r, class: 'lupe-ring' }, gLupe);
    s('text', { x: LZ.x, y: LZ.y + LZ.r + 20, class: 'lupe-label', 'text-anchor': 'middle', text: 'Lupe (3-fach)' }, gLupe);

    const read = h('div', { class: 'readout' });
    container.append(read);
    const ctr = controls(container);
    let sl = null;
    if (!opts.static) {
      sl = UI.slider({ label: 'Einfallswinkel α einstellen', min: 0, max: 89, step: 1, value: alpha, format: (v) => v + '°', onInput: (v) => { alpha = v; render(); } });
      ctr.append(sl.el);
    }
    if (opts.materials) {
      const seg = UI.segmented(Object.keys(MATERIALS).map((k) => ({ value: k, label: MATERIALS[k].name })), mat, (v) => { mat = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, h('label', null, 'Stoff'), seg.el));
    }
    if (opts.lupe && !opts.static) {
      const tg = UI.toggle('Lupe', false, (v) => { lupeOn = v; render(); });
      ctr.append(tg.el);
    }

    function laserPos() {
      const sa = Math.sin(alpha * DEG), ca = Math.cos(alpha * DEG);
      return opts.mode === 'in' ? { x: C.x - RL * sa, y: C.y - RL * ca } : { x: C.x - RL * sa, y: C.y + RL * ca };
    }
    function exitDir(theta) { // Winkel theta zum Lot auf der Austrittsseite, nach rechts
      const sa = Math.sin(theta * DEG), ca = Math.cos(theta * DEG);
      return opts.mode === 'in' ? { x: sa, y: ca } : { x: sa, y: -ca };
    }

    function render() {
      const M = MATERIALS[mat];
      const body = O.halfCylinder(C.x, C.y, RG, M.n, 'down');
      gBody.innerHTML = '';
      bodyPath(gBody, body, M.cls);
      matLabel.textContent = M.name;
      const P = laserPos();
      const dir = V.sub(C, P);
      st.gRay.innerHTML = '';
      gAngles.innerHTML = '';
      gPred.innerHTML = '';
      const tr = O.trace([body], P, dir, { partial: true });
      // Ereignis am Mittelpunkt
      const ev = tr.events.find((e) => e.main && V.dist(e.p, C) < 1);
      let beta = null, tir = false, outDir = null;
      if (ev) { tir = ev.tir; beta = ev.tir ? null : ev.outDeg; outDir = ev.dOut; }
      if (alpha === 0) { beta = 0; outDir = V.norm(dir); }
      state = { alpha, beta, tir, material: mat, n: M.n };

      if (predictMode) {
        // nur einfallenden Strahl bis zum Mittelpunkt
        drawSegs(st, st.gRay, [{ a: P, b: C, I: 1, main: true }]);
        predictMode.cands.forEach((c) => {
          const end = V.add(C, V.mul(c.dir, RING + 22));
          const g = s('g', { class: 'cand', 'data-key': c.key }, gPred);
          s('line', { x1: C.x, y1: C.y, x2: end.x, y2: end.y, class: 'cand-line' }, g);
          const lp = V.add(C, V.mul(c.dir, RING + 38));
          s('circle', { cx: lp.x, cy: lp.y, r: 14, class: 'cand-dot' }, g);
          s('text', { x: lp.x, y: lp.y + 5, 'text-anchor': 'middle', class: 'cand-key', text: c.key }, g);
          g.addEventListener('click', () => predictMode.choose(c.key));
        });
      } else {
        drawSegs(st, st.gRay, tr.segments);
      }

      // Winkelbögen
      const lotIn = opts.mode === 'in' ? -90 : 90;
      const lotOut = -lotIn;
      if (alpha > 0.5) angleArc(gAngles, C, 58, lotIn, V.angle(V.sub(P, C)), 'arc-alpha', 'α');
      if (!predictMode && beta != null && beta > 0.5 && outDir) angleArc(gAngles, C, 72, lotOut, V.angle(outDir), 'arc-beta', 'β');

      gLaser.innerHTML = '';
      drawLaser(gLaser, P, V.angle(dir));

      // Lupe
      gLupe.style.display = lupeOn ? '' : 'none';
      if (lupeOn) {
        let rp = outDir ? V.add(C, V.mul(outDir, RING - 4)) : C;
        if (tir && ev) rp = V.add(C, V.mul(ev.dOut, RING - 4));
        use.setAttribute('transform', `translate(${LZ.x} ${LZ.y}) scale(${LZ.k}) translate(${-rp.x} ${-rp.y})`);
      }

      // Anzeige
      let txt = opts.showAlpha ? `<span class="pill pill-alpha">α = ${alpha}°</span>` : '';
      if (predictMode) txt += ' <span class="pill">β = ?</span>';
      else if (tir) txt += ' <span class="pill pill-warn">Kein Licht tritt in die Luft aus!</span>';
      else if (showBeta && beta != null) txt += ` <span class="pill pill-beta">β = ${fmt(beta, 1)}°</span>`;
      else txt += ' <span class="pill pill-beta">β = ? <small>(an der Skala ablesen)</small></span>';
      read.innerHTML = txt;
      if (opts.onChange) opts.onChange(state);
    }

    if (!opts.static) {
      st.pointer({
        down: (p) => { if (predictMode) return false; },
        move: (p) => {
          const v = V.sub(p, C);
          let a = Math.atan2(-v.x, opts.mode === 'in' ? -v.y : v.y) / DEG;
          a = Math.round(Math.max(0, Math.min(89, a)));
          alpha = a; sl && sl.set(a, false); render();
        },
      });
    }

    render();

    return {
      stage: st,
      get state() { return state; },
      setAlpha(a) { alpha = a; sl && sl.set(a, false); render(); },
      setShowBeta(v) { showBeta = v; render(); },
      setMaterial(m) { mat = m; render(); },
      predict(onAnswer) {
        const real = state.beta;
        const options = opts.mode === 'in'
          ? [{ kind: 'zum Lot', theta: real, real: true }, { kind: 'gerade', theta: alpha }, { kind: 'vom Lot', theta: Math.min(85, alpha * 1.5) }]
          : [{ kind: 'zum Lot', theta: alpha * 0.55 }, { kind: 'gerade', theta: alpha }, { kind: 'vom Lot', theta: real, real: true }];
        const keys = ['A', 'B', 'C'];
        const order = UI.shuffle(options);
        predictMode = {
          cands: order.map((o, i) => ({ key: keys[i], dir: exitDir(o.theta), kind: o.kind, real: !!o.real })),
          choose: (key) => {
            const c = predictMode.cands.find((x) => x.key === key);
            predictMode = null;
            render();
            onAnswer && onAnswer(c.real, c.kind);
          },
        };
        render();
        return predictMode.cands.map((c) => c.key);
      },
      choose(key) { if (predictMode) predictMode.choose(key); },
    };
  }

  /* =========================================================
     3) Glasquader / Prisma
     ========================================================= */
  function bench(container, opts) {
    opts = Object.assign({ shape: 'block', flip: false, showExt: true, allowFlip: false }, opts);
    const st = new Stage(container, { w: 800, h: 460, interactive: true, label: 'Laser und Glaskörper' });
    let shape = opts.shape, flip = opts.flip;
    let L, ang, body, predictMode = null;
    const gB = s('g', null, st.gBody);
    const gExt = s('g', null, st.gOver);
    const gPred = s('g', null, st.gOver);
    const gLaser = s('g', null, st.gOver);
    label(st.gBg, 770, 40, 'Luft', 'lbl-air', 'end');
    const read = h('div', { class: 'readout' });
    container.append(read);
    const ctr = controls(container);
    const sl = UI.slider({ label: 'Richtung des Lasers', min: -40, max: 70, step: 0.5, value: 0, format: (v) => fmt(v, 1) + '°', onInput: (v) => { ang = v; render(); } });
    ctr.append(sl.el);
    let flipBtn = null;
    if (opts.allowFlip) {
      flipBtn = UI.btn('↕ Prisma umdrehen', () => { flip = !flip; setup(); render(); }, 'btn-ghost');
      ctr.append(flipBtn);
    }

    function setup() {
      if (shape === 'block') {
        L = { x: 90, y: 70 }; ang = 32; body = O.rect(250, 200, 330, 130, 1.5);
        sl.input.min = 5; sl.input.max = 70;
      } else {
        const cx = 430, cy = 255, side = 290, hgt = side * Math.sqrt(3) / 2;
        const sg = flip ? -1 : 1;
        const apex = { x: cx, y: cy - sg * hgt * 2 / 3 };
        const b1 = { x: cx - side / 2, y: cy + sg * hgt / 3 };
        const b2 = { x: cx + side / 2, y: cy + sg * hgt / 3 };
        body = O.polygon([apex, b2, b1], 1.5);
        L = { x: 70, y: flip ? 300 : 210 }; ang = flip ? 8 : -8;
        sl.input.min = -40; sl.input.max = 40;
      }
      sl.set(ang, false);
    }

    function render() {
      gB.innerHTML = '';
      bodyPath(gB, body, 'mat-glas');
      if (shape === 'prism') {
        const bx = body.points;
        const base = V.mul(V.add(bx[1], bx[2]), 0.5);
        label(gB, base.x, base.y + (flip ? -14 : 28), 'Basis (dicke Seite)', 'lbl-small', 'middle');
        label(gB, bx[0].x, bx[0].y + (flip ? 30 : -12), 'Spitze', 'lbl-small', 'middle');
      }
      const dir = V.fromAngle(ang);
      const tr = O.trace([body], L, dir, { partial: false });
      st.gRay.innerHTML = '';
      gExt.innerHTML = '';
      gPred.innerHTML = '';
      const ev = tr.events.filter((e) => e.main);
      if (predictMode && ev.length >= 2) {
        drawLots(st.gRay, [ev[0], ev[ev.length - 1]], 50);
        drawSegs(st, st.gRay, [{ a: L, b: ev[0].p, I: 1, main: true }]);
        const mid = V.mul(V.add(ev[0].p, ev[1].p), 0.5);
        s('text', { x: mid.x, y: mid.y + 10, 'text-anchor': 'middle', class: 'qmark', text: '?' }, gPred);
        predictMode.cands.forEach((cd) => {
          const a = ev[ev.length - 1].p;
          const b = V.add(a, V.mul(cd.dir, 175));
          const g = s('g', { class: 'cand' }, gPred);
          s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'cand-line' }, g);
          const lp = V.add(a, V.mul(cd.dir, 150));
          s('circle', { cx: lp.x, cy: lp.y, r: 14, class: 'cand-dot' }, g);
          s('text', { x: lp.x, y: lp.y + 5, 'text-anchor': 'middle', class: 'cand-key', text: cd.key }, g);
          g.addEventListener('click', () => predictMode.choose(cd.key));
        });
      } else {
        drawLots(st.gRay, ev, 50);
        drawSegs(st, st.gRay, tr.segments);
        if (opts.showExt && ev.length) {
          const a = ev[0].p, b = V.add(a, V.mul(dir, 700));
          s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'ext-line' }, gExt);
        }
      }
      gLaser.innerHTML = '';
      drawLaser(gLaser, L, ang);
      let dev = null;
      if (tr.end && ev.length >= 2) dev = V.angle(tr.end.d) - ang;
      state = { ang, dev, hits: ev.length, tir: ev.some((e) => e.tir) };
      if (predictMode) read.innerHTML = 'Wählt eure Vermutung: <b>A</b>, <b>B</b> oder <b>C</b>.';
      else if (shape === 'block') read.innerHTML = '<span class="legend-ext"></span> ursprüngliche Richtung des Lasers · <span class="legend-lot"></span> Lote';
      else read.innerHTML = '<span class="legend-ext"></span> ursprüngliche Richtung · <span class="legend-lot"></span> Lote' + (state.tir ? ' · <span class="pill pill-warn">Totalreflexion im Prisma</span>' : '');
      opts.onChange && opts.onChange(state);
    }
    let state = {};
    st.pointer({
      down: () => { if (predictMode) return false; },
      move: (p) => {
        let a = V.angle(V.sub(p, L));
        a = Math.max(Number(sl.input.min), Math.min(Number(sl.input.max), a));
        ang = Math.round(a * 2) / 2; sl.set(ang, false); render();
      },
    });
    setup();
    render();
    return {
      stage: st,
      get state() { return state; },
      setFlip(v) { flip = v; setup(); render(); },
      predict(onAnswer) {
        const dir = V.fromAngle(ang);
        const tr = O.trace([body], L, dir);
        const realA = V.angle(tr.end.d);
        const dev = realA - ang;
        const opts3 = [
          { kind: 'Basis', a: realA, real: true },
          { kind: 'gerade', a: ang },
          { kind: 'Spitze', a: ang - dev },
        ];
        const keys = ['A', 'B', 'C'];
        predictMode = {
          cands: UI.shuffle(opts3).map((o, i) => ({ key: keys[i], dir: V.fromAngle(o.a), real: !!o.real, kind: o.kind })),
          choose: (key) => {
            const c = predictMode.cands.find((x) => x.key === key);
            predictMode = null; sl.input.disabled = false; render();
            onAnswer && onAnswer(c.real, c.kind);
          },
        };
        sl.input.disabled = true;
        render();
      },
      choose(key) { if (predictMode) predictMode.choose(key); },
    };
  }

  /* =========================================================
     4) Linsen-Bank: Prismenstapel, Sammel- und Zerstreuungslinse
     ========================================================= */
  const CMIN = 1 / 450, CMAX = 1 / 165;
  function lensBench(container, opts) {
    opts = Object.assign({ kind: 'convex', kinds: null, R: 260, curvature: false, showF: true, extensions: true, labels: false, interactive: true }, opts);
    const st = new Stage(container, { w: 800, h: 460, label: 'Parallele Lichtstrahlen treffen auf eine Linse' });
    const AX = 230, CX = 330, A = 100;
    let kind = opts.kind, R = opts.R, showF = opts.showF;
    const gLens = s('g', null, st.gBody);
    const gMarks = s('g', null, st.gOver);
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    if (opts.labels) label(st.gBg, 790, AX - 10, 'optische Achse', 'lbl-small', 'end');
    let state = {};
    const read = h('div', { class: 'readout' });
    if (!opts.bare) container.append(read);
    const ctr = opts.bare ? h('div') : controls(container);
    if (opts.kinds) {
      const names = { prisms: 'Prismenstapel', convex: 'Sammellinse', concave: 'Zerstreuungslinse' };
      const seg = UI.segmented(opts.kinds.map((k) => ({ value: k, label: names[k] })), kind, (v) => { kind = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, seg.el));
    }
    let curv = null;
    if (opts.curvature) {
      const toV = (r) => Math.round(((1 / r - CMIN) / (CMAX - CMIN)) * 100);
      curv = UI.slider({ label: 'Wölbung der Linse', min: 0, max: 100, step: 1, value: toV(R), format: (v) => v < 20 ? 'flach' : v < 45 ? 'mittel' : v < 75 ? 'stark' : 'sehr stark',
        onInput: (v) => { R = 1 / (CMIN + (v / 100) * (CMAX - CMIN)); render(); } });
      ctr.append(curv.el);
    }
    if (opts.extensions === 'toggle') {
      const tg = UI.toggle('Rückverlängerung zeigen', false, (v) => { showExt = v; render(); });
      ctr.append(tg.el);
    }
    let showExt = opts.extensions === true;
    let showLots = opts.lots != null ? opts.lots : !opts.bare;
    if (!opts.bare) lotToggle(ctr, showLots, (v) => { showLots = v; render(); });

    function heights() {
      if (kind === 'prisms') return [-80, -40, 0, 40, 80];
      return [-60, -45, -30, -15, 0, 15, 30, 45, 60];
    }
    function render() {
      let body;
      if (kind === 'prisms') body = O.prismLens({ cx: CX, cy: AX, a: A, R, n: 1.5 });
      else body = O.lens({ cx: CX, cy: AX, a: A, R, n: 1.5, kind });
      gLens.innerHTML = '';
      bodyPath(gLens, body, 'mat-glas lens');
      if (body.dividers) body.dividers.forEach((d) => s('line', { x1: d.a.x, y1: d.a.y, x2: d.b.x, y2: d.b.y, class: 'divider' }, gLens));
      st.gRay.innerHTML = '';
      gMarks.innerHTML = '';
      const segs = [];
      const ends = [];
      const evs = [];
      heights().forEach((y) => {
        const tr = O.trace([body], { x: -5, y: AX + y }, { x: 1, y: 0 });
        segs.push(...tr.segments);
        evs.push(...tr.events);
        if (tr.end) ends.push(tr.end);
      });
      if (showLots) drawLots(st.gRay, evs, kind === 'prisms' ? 30 : 22);
      drawSegs(st, st.gRay, segs);
      const F = kind === 'prisms' ? null : O.focus([body], AX, -5);
      if (kind === 'concave' && showExt) {
        ends.forEach((e) => {
          if (Math.abs(e.d.y) < 1e-6) return;
          const t = (AX - e.o.y) / e.d.y;
          const b = V.add(e.o, V.mul(e.d, Math.max(t, -600)));
          s('line', { x1: e.o.x, y1: e.o.y, x2: b.x, y2: b.y, class: 'back-ext' }, gMarks);
        });
      }
      if (F && showF) {
        const fx = F.x;
        s('circle', { cx: fx, cy: AX, r: 6, class: 'focus-dot' + (F.virtual ? ' virtual' : '') }, gMarks);
        if (opts.markLabels !== false) label(gMarks, fx, AX - 14, 'F', 'lbl-focus', 'middle');
        const yA = AX + A + 40;
        s('line', { x1: CX, y1: yA, x2: fx, y2: yA, class: 'dim-line' }, gMarks);
        s('line', { x1: CX, y1: yA - 8, x2: CX, y2: yA + 8, class: 'dim-line' }, gMarks);
        s('line', { x1: fx, y1: yA - 8, x2: fx, y2: yA + 8, class: 'dim-line' }, gMarks);
        s('line', { x1: fx, y1: AX + 8, x2: fx, y2: yA, class: 'dim-help' }, gMarks);
        if (opts.markLabels !== false) label(gMarks, (CX + fx) / 2, yA - 8, 'f', 'lbl-f', 'middle');
      }
      const f = F ? F.x - CX : null;
      state = { kind, R, f, F };
      if (kind === 'prisms') read.innerHTML = 'Ein Glasquader in der Mitte, darüber und darunter Prismen – <span class="dim">jedes Stück lenkt zur dicken Seite ab.</span>';
      else if (kind === 'convex') read.innerHTML = F ? `Brennweite <span class="pill pill-f">f ≈ ${fmt(f / 10, 1)} cm</span>` : '';
      else read.innerHTML = F ? `Die Strahlen laufen auseinander. Scheinbarer Brennpunkt <span class="pill pill-f">${fmt(Math.abs(f) / 10, 1)} cm vor der Linse</span>` : '';
      opts.onChange && opts.onChange(state);
    }
    render();
    return { stage: st, get state() { return state; }, set(k) { kind = k; render(); }, AX, CX, A };
  }

  /* =========================================================
     5) Besondere Strahlen (dünne, idealisierte Linse vs. echte Linse)
     ========================================================= */
  function thinLens(container, opts) {
    opts = Object.assign({ f: 200, y: 170, ang: 0, mode: 'ideal', allowReal: true }, opts);
    const st = new Stage(container, { w: 800, h: 460, interactive: true, label: 'Laser und Sammellinse mit Brennpunkten' });
    const AX = 230, LX = 420, A = 90, f = opts.f, X0 = 70;
    let y = opts.y, ang = opts.ang, mode = opts.mode, showLots = true;
    // Radius der echten Linse so bestimmen, dass f passt
    let Rreal = 160;
    (function solve() {
      let lo = A + 1, hi = 900;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const F = O.focus([O.lens({ cx: LX, cy: AX, a: A, R: mid, n: 1.5 })], AX, 0);
        if (F && F.x - LX > f) hi = mid; else lo = mid;
      }
      Rreal = (lo + hi) / 2;
    })();
    const realBody = O.lens({ cx: LX, cy: AX, a: A, R: Rreal, n: 1.5 });
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    label(st.gBg, 790, AX - 10, 'optische Achse', 'lbl-small', 'end');
    const gLens = s('g', null, st.gBody);
    const gMarks = s('g', null, st.gOver);
    const gLaser = s('g', null, st.gOver);
    [LX - f, LX + f].forEach((x) => {
      s('circle', { cx: x, cy: AX, r: 6, class: 'focus-dot' }, gMarks);
      label(gMarks, x, AX + 26, 'F', 'lbl-focus', 'middle');
    });
    const read = h('div', { class: 'readout' });
    container.append(read);
    const ctr = controls(container);
    const slY = UI.slider({ label: 'Höhe des Lasers', min: -150, max: 150, step: 1, value: AX - y, format: (v) => (v > 0 ? '+' : '') + v, onInput: (v) => { y = AX - v; render(); } });
    const slA = UI.slider({ label: 'Neigung des Strahls', min: -40, max: 40, step: 0.5, value: -ang, format: (v) => fmt(v, 1) + '°', onInput: (v) => { ang = -v; render(); } });
    ctr.append(slY.el, slA.el);
    if (opts.allowReal) {
      const seg = UI.segmented([{ value: 'ideal', label: 'Vereinfacht (Mittelebene)' }, { value: 'real', label: 'Echte Linse' }], mode, (v) => { mode = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, seg.el));
      lotToggle(ctr, showLots, (v) => { showLots = v; render(); });
    }
    let state = {};
    let goalDone = false;

    function idealTrace(P, d) {
      const t = (LX - P.x) / d.x;
      const q = V.add(P, V.mul(d, t));
      const segs = [{ a: P, b: q, I: 1, main: true }];
      const rel = q.y - AX;
      let out;
      if (Math.abs(rel) > A) out = d;
      else { const m = d.y / d.x - rel / f; out = V.norm({ x: 1, y: m }); }
      segs.push({ a: q, b: V.add(q, V.mul(out, 1400)), I: 1, main: true, open: true });
      return { segs, q, out, hitsLens: Math.abs(rel) <= A };
    }

    function render() {
      gLens.innerHTML = '';
      if (mode === 'ideal') {
        s('path', { d: realBody.path, class: 'body mat-glas lens faint' }, gLens);
        s('line', { x1: LX, y1: AX - A - 10, x2: LX, y2: AX + A + 10, class: 'mid-plane' }, gLens);
        s('path', { d: `M${LX} ${AX - A - 12} l-7 10 M${LX} ${AX - A - 12} l7 10 M${LX} ${AX + A + 12} l-7 -10 M${LX} ${AX + A + 12} l7 -10`, class: 'mid-plane-arrows' }, gLens);
        label(gLens, LX + 8, AX - A - 18, 'Mittelebene', 'lbl-small');
      } else {
        bodyPath(gLens, realBody, 'mat-glas lens');
      }
      const P = { x: X0, y };
      const d = V.fromAngle(ang);
      st.gRay.innerHTML = '';
      let out, q, hits;
      const id = idealTrace(P, d);
      q = id.q; hits = id.hitsLens;
      if (mode === 'ideal') {
        drawSegs(st, st.gRay, id.segs);
        out = id.out;
      } else {
        const tr = O.trace([realBody], P, d);
        if (showLots) drawLots(st.gRay, tr.events, 32);
        drawSegs(st, st.gRay, tr.segments);
        out = tr.end ? tr.end.d : d;
      }
      gLaser.innerHTML = '';
      drawLaser(gLaser, P, ang);
      const inDeg = -ang;
      const outDeg = -V.angle(out);
      state = { inDeg, outDeg, yLens: AX - q.y, yLaser: AX - y, hitsLens: hits, mode, q };
      read.innerHTML = `Neigung vor der Linse <span class="pill">${fmt(inDeg, 1)}°</span> · nach der Linse <span class="pill">${fmt(outDeg, 1)}°</span>`;
      if (opts.goal && !goalDone && opts.goal(state)) { goalDone = true; opts.onGoal && opts.onGoal(state); }
      opts.onChange && opts.onChange(state);
    }

    let dragMode = null;
    st.pointer({
      down: (p) => {
        dragMode = (Math.abs(p.x - X0 + 30) < 50 && Math.abs(p.y - y) < 30) ? 'move' : 'aim';
      },
      move: (p) => {
        if (dragMode === 'move') {
          y = Math.round(Math.max(AX - 150, Math.min(AX + 150, p.y)));
          slY.set(AX - y, false);
        } else {
          if (p.x < X0 + 20) return;
          let a = V.angle(V.sub(p, { x: X0, y }));
          a = Math.max(-40, Math.min(40, a));
          a = Math.round(a * 2) / 2;
          if (Math.abs(a) < 0.75) a = 0;
          ang = a; slA.set(-ang, false);
        }
        render();
      },
    });
    render();
    return { stage: st, get state() { return state; }, reset() { goalDone = false; } };
  }

  /* =========================================================
     6) Fernrohr (Finale)
     ========================================================= */
  function comet(parent, id) {
    const svg = s('svg', { viewBox: '0 0 200 200', class: 'okular-svg', role: 'img', 'aria-label': 'Blick durch das Okular' }, parent);
    const defs = s('defs', null, svg);
    defs.innerHTML = `
      <clipPath id="${id}-clip"><circle cx="100" cy="100" r="96"/></clipPath>
      <radialGradient id="${id}-sky" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#101c3d"/><stop offset="1" stop-color="#03060f"/></radialGradient>
      <radialGradient id="${id}-head" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d9fbff"/><stop offset="1" stop-color="#5fd6ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bff4ff" stop-opacity=".9"/><stop offset="1" stop-color="#5fa8ff" stop-opacity="0"/></linearGradient>
      <filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0"/></filter>`;
    const g = s('g', { 'clip-path': `url(#${id}-clip)` }, svg);
    s('rect', { x: 0, y: 0, width: 200, height: 200, fill: `url(#${id}-sky)` }, g);
    const content = s('g', { filter: `url(#${id}-blur)` }, g);
    const stars = [[30, 40, 1.2], [160, 30, 1], [140, 150, 1.4], [50, 160, 0.9], [175, 100, 1.1], [80, 25, 0.8], [25, 110, 1], [110, 180, 0.8], [185, 155, 0.9]];
    stars.forEach(([x, y, r]) => s('circle', { cx: x, cy: y, r, fill: '#fff' }, content));
    s('path', { d: 'M96 104 Q140 128 196 150 L190 168 Q130 140 92 110 Z', fill: `url(#${id}-tail)` }, content);
    s('path', { d: 'M96 104 Q150 112 200 112 L200 122 Q148 122 94 108 Z', fill: `url(#${id}-tail)`, opacity: 0.6 }, content);
    s('circle', { cx: 94, cy: 104, r: 14, fill: `url(#${id}-head)` }, content);
    s('circle', { cx: 94, cy: 104, r: 3.2, fill: '#fff' }, content);
    s('circle', { cx: 100, cy: 100, r: 97, fill: 'none', stroke: '#2a3558', 'stroke-width': 6 }, svg);
    const blur = defs.querySelector('feGaussianBlur');
    return { svg, setBlur: (b) => blur.setAttribute('stdDeviation', b.toFixed(2)), content };
  }

  function telescope(container, opts) {
    opts = Object.assign({ tube: 420, kind: 'convex', curv: 8 }, opts);
    const row = h('div', { class: 'tele-row' });
    container.append(row);
    const left = h('div', { class: 'tele-main' });
    const right = h('div', { class: 'tele-side' });
    row.append(left, right);
    const st = new Stage(left, { w: 800, h: 330, label: 'Fernrohr von der Seite: Sternenlicht fällt durch die Linse' });
    const AX = 165, LX = 105, A = 60, TR = 78;
    const XS = LX + opts.tube;
    let kind = opts.kind;
    let R;
    const CMIN2 = 1 / 800, CMAX2 = 1 / 150;
    const vToR = (v) => 1 / (CMIN2 + (v / 1000) * (CMAX2 - CMIN2));
    // Rohr
    s('rect', { x: LX - 18, y: AX - TR - 10, width: XS - LX + 18, height: 10, class: 'tube' }, st.gBg);
    s('rect', { x: LX - 18, y: AX + TR, width: XS - LX + 18, height: 10, class: 'tube' }, st.gBg);
    s('rect', { x: XS, y: AX - 38, width: 46, height: 76, rx: 6, class: 'okular-box' }, st.gBg);
    s('line', { x1: XS, y1: AX - TR, x2: XS, y2: AX + TR, class: 'sensor' }, st.gBg);
    label(st.gBg, XS + 23, AX + 62, 'Okular', 'lbl-small', 'middle');
    label(st.gBg, 8, 22, '☄ Licht vom Kometen (parallel)', 'lbl-small');
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    // Maß
    s('line', { x1: LX, y1: AX + TR + 32, x2: XS, y2: AX + TR + 32, class: 'dim-line' }, st.gBg);
    s('line', { x1: LX, y1: AX + TR + 24, x2: LX, y2: AX + TR + 40, class: 'dim-line' }, st.gBg);
    s('line', { x1: XS, y1: AX + TR + 24, x2: XS, y2: AX + TR + 40, class: 'dim-line' }, st.gBg);
    label(st.gBg, (LX + XS) / 2, AX + TR + 54, `Abstand Linse – Okular: ${fmt(opts.tube / 10, 0)} cm`, 'lbl-small', 'middle');
    const gLens = s('g', null, st.gBody);
    const gMarks = s('g', null, st.gOver);

    const ok = h('div', { class: 'okular' });
    right.append(h('div', { class: 'okular-title' }, 'Blick ins Okular'), ok);
    const view = comet(ok, st.id + '-c');
    const meter = h('div', { class: 'meter' }, h('div', { class: 'meter-bar' }));
    right.append(h('div', { class: 'meter-label' }, 'Bildschärfe'), meter);

    const read = h('div', { class: 'readout' });
    left.append(read);
    const ctr = controls(left);
    const seg = UI.segmented([{ value: 'convex', label: 'Sammellinse' }, { value: 'concave', label: 'Zerstreuungslinse' }], kind, (v) => { kind = v; render(); });
    ctr.append(h('div', { class: 'ctl' }, h('label', null, 'Linsenart'), seg.el));
    const sl = UI.slider({ label: 'Wölbung der Linse (LUMI schleift nach)', min: 0, max: 1000, step: 1, fine: 2, value: opts.curv * 10,
      format: (v) => v < 150 ? 'sehr flach' : v < 350 ? 'flach' : v < 600 ? 'mittel' : v < 850 ? 'stark' : 'sehr stark', onInput: () => render() });
    ctr.append(sl.el);
    let state = {}, solved = false, showLots = true;
    lotToggle(ctr, true, (v) => { showLots = v; render(); });

    function clipToTube(a, b) {
      // Strecke a->b bis zur Sensorebene oder Rohrwand kürzen (nur rechts der Linse)
      let t = 1;
      const d = V.sub(b, a);
      if (b.x > XS && d.x > 0) t = Math.min(t, (XS - a.x) / d.x);
      if (a.x >= LX - 20) {
        if (d.y > 0) t = Math.min(t, (AX + TR - a.y) / d.y);
        if (d.y < 0) t = Math.min(t, (AX - TR - a.y) / d.y);
      }
      if (t < 0) return null;
      return [a, V.add(a, V.mul(d, t))];
    }

    function render() {
      R = vToR(sl.get());
      const body = O.lens({ cx: LX, cy: AX, a: A, R, n: 1.5, kind });
      gLens.innerHTML = '';
      bodyPath(gLens, body, 'mat-glas lens');
      st.gRay.innerHTML = '';
      gMarks.innerHTML = '';
      const ys = [];
      const segs = [];
      const evs = [];
      [-45, -30, -15, 0, 15, 30, 45].forEach((hgt) => {
        const tr = O.trace([body], { x: -5, y: AX + hgt }, { x: 1, y: 0 });
        evs.push(...tr.events);
        tr.segments.forEach((sg) => {
          const c = clipToTube(sg.a, sg.b);
          if (!c) return;
          segs.push({ a: c[0], b: c[1], I: 1, main: true });
          if (Math.abs(c[1].x - XS) < 0.5) ys.push(c[1].y);
        });
      });
      if (showLots) drawLots(st.gRay, evs, 16);
      drawSegs(st, st.gRay, segs, { arrows: true });
      const F = O.focus([body], AX, -5);
      let spot = 200;
      if (ys.length === 7) spot = Math.max(...ys) - Math.min(...ys);
      const f = F ? F.x - LX : null;
      if (F && !F.virtual && F.x < 800) {
        s('circle', { cx: F.x, cy: AX, r: 5, class: 'focus-dot' }, gMarks);
        label(gMarks, F.x, AX - 12, 'F', 'lbl-focus', 'middle');
      }
      const blur = Math.min(16, spot * 0.22);
      view.setBlur(blur);
      const sharp = Math.max(0, Math.min(1, 1 - (spot - 2) / 60));
      meter.firstChild.style.width = (sharp * 100).toFixed(0) + '%';
      meter.classList.toggle('good', spot < 4);
      ok.classList.toggle('sharp', spot < 4);
      if (kind === 'concave') read.innerHTML = 'Die Strahlen laufen auseinander – sie treffen sich nie in einem Punkt. <span class="dim">Der Komet bleibt ein verschwommener Fleck.</span>';
      else read.innerHTML = `Brennweite <span class="pill pill-f">f ≈ ${fmt(f / 10, 1)} cm</span> · Abstand zum Okular <span class="pill">${fmt(opts.tube / 10, 0)} cm</span>` + (spot < 4 ? ' <b class="ok">Scharf!</b>' : '');
      state = { kind, f, spot, R };
      if (!solved && kind === 'convex' && spot < 4) { solved = true; opts.onFocus && opts.onFocus(state); }
      opts.onChange && opts.onChange(state);
    }
    render();
    return { stage: st, get state() { return state; } };
  }

  /* =========================================================
     7) Statisches Brechungsbild (Fachbegriffe, Beschriftung)
     ========================================================= */
  function diagram(container, opts) {
    opts = Object.assign({ alpha: 50, mode: 'explain', slider: false }, opts);
    const st = new Stage(container, { w: 800, h: 420, label: 'Lichtstrahl trifft schräg auf eine Grenzfläche von Luft und Glas' });
    const P = { x: 400, y: 200 };
    let alpha = opts.alpha;
    s('rect', { x: 0, y: P.y, width: 800, height: 220, class: 'body mat-glas flat' }, st.gBody);
    s('line', { x1: 0, y1: P.y, x2: 800, y2: P.y, class: 'boundary' }, st.gBody);
    s('line', { x1: P.x, y1: 20, x2: P.x, y2: 400, class: 'lot' }, st.gBg);
    const gDyn = s('g', null, st.gOver);
    const zones = {};
    function render() {
      st.gRay.innerHTML = '';
      gDyn.innerHTML = '';
      const beta = O.snell(alpha, 1, 1.5);
      const din = { x: Math.sin(alpha * DEG), y: Math.cos(alpha * DEG) };
      const A0 = V.sub(P, V.mul(din, 230));
      const dout = { x: Math.sin(beta * DEG), y: Math.cos(beta * DEG) };
      const B0 = V.add(P, V.mul(dout, 230));
      drawSegs(st, st.gRay, [{ a: A0, b: P, I: 1, main: true }, { a: P, b: B0, I: 1, main: true }]);
      const aIn = V.angle(V.sub(A0, P)), aOut = V.angle(dout);
      if (opts.mode === 'angles4') {
        angleArc(gDyn, P, 70, -90, aIn, 'arc-alpha', '1');
        angleArc(gDyn, P, 105, 180, aIn, 'arc-x', '2');
        angleArc(gDyn, P, 80, 90, aOut, 'arc-beta', '3');
        angleArc(gDyn, P, 120, 0, aOut, 'arc-x', '4');
        return;
      }
      angleArc(gDyn, P, 70, -90, aIn, 'arc-alpha', opts.mode === 'explain' ? 'α' : '');
      angleArc(gDyn, P, 85, 90, aOut, 'arc-beta', opts.mode === 'explain' ? 'β' : '');
      const mIn = V.mul(V.add(A0, P), 0.5), mOut = V.mul(V.add(P, B0), 0.5);
      const arcPos = (r, a1, a2) => { const ar = arcPath(P, r, a1, a2); return { x: P.x + (r + 16) * Math.cos(ar.mid * DEG), y: P.y + (r + 16) * Math.sin(ar.mid * DEG) }; };
      Object.assign(zones, {
        einfallend: { x: mIn.x - 70, y: mIn.y - 10 },
        gebrochen: { x: mOut.x + 70, y: mOut.y + 6 },
        lot: { x: P.x, y: 45 },
        grenz: { x: 690, y: P.y },
        alpha: arcPos(70, -90, aIn),
        beta: arcPos(85, 90, aOut),
        luft: { x: 90, y: 60 },
        glas: { x: 90, y: 360 },
      });
      if (opts.mode === 'explain') {
        label(gDyn, mIn.x - 18, mIn.y - 6, 'einfallender Strahl', 'lbl-ray', 'end');
        label(gDyn, mOut.x + 18, mOut.y + 10, 'gebrochener Strahl', 'lbl-ray');
        label(gDyn, P.x + 10, 40, 'Einfallslot', 'lbl-lot');
        label(gDyn, 790, P.y - 10, 'Grenzfläche', 'lbl-small', 'end');
        label(gDyn, 30, 40, 'Luft', 'lbl-air');
        label(gDyn, 30, 395, 'Glas', 'lbl-glass');
        s('rect', { x: P.x, y: P.y - 14, width: 14, height: 14, class: 'right-angle' }, gDyn);
        label(gDyn, P.x + 18, P.y - 18, '90°', 'lbl-small');
      }
    }
    render();
    let sl = null;
    if (opts.slider) {
      const read = h('div', { class: 'readout' });
      container.append(read);
      const ctr = controls(container);
      const upd = () => {
        const b = O.snell(alpha, 1, 1.5);
        read.innerHTML = `<span class="pill pill-alpha">α = ${alpha}°</span> <span class="pill pill-beta">β = ${fmt(b, 0)}°</span>`;
      };
      sl = UI.slider({ label: 'Einfallswinkel α', min: 0, max: 85, step: 1, value: alpha, format: (v) => v + '°', onInput: (v) => { alpha = v; render(); upd(); } });
      ctr.append(sl.el);
      upd();
    }
    return { stage: st, zones };
  }

  window.Sims = { Stage, target, disc, bench, lensBench, thinLens, telescope, diagram, comet, MATERIALS, drawSegs, drawLaser, crystal, label };
})();
