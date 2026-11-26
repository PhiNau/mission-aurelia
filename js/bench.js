/* =========================================================
   bench.js – Teil 2: Optische Bank mit dünnen Linsen und Spiegeln
   (paraxiale Näherung, so wie Strahlengänge im Unterricht gezeichnet werden)
   ========================================================= */
(function () {
  'use strict';
  const { s, h, fmt } = UI;
  const O = Optics;
  const V = O.V;
  const DEG = O.DEG;
  const { Stage, drawSegs, label } = Sims;

  function controls(block) { const c = h('div', { class: 'controls' }); block.append(c); return c; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Strahlverfolgung durch dünne Elemente ----------
     el: { type: 'lens'|'mirror'|'screen', x, f, a } */
  function ptrace(els, P, d, AX) {
    const segs = [];
    let p = P;
    d = V.norm(d);
    let end = null, blocked = false, hitScreen = null;
    for (let k = 0; k < 12; k++) {
      const sx = Math.sign(d.x);
      if (!sx) break;
      let best = null;
      for (const e of els) {
        const dx = (e.x - p.x) * sx;
        if (dx > 1e-6 && (!best || dx < (best.x - p.x) * sx)) best = e;
      }
      if (!best) { segs.push({ a: p, b: V.add(p, V.mul(d, 2400)), I: 1, main: true, open: true }); end = { p, d }; break; }
      const t = (best.x - p.x) / d.x;
      const q = V.add(p, V.mul(d, t));
      segs.push({ a: p, b: q, I: 1, main: true });
      const rel = q.y - AX;
      if (best.type === 'screen') { hitScreen = q; end = { p: q, d }; break; }
      if (Math.abs(rel) > best.a) { blocked = true; end = { p: q, d }; break; }
      const m = d.y / Math.abs(d.x);
      const m2 = m - rel / best.f;
      d = V.norm({ x: best.type === 'mirror' ? -sx : sx, y: m2 });
      p = q;
    }
    return { segs, end, blocked, hitScreen };
  }

  /* Bildpunkt eines Gegenstandspunkts (reell oder virtuell) */
  function imageOf(els, tip, AX) {
    const open = els.filter((e) => e.type !== 'screen').map((e) => Object.assign({}, e, { a: 1e9 }));
    const first = open.slice().sort((a, b) => a.x - b.x).find((e) => e.x > tip.x);
    if (!first) return null;
    const r1 = ptrace(open, tip, { x: 1, y: 0 }, AX);
    const aim = Math.abs(tip.y - AX) < 0.5 ? { x: first.x - tip.x, y: 25 } : { x: first.x - tip.x, y: AX - tip.y };
    const r2 = ptrace(open, tip, aim, AX);
    if (!r1.end || !r2.end) return null;
    const p1 = r1.end.p, d1 = r1.end.d, p2 = r2.end.p, d2 = r2.end.d;
    const den = V.cross(d1, d2);
    if (Math.abs(den) < 1e-9) return { inf: true };
    const t1 = V.cross(V.sub(p2, p1), d2) / den;
    return { p: V.add(p1, V.mul(d1, t1)), real: t1 > 0, inf: false };
  }

  /* ---------- Zeichnen ---------- */
  function lensShape(g, x, AX, f, a, cls) {
    const t = clamp(1600 / Math.abs(f), 5, 30);
    let d;
    if (f > 0) d = `M${x} ${AX - a} Q${x - t} ${AX} ${x} ${AX + a} Q${x + t} ${AX} ${x} ${AX - a} Z`;
    else d = `M${x - t / 2 - 3} ${AX - a} L${x + t / 2 + 3} ${AX - a} Q${x + 2} ${AX} ${x + t / 2 + 3} ${AX + a} L${x - t / 2 - 3} ${AX + a} Q${x - 2} ${AX} ${x - t / 2 - 3} ${AX - a} Z`;
    return s('path', { d, class: 'body mat-glas lens ' + (cls || '') }, g);
  }
  function focusMark(g, x, AX, txt, up) {
    s('circle', { cx: x, cy: AX, r: 4.5, class: 'focus-dot' }, g);
    if (txt) label(g, x, AX + (up ? -10 : 22), txt, 'lbl-focus small', 'middle');
  }
  function arrowObj(g, x, AX, hgt, cls) {
    const y2 = AX - hgt;
    const dir = Math.sign(hgt) || 1;
    s('line', { x1: x, y1: AX, x2: x, y2: y2 + dir * 6, class: 'obj-line ' + (cls || '') }, g);
    s('path', { d: `M${x} ${y2} l-6 ${dir * 11} l12 0 Z`, class: 'obj-head ' + (cls || '') }, g);
  }
  function candle(g, x, AX, hgt, cls) {
    const gg = s('g', { class: 'candle ' + (cls || '') }, g);
    const sg = Math.sign(hgt);
    const H = Math.abs(hgt);
    const body = H * 0.72;
    const y0 = AX, yTop = AX - sg * body;
    s('rect', { x: x - 7, y: Math.min(y0, yTop), width: 14, height: body, rx: 2, class: 'candle-body' }, gg);
    s('line', { x1: x, y1: yTop, x2: x, y2: yTop - sg * 4, class: 'candle-wick' }, gg);
    s('path', { d: `M${x} ${AX - hgt} Q${x + 8} ${yTop - sg * H * 0.12} ${x} ${yTop - sg * 4} Q${x - 8} ${yTop - sg * H * 0.12} ${x} ${AX - hgt} Z`, class: 'candle-flame' }, gg);
    return gg;
  }
  function eyeIcon(g, x, y, sc) {
    sc = sc || 1;
    const gg = s('g', { transform: `translate(${x} ${y}) scale(${sc})`, class: 'eye-icon' }, g);
    s('path', { d: 'M-22 0 Q0 -18 22 0 Q0 18 -22 0 Z', class: 'eye-white' }, gg);
    s('circle', { cx: -4, cy: 0, r: 8, class: 'eye-iris' }, gg);
    s('circle', { cx: -5, cy: 0, r: 3.5, class: 'eye-pupil' }, gg);
    return gg;
  }

  /* kleines Bildfenster in der Bühne (z. B. „Bild auf dem Schirm“) */
  let insetId = 0;
  function inset(st, o) {
    const id = st.id + '-in' + (++insetId);
    const g = s('g', { class: 'inset' }, st.gUi);
    const cp = s('clipPath', { id: id + '-c' }, st.defs);
    s('rect', { x: o.x, y: o.y, width: o.w, height: o.h, rx: 10 }, cp);
    const f = s('filter', { id: id + '-b', x: '-50%', y: '-50%', width: '200%', height: '200%' }, st.defs);
    const blur = s('feGaussianBlur', { stdDeviation: 0 }, f);
    s('rect', { x: o.x, y: o.y, width: o.w, height: o.h, rx: 10, class: 'inset-bg ' + (o.bg || '') }, g);
    const inner = s('g', { 'clip-path': `url(#${id}-c)` }, g);
    const content = s('g', { filter: `url(#${id}-b)` }, inner);
    s('rect', { x: o.x, y: o.y, width: o.w, height: o.h, rx: 10, class: 'inset-frame' }, g);
    s('text', { x: o.x + 8, y: o.y + o.h - 8, class: 'inset-title', text: o.title }, g);
    return {
      cx: o.x + o.w / 2, cy: o.y + (o.h - 14) / 2,
      clear() { content.innerHTML = ''; },
      g: content,
      setBlur(b) { blur.setAttribute('stdDeviation', clamp(b, 0, 20).toFixed(2)); },
      setDim(v) { content.setAttribute('opacity', v.toFixed(2)); },
    };
  }

  /* Motive für die Bildfenster, um (0,0) zentriert, Höhe ca. 1 = „Einheit“ */
  const MOTIF = {
    candle(g, sc) {
      s('rect', { x: -6 * sc, y: -10 * sc, width: 12 * sc, height: 30 * sc, rx: 2 * sc, fill: '#f3e3c3' }, g);
      s('path', { d: `M0 ${-30 * sc} Q${7 * sc} ${-18 * sc} 0 ${-11 * sc} Q${-7 * sc} ${-18 * sc} 0 ${-30 * sc} Z`, fill: '#ffb000' }, g);
      s('circle', { cx: 0, cy: -19 * sc, r: 3 * sc, fill: '#fff3b0' }, g);
    },
    tree(g, sc) {
      s('rect', { x: -3 * sc, y: 4 * sc, width: 6 * sc, height: 16 * sc, fill: '#8a5a2b' }, g);
      s('circle', { cx: 0, cy: -6 * sc, r: 13 * sc, fill: '#3fbf6f' }, g);
      s('circle', { cx: -7 * sc, cy: 1 * sc, r: 8 * sc, fill: '#33a35d' }, g);
      s('circle', { cx: 6 * sc, cy: -14 * sc, r: 3 * sc, fill: '#ff5a5a' }, g);
    },
    letters(g, sc) {
      s('rect', { x: -24 * sc, y: -16 * sc, width: 48 * sc, height: 32 * sc, rx: 3 * sc, fill: '#fbfaf6' }, g);
      s('text', { x: 0, y: 8 * sc, 'text-anchor': 'middle', 'font-size': 22 * sc, 'font-weight': 800, fill: '#1d2340', text: 'Ab' }, g);
    },
    ant(g, sc) {
      s('ellipse', { cx: -9 * sc, cy: 0, rx: 6 * sc, ry: 5 * sc, fill: '#3b2a20' }, g);
      s('ellipse', { cx: 2 * sc, cy: 0, rx: 4 * sc, ry: 3.5 * sc, fill: '#3b2a20' }, g);
      s('ellipse', { cx: 12 * sc, cy: -1 * sc, rx: 5 * sc, ry: 4 * sc, fill: '#3b2a20' }, g);
      s('path', { d: `M-4 ${-2 * sc} l${-6 * sc} ${-8 * sc} M2 ${2 * sc} l${-4 * sc} ${9 * sc} M2 ${-2 * sc} l${3 * sc} ${-9 * sc} M6 ${2 * sc} l${6 * sc} ${8 * sc} M15 ${-4 * sc} l${6 * sc} ${-8 * sc}`, stroke: '#3b2a20', 'stroke-width': 1.5 * sc, fill: 'none' }, g);
    },
    tower(g, sc) {
      s('rect', { x: -40 * sc, y: 18 * sc, width: 80 * sc, height: 6 * sc, fill: '#3fbf6f' }, g);
      s('rect', { x: -7 * sc, y: -12 * sc, width: 14 * sc, height: 30 * sc, fill: '#d8c7a8' }, g);
      s('path', { d: `M${-9 * sc} ${-12 * sc} L0 ${-30 * sc} L${9 * sc} ${-12 * sc} Z`, fill: '#c0392b' }, g);
      s('line', { x1: 0, y1: -30 * sc, x2: 0, y2: -40 * sc, stroke: '#ddd', 'stroke-width': 1.5 * sc }, g);
      s('path', { d: `M0 ${-40 * sc} l${11 * sc} ${3 * sc} l${-11 * sc} ${3 * sc} Z`, fill: '#ffd34d' }, g);
      s('rect', { x: -3 * sc, y: 2 * sc, width: 6 * sc, height: 9 * sc, rx: 3 * sc, fill: '#5a4a3a' }, g);
    },
    cells(g, sc) {
      for (let i = -2; i <= 2; i++) {
        for (let j = -1; j <= 1; j++) {
          const x = i * 22 * sc + (j % 2 ? 11 * sc : 0), y = j * 14 * sc;
          s('rect', { x: x - 10 * sc, y: y - 6 * sc, width: 20 * sc, height: 12 * sc, rx: 3 * sc, fill: 'rgba(200,255,200,.25)', stroke: '#9be59b', 'stroke-width': 1.2 * sc }, g);
          s('circle', { cx: x + 3 * sc, cy: y, r: 2.4 * sc, fill: '#7a5ac8' }, g);
        }
      }
    },
  };
  function drawMotif(ins, name, scale, flip, extra) {
    ins.clear();
    const t = s('g', { transform: `translate(${ins.cx} ${ins.cy}) scale(${flip ? -1 : 1} ${flip ? -1 : 1})` }, ins.g);
    MOTIF[name](t, scale);
    if (extra) extra(t);
  }

  /* =========================================================
     A) Bildentstehung an der Sammellinse (Kerze, Linse, Schirm)
     ========================================================= */
  function imaging(container, opts) {
    opts = Object.assign({ g: 250, xs: 680, construct: false }, opts);
    const st = new Stage(container, { w: 800, h: 440, interactive: true, label: 'Kerze, Sammellinse und Schirm auf einer optischen Bank' });
    const AX = 250, LX = 420, f = 100, A = 90, H = 60;
    let g = opts.g, XS = opts.xs, construct = opts.construct;
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    lensShape(st.gBody, LX, AX, f, A);
    [[LX - f, 'F'], [LX + f, 'F'], [LX - 2 * f, '2F'], [LX + 2 * f, '2F']].forEach(([x, t]) => focusMark(st.gBg, x, AX, t));
    const gObj = s('g', null, st.gOver);
    const gCon = s('g', null, st.gOver);
    const gScreen = s('g', null, st.gOver);
    const gDim = s('g', null, st.gOver);
    const ins = inset(st, { x: 10, y: 10, w: 170, h: 130, title: 'Bild auf dem Schirm' });

    const read = h('div', { class: 'readout' });
    st.block.append(read);
    const ctr = controls(st.block);
    const slG = UI.slider({ label: 'Gegenstandsweite g (Kerze – Linse)', min: 3, max: 38, step: 0.1, fine: 0.5, value: g / 10, format: (v) => fmt(v, 1) + ' cm', onInput: (v) => { g = v * 10; render(); } });
    const slS = UI.slider({ label: 'Schirmabstand (Linse – Schirm)', min: 3, max: 37, step: 0.1, fine: 0.1, value: (XS - LX) / 10, format: (v) => fmt(v, 1) + ' cm', onInput: (v) => { XS = LX + v * 10; render(); } });
    ctr.append(slG.el, slS.el);
    if (opts.allowConstruct !== false) UI.toggle && ctr.append(UI.toggle('Konstruktion mit besonderen Strahlen', construct, (v) => { construct = v; render(); }).el);
    let state = {};

    function render() {
      const tip = { x: LX - g, y: AX - H };
      const lens = { type: 'lens', x: LX, f, a: A };
      const scr = { type: 'screen', x: XS, a: 400 };
      gObj.innerHTML = ''; gCon.innerHTML = ''; gScreen.innerHTML = ''; gDim.innerHTML = '';
      st.gRay.innerHTML = '';
      candle(gObj, tip.x, AX, H);
      s('rect', { x: tip.x - 28, y: AX - H - 20, width: 56, height: H + 40, rx: 10, class: 'drag-handle hit grip', 'data-h': 'g' }, gObj);
      // Lichtbündel von der Flammenspitze
      const segs = [], ys = [];
      for (let k = 0; k < 7; k++) {
        const ty = AX - A * 0.88 + k * (1.76 * A / 6);
        const tr = ptrace([lens, scr], tip, { x: LX - tip.x, y: ty - tip.y }, AX);
        segs.push(...tr.segs);
        if (tr.hitScreen) ys.push(tr.hitScreen.y);
      }
      drawSegs(st, st.gRay, segs, { arrows: false, width: 1.8 });
      const spot = ys.length === 7 ? Math.max(...ys) - Math.min(...ys) : 999;
      // Schirm
      s('rect', { x: XS, y: AX - 170, width: 8, height: 340, rx: 2, class: 'screen' }, gScreen);
      s('rect', { x: XS - 22, y: AX - 170, width: 52, height: 340, rx: 10, class: 'drag-handle hit grip', 'data-h': 's' }, gScreen);
      if (ys.length) s('line', { x1: XS - 1, y1: Math.min(...ys), x2: XS - 1, y2: Math.max(...ys), class: 'screen-spot' }, gScreen);
      label(gScreen, XS + 4, AX + 190, 'Schirm', 'lbl-small', 'middle');
      // Bild
      const img = imageOf([lens], tip, AX);
      const real = g > f + 0.5;
      const bImg = real && img && !img.inf ? img.p.x - LX : null;
      const m = bImg ? bImg / g : null;
      if (construct) {
        const big = { type: 'lens', x: LX, f, a: 1e9 };
        const dirs = [{ x: 1, y: 0 }, V.sub({ x: LX, y: AX }, tip)];
        if (Math.abs(g - f) > 3) dirs.push(g > f ? V.sub({ x: LX - f, y: AX }, tip) : V.sub(tip, { x: LX - f, y: AX }));
        dirs.forEach((dd, i) => {
          const tr = ptrace([big], tip, dd, AX);
          tr.segs.forEach((sg) => s('line', { x1: sg.a.x, y1: sg.a.y, x2: sg.b.x, y2: sg.b.y, class: 'con-ray c' + i }, gCon));
          if (img && !img.inf && !img.real && tr.end) s('line', { x1: tr.end.p.x, y1: tr.end.p.y, x2: img.p.x, y2: img.p.y, class: 'con-ray dashed c' + i }, gCon);
        });
        if (img && !img.inf && Math.abs(img.p.x) < 2000) {
          const ih = AX - img.p.y;
          if (Math.abs(ih) < 400) arrowObj(gCon, img.p.x, AX, ih, img.real ? 'img-real' : 'img-virtual');
        }
      }
      // Maße
      const yD = AX + 120;
      s('line', { x1: tip.x, y1: yD, x2: LX, y2: yD, class: 'dim-line' }, gDim);
      label(gDim, (tip.x + LX) / 2, yD - 6, 'g', 'lbl-f', 'middle');
      s('line', { x1: LX, y1: yD + 26, x2: XS, y2: yD + 26, class: 'dim-line alt' }, gDim);
      label(gDim, (LX + XS) / 2, yD + 20, 'Schirm', 'lbl-small', 'middle');
      // Bildfenster
      const sharp = real && spot < 5;
      if (real) {
        drawMotif(ins, 'candle', clamp((m || 1) * 2.4, 0.6, 3.4), true);
        ins.setBlur(spot * 0.18);
        ins.setDim(clamp(1.2 - spot / 160, 0.25, 1));
      } else {
        ins.clear();
        s('circle', { cx: ins.cx, cy: ins.cy, r: 55, fill: '#ffcf6b', opacity: 0.25 }, ins.g);
        ins.setBlur(14); ins.setDim(1);
      }
      let txt = `<span class="pill">g = ${fmt(g / 10, 1)} cm</span> <span class="pill">Schirm: ${fmt((XS - LX) / 10, 1)} cm</span>`;
      if (!real) txt += ' <span class="pill pill-warn">Kein Bild auf dem Schirm – die Strahlen laufen auseinander</span>';
      else if (sharp) txt += ` <b class="ok">Scharfes Bild!</b> ${m > 1.05 ? 'vergrößert' : m < 0.95 ? 'verkleinert' : 'gleich groß'}, umgekehrt`;
      else txt += ' <span class="dim">unscharf</span>';
      read.innerHTML = txt;
      state = { g: g / 10, b: (XS - LX) / 10, sharp, real, m, bImg: bImg && bImg / 10, spot, construct };
      opts.onChange && opts.onChange(state);
    }
    st.pointer({
      move: (p, e, drag) => {
        if (drag === 'g') { g = clamp(Math.round(LX - p.x), 30, 380); slG.set(g / 10, false); }
        if (drag === 's') { XS = clamp(Math.round(p.x), LX + 30, LX + 370); slS.set((XS - LX) / 10, false); }
        render();
      },
    });
    render();
    return { stage: st, get state() { return state; } };
  }

  /* =========================================================
     B) Das Auge (Akkommodation, Sehfehler, Brille)
     ========================================================= */
  const EYES = {
    normal: { b: 170, fmin: 80, name: 'normalsichtig' },
    kurz: { b: 215, fmin: 80, name: 'kurzsichtig' },
    weit: { b: 135, fmin: 112, name: 'weitsichtig' },
  };
  function drawEye(g, LXe, AX, b, fEye, opt) {
    opt = opt || {};
    const x0 = LXe - 45, x1 = LXe + b + 4;
    const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2, ry = 112;
    s('ellipse', { cx, cy: AX, rx, ry, class: 'eye-sclera' }, g);
    s('path', { d: `M${LXe - 30} ${AX - 55} Q${LXe - 78} ${AX} ${LXe - 30} ${AX + 55}`, class: 'eye-cornea' }, g);
    // Netzhaut
    const a0 = 55;
    const p1 = { x: cx + rx * Math.cos(a0 * DEG), y: AX - ry * Math.sin(a0 * DEG) };
    const p2 = { x: cx + rx * Math.cos(a0 * DEG), y: AX + ry * Math.sin(a0 * DEG) };
    s('path', { d: `M${p1.x} ${p1.y} A${rx} ${ry} 0 0 1 ${p2.x} ${p2.y}`, class: 'eye-retina' }, g);
    // Sehnerv
    s('path', { d: `M${x1 - 6} ${AX + 14} L${x1 + 40} ${AX + 34} L${x1 + 40} ${AX + 56} L${x1 - 10} ${AX + 40} Z`, class: 'eye-nerve' }, g);
    // Iris
    s('line', { x1: LXe - 12, y1: AX - 30, x2: LXe - 12, y2: AX - 62, class: 'eye-irisline' }, g);
    s('line', { x1: LXe - 12, y1: AX + 30, x2: LXe - 12, y2: AX + 62, class: 'eye-irisline' }, g);
    // Linse + Ziliarmuskel
    const lt = clamp(4 + 1500 / fEye, 10, 26);
    s('ellipse', { cx: LXe, cy: AX, rx: lt, ry: 36, class: 'eye-lens' }, g);
    s('ellipse', { cx: LXe, cy: AX - 46, rx: 7, ry: 9, class: 'eye-muscle' }, g);
    s('ellipse', { cx: LXe, cy: AX + 46, rx: 7, ry: 9, class: 'eye-muscle' }, g);
    if (opt.labels) {
      label(g, LXe - 92, AX - 64, 'Hornhaut', 'lbl-small', 'end');
      label(g, LXe - 12, AX - 72, 'Iris', 'lbl-small', 'middle');
      label(g, LXe, AX + 62, 'Linse', 'lbl-small', 'middle');
      label(g, cx + 20, AX - 64, 'Glaskörper', 'lbl-small', 'middle');
      label(g, x1 + 8, AX - 70, 'Netzhaut', 'lbl-small');
      label(g, x1 + 44, AX + 72, 'Sehnerv', 'lbl-small', 'middle');
    }
    return { zones: {
      hornhaut: { x: LXe - 92, y: AX + 52 },
      iris: { x: LXe - 12, y: AX - 82 },
      linse: { x: LXe, y: AX },
      glas: { x: cx + 28, y: AX - 52 },
      netz: { x: x1 + 10, y: AX - 88 },
      nerv: { x: x1 + 52, y: AX + 80 },
    } };
  }

  function eye(container, opts) {
    opts = Object.assign({ mode: 'manual', type: 'normal', object: 'far', objects: true, glasses: false, types: false, rays: true, labels: false }, opts);
    const st = new Stage(container, { w: 640, h: 380, label: 'Schnitt durch ein Auge mit Lichtstrahlen' });
    const AX = 200, LXe = 345, XG = LXe - 110, U0 = 300;
    let type = opts.type, object = opts.object, P = 0, curv = 0;
    s('line', { x1: 0, y1: AX, x2: 640, y2: AX, class: 'axis faint' }, st.gBg);
    const gEye = s('g', null, st.gBody);
    const gObj = s('g', null, st.gOver);
    const ins = opts.static ? null : inset(st, { x: 10, y: 10, w: 160, h: 125, title: 'Bild auf der Netzhaut', bg: 'retina' });
    const read = h('div', { class: 'readout' });
    let zones = null;
    if (!opts.static) st.block.append(read);
    const ctr = opts.static ? h('div') : controls(st.block);
    if (opts.objects && !opts.static) {
      const seg = UI.segmented([{ value: 'far', label: '🌳 Baum (weit weg)' }, { value: 'near', label: '📖 Buch (nah)' }], object, (v) => { object = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, h('label', null, 'Was schaut das Auge an?'), seg.el));
    }
    if (opts.types) {
      const seg = UI.segmented(Object.keys(EYES).map((k) => ({ value: k, label: EYES[k].name })), type, (v) => { type = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, h('label', null, 'Auge'), seg.el));
    }
    let slC = null;
    if (opts.mode === 'manual' && !opts.static) {
      slC = UI.slider({ label: 'Augenlinse (Ziliarmuskel)', min: 0, max: 100, step: 1, value: 0, format: (v) => v < 10 ? 'entspannt, flach' : v < 50 ? 'etwas gewölbt' : v < 85 ? 'stark gewölbt' : 'maximal gewölbt', onInput: (v) => { curv = v; render(); } });
      ctr.append(slC.el);
    }
    let slP = null;
    if (opts.glasses) {
      slP = UI.slider({ label: 'Brille: Linse und Stärke', min: -6, max: 6, step: 0.25, value: 0, format: (v) => v === 0 ? 'keine Brille' : `${v > 0 ? '+' : '−'}${fmt(Math.abs(v), 2)} dpt (${v > 0 ? 'Sammellinse' : 'Zerstreuungslinse'})`, onInput: (v) => { P = v; render(); } });
      ctr.append(slP.el);
    }
    let state = {};

    function render() {
      const E = EYES[type];
      const els = [];
      const fg = P !== 0 ? 1000 / P : null;
      if (fg) els.push({ type: 'lens', x: XG, f: fg, a: 70 });
      const src = object === 'far' ? null : { x: LXe - U0, y: AX };
      // Augenlinse: von Hand oder automatisch scharf stellen (im möglichen Bereich)
      let fEye;
      const range = [E.fmin, 170];
      if (opts.mode === 'manual') fEye = 1 / (1 / 170 + (curv / 100) * (1 / E.fmin - 1 / 170));
      else {
        let invU = 0;
        if (src || fg) {
          const im = src ? imageOf(els.concat([{ type: 'lens', x: LXe + 2000, f: 1e9, a: 1e9 }]), { x: src.x, y: AX - 1 }, AX) : null;
          if (src && fg) { if (im && !im.inf) invU = 1 / (LXe - im.p.x); }
          else if (src) invU = 1 / U0;
          else if (fg) invU = 1 / (LXe - (XG + fg)); // paralleles Licht nach der Brille: Brennpunkt der Brille
        }
        const need = 1 / E.b + invU;
        fEye = 1 / clamp(need, 1 / range[1], 1 / range[0]);
      }
      els.push({ type: 'lens', x: LXe, f: fEye, a: 26 });
      els.push({ type: 'screen', x: LXe + E.b, a: 300 });
      gEye.innerHTML = '';
      const drawn = drawEye(gEye, LXe, AX, E.b, fEye, { labels: opts.labels });
      zones = drawn.zones;
      if (fg) {
        lensShape(gEye, XG, AX, fg, 70, 'glasses');
        s('path', { d: `M${XG} ${AX - 74} L${XG + 40} ${AX - 92} L${LXe + 60} ${AX - 100}`, class: 'glasses-frame' }, gEye);
        label(gEye, XG, AX + 92, 'Brille', 'lbl-small', 'middle');
      }
      gObj.innerHTML = '';
      st.gRay.innerHTML = '';
      const segs = [], ys = [];
      if (opts.rays) {
        for (let k = 0; k < 5; k++) {
          const hy = -20 + k * 10;
          let tr;
          if (!src) tr = ptrace(els, { x: 0, y: AX + hy * (fg ? 1.6 : 1) }, { x: 1, y: 0 }, AX);
          else tr = ptrace(els, src, { x: LXe - src.x, y: hy * (fg ? 1.3 : 1) }, AX);
          segs.push(...tr.segs);
          if (tr.hitScreen) ys.push(tr.hitScreen.y);
        }
        drawSegs(st, st.gRay, segs, { arrows: false, width: 1.8 });
      }
      if (src) {
        s('rect', { x: src.x - 6, y: AX - 30, width: 12, height: 60, rx: 2, class: 'book' }, gObj);
        label(gObj, src.x, AX + 52, 'Buch (nah)', 'lbl-small', 'middle');
      } else if (!opts.static) {
        label(gObj, 12, AX + 70, '← Licht vom Baum (weit weg)', 'lbl-small');
      }
      const spot = ys.length >= 3 ? Math.max(...ys) - Math.min(...ys) : 99;
      const sharp = spot < 2.2;
      if (ins) {
        drawMotif(ins, object === 'far' ? 'tree' : 'letters', 1.9, true);
        ins.setBlur(spot * 0.55);
      }
      // Wo liegt das scharfe Bild?
      const im = imageOf(els.filter((e) => e.type !== 'screen'), { x: src ? src.x : -1e6, y: AX - 1 }, AX);
      let where = '';
      if (!sharp && im && !im.inf && im.real) where = im.p.x < LXe + E.b ? 'vor der Netzhaut' : 'hinter der Netzhaut';
      if (!sharp && im && !im.real) where = 'hinter der Netzhaut';
      if (!opts.static) {
        let t = sharp ? '<b class="ok">Scharf!</b> Das Bild auf der Netzhaut ist scharf.' : `<span class="pill pill-warn">unscharf</span> Das scharfe Bild läge <b>${where}</b>.`;
        if (opts.mode === 'auto') t += ` <span class="dim">(Das Auge stellt so gut scharf, wie es kann.)</span>`;
        read.innerHTML = t;
      }
      state = { sharp, spot, where, type, object, P, fEye, curv };
      opts.onChange && opts.onChange(state);
    }
    render();
    return { stage: st, get state() { return state; }, get zones() { return zones; } };
  }

  /* =========================================================
     C) Lupe
     ========================================================= */
  function magnifier(container, opts) {
    opts = Object.assign({ g: 240 }, opts);
    const st = new Stage(container, { w: 800, h: 440, interactive: true, label: 'Ameise, Lupe und Auge' });
    const AX = 260, LX = 500, f = 160, A = 110, H = 22;
    let g = opts.g;
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    lensShape(st.gBody, LX, AX, f, A);
    focusMark(st.gBg, LX - f, AX, 'F'); focusMark(st.gBg, LX + f, AX, 'F');
    eyeIcon(st.gBg, LX + 200, AX, 1.3);
    label(st.gBg, LX + 200, AX + 40, 'Auge', 'lbl-small', 'middle');
    const gObj = s('g', null, st.gOver), gCon = s('g', null, st.gOver);
    const ins = inset(st, { x: 10, y: 10, w: 170, h: 130, title: 'Was das Auge sieht', bg: 'paper' });
    const read = h('div', { class: 'readout' });
    st.block.append(read);
    const ctr = controls(st.block);
    const sl = UI.slider({ label: 'Abstand Ameise – Lupe', min: 3, max: 30, step: 0.1, fine: 0.5, value: g / 10, format: (v) => fmt(v, 1) + ' cm', onInput: (v) => { g = v * 10; render(); } });
    ctr.append(sl.el);
    let state = {};
    function render() {
      gObj.innerHTML = ''; gCon.innerHTML = ''; st.gRay.innerHTML = '';
      const tip = { x: LX - g, y: AX - H };
      arrowObj(gObj, tip.x, AX, H, 'ant');
      s('rect', { x: tip.x - 26, y: AX - H - 22, width: 52, height: H + 44, rx: 10, class: 'drag-handle hit grip', 'data-h': 'g' }, gObj);
      label(gObj, tip.x, AX + 22, 'Ameise', 'lbl-small', 'middle');
      const lens = { type: 'lens', x: LX, f, a: A };
      const dirs = [{ x: 1, y: 0 }, V.sub({ x: LX, y: AX }, tip)];
      const segs = [];
      const ends = [];
      dirs.forEach((d) => { const tr = ptrace([lens], tip, d, AX); segs.push(...tr.segs); ends.push(tr.end); });
      drawSegs(st, st.gRay, segs, { width: 2 });
      const img = imageOf([lens], tip, AX);
      let M = null, virt = false;
      if (img && !img.inf) {
        const ih = AX - img.p.y;
        M = ih / H;
        virt = !img.real;
        if (virt) {
          ends.forEach((e) => s('line', { x1: e.p.x, y1: e.p.y, x2: img.p.x, y2: img.p.y, class: 'con-ray dashed c0' }, gCon));
          if (img.p.x > -400) { arrowObj(gCon, img.p.x, AX, ih, 'img-virtual'); label(gCon, Math.max(70, img.p.x), AX + 22, 'Bild (scheinbar)', 'lbl-small', 'middle'); }
        } else if (img.p.x < 800 && Math.abs(ih) < 250) arrowObj(gCon, img.p.x, AX, ih, 'img-real');
      }
      if (virt) { drawMotif(ins, 'ant', clamp(M * 0.9, 0.9, 7), false); ins.setBlur(0); }
      else if (M) { drawMotif(ins, 'ant', clamp(Math.abs(M) * 0.6, 0.6, 3), true); ins.setBlur(6); }
      else { drawMotif(ins, 'ant', 6, false); ins.setBlur(2); }
      let t = `<span class="pill">g = ${fmt(g / 10, 1)} cm</span> `;
      if (virt) t += `Die Ameise erscheint <b>${fmt(M, 1)}-mal</b> so groß, aufrecht.`;
      else if (M) t += '<span class="pill pill-warn">Die Strahlen treffen sich hinter der Lupe – das Auge sieht kein klares, vergrößertes Bild.</span>';
      else t += 'Die Strahlen laufen parallel – das Bild liegt „im Unendlichen“.';
      read.innerHTML = t;
      state = { g: g / 10, M, virtual: virt };
      opts.onChange && opts.onChange(state);
    }
    st.pointer({
      move: (p) => { g = clamp(Math.round(LX - p.x), 30, 300); sl.set(g / 10, false); render(); },
    });
    render();
    return { stage: st, get state() { return state; } };
  }

  /* =========================================================
     D) Fernrohr aus zwei Linsen (Kepler / Galilei / Baukasten)
     ========================================================= */
  function twoLensScope(container, opts) {
    opts = Object.assign({ f1: 400, f2: 100, d: 300, theta: 2, types: false, kit: false, X1: 50 }, opts);
    const st = new Stage(container, { w: 800, h: 400, label: 'Fernrohr aus Objektiv und Okular' });
    const AX = 210, X1 = opts.X1, A1 = 62, A2 = 46;
    let f1 = opts.f1, f2 = opts.f2, d = opts.d;
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    const gL = s('g', null, st.gBody), gM = s('g', null, st.gOver);
    const ins = inset(st, { x: 10, y: 10, w: 170, h: 125, title: 'Blick ins Okular', bg: 'sky' });
    const read = h('div', { class: 'readout' });
    st.block.append(read);
    const ctr = controls(st.block);
    if (opts.types) {
      const seg = UI.segmented([{ value: 1, label: 'Okular: Sammellinse (Kepler)' }, { value: -1, label: 'Okular: Zerstreuungslinse (Galilei)' }], 1, (v) => { f2 = v * Math.abs(f2); render(); });
      ctr.append(h('div', { class: 'ctl' }, seg.el));
    }
    if (opts.kit) {
      const s1 = UI.segmented([200, 400, 600].map((v) => ({ value: v, label: `${v / 10} cm` })), f1, (v) => { f1 = v; render(); });
      const s2 = UI.segmented([100, 50, 25, -50].map((v) => ({ value: v, label: v > 0 ? `${fmt(v / 10, 1)} cm` : `−${v / -10} cm (Zerstr.)` })), f2, (v) => { f2 = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, h('label', null, 'Objektiv (Brennweite)'), s1.el), h('div', { class: 'ctl' }, h('label', null, 'Okular (Brennweite)'), s2.el));
    }
    const maxD = (800 - X1 - 20) / 10;
    const sl = UI.slider({ label: 'Abstand Objektiv – Okular', min: 3, max: Math.floor(maxD), step: 0.1, fine: 0.1, value: d / 10, format: (v) => fmt(v, 1) + ' cm', onInput: (v) => { d = v * 10; render(); } });
    ctr.append(sl.el);
    let state = {};
    function render() {
      const X2 = X1 + d;
      gL.innerHTML = ''; gM.innerHTML = ''; st.gRay.innerHTML = '';
      lensShape(gL, X1, AX, f1, A1);
      lensShape(gL, X2, AX, f2, A2);
      label(gL, X1, AX + A1 + 22, 'Objektiv', 'lbl-small', 'middle');
      label(gL, X2, AX + A2 + 22, 'Okular', 'lbl-small', 'middle');
      if (X1 + f1 < 800) { focusMark(gM, X1 + f1, AX, 'F₁', true); s('line', { x1: X1 + f1, y1: AX - 70, x2: X1 + f1, y2: AX + 70, class: 'dim-help' }, gM); }
      const F2 = X2 - f2;
      if (F2 > 0 && F2 < 800) focusMark(gM, F2, AX, 'F₂');
      eyeIcon(gM, Math.min(X2 + 40, 780), AX, 0.9);
      const els = [{ type: 'lens', x: X1, f: f1, a: A1 }, { type: 'lens', x: X2, f: f2, a: A2 }];
      const th = opts.theta * DEG;
      const dir = { x: Math.cos(th), y: Math.sin(th) };
      const segs = [], outs = [];
      for (let k = 0; k < 5; k++) {
        const yh = -A1 * 0.75 + k * (1.5 * A1 / 4);
        const y0 = AX + yh - Math.tan(th) * X1;
        const tr = ptrace(els, { x: 0, y: y0 }, dir, AX);
        segs.push(...tr.segs);
        if (!tr.blocked && tr.end && tr.end.p.x >= X2 - 1) outs.push(Math.atan2(tr.end.d.y, tr.end.d.x) / DEG);
      }
      drawSegs(st, st.gRay, segs, { width: 1.8 });
      const ok = outs.length >= 4;
      const spread = ok ? Math.max(...outs) - Math.min(...outs) : 99;
      const mean = ok ? outs.reduce((a, b) => a + b, 0) / outs.length : 0;
      const mag = Math.tan(mean * DEG) / Math.tan(opts.theta * DEG);
      const sharp = ok && spread < 0.8;
      const upright = mag > 0;
      drawMotif(ins, 'tower', clamp(Math.abs(mag) * 0.32, 0.3, 2.6), !upright);
      ins.setBlur(ok ? spread * 2.2 : 10);
      let t = `<span class="pill">Abstand ${fmt(d / 10, 1)} cm</span> `;
      if (!ok) t += '<span class="pill pill-warn">Kaum Licht kommt durch das Okular.</span>';
      else if (sharp) t += `<b class="ok">Scharf!</b> Vergrößerung <span class="pill pill-f">${fmt(Math.abs(mag), 1)}-fach</span> · Bild ${upright ? 'aufrecht' : 'steht Kopf'}`;
      else t += '<span class="dim">unscharf – Abstand anpassen</span>';
      read.innerHTML = t;
      state = { d: d / 10, f1: f1 / 10, f2: f2 / 10, sharp, mag: Math.abs(mag), upright, spread };
      opts.onChange && opts.onChange(state);
    }
    render();
    return { stage: st, get state() { return state; } };
  }

  /* =========================================================
     E) Mikroskop
     ========================================================= */
  function microscope(container, opts) {
    opts = Object.assign({ g: 95 }, opts);
    const st = new Stage(container, { w: 800, h: 400, label: 'Mikroskop von der Seite: Objekt, Objektiv, Zwischenbild, Okular' });
    const AX = 200, X1 = 170, f1 = 50, A1 = 30, X2 = 500, f2 = 100, A2 = 56, H = 10;
    let g = opts.g;
    s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis' }, st.gBg);
    s('rect', { x: X1 - 14, y: AX - 75, width: X2 - X1 + 28, height: 150, rx: 10, class: 'scope-tube' }, st.gBg);
    lensShape(st.gBody, X1, AX, f1, A1);
    lensShape(st.gBody, X2, AX, f2, A2);
    label(st.gBody, X1, AX + 98, 'Objektiv', 'lbl-small', 'middle');
    label(st.gBody, X2, AX + 98, 'Okular', 'lbl-small', 'middle');
    focusMark(st.gBg, X1 - f1, AX, 'F'); focusMark(st.gBg, X1 + f1, AX, 'F'); focusMark(st.gBg, X2 - f2, AX, 'F', true);
    eyeIcon(st.gBg, X2 + 60, AX, 0.9);
    const gO = s('g', null, st.gOver);
    const ins = inset(st, { x: 620, y: 10, w: 170, h: 130, title: 'Blick ins Mikroskop', bg: 'paper' });
    const read = h('div', { class: 'readout' });
    st.block.append(read);
    const ctr = controls(st.block);
    const sl = UI.slider({ label: 'Scharfstellen (Triebrad): Abstand Objekt – Objektiv', min: 52, max: 120, step: 0.2, fine: 0.2, value: g, format: (v) => fmt(v / 10, 2) + ' mm', onInput: (v) => { g = v; render(); } });
    ctr.append(sl.el);
    let state = {};
    function render() {
      gO.innerHTML = ''; st.gRay.innerHTML = '';
      const tip = { x: X1 - g, y: AX - H };
      arrowObj(gO, tip.x, AX, H, 'cell');
      label(gO, tip.x, AX + 22, 'Objekt', 'lbl-small', 'middle');
      const els = [{ type: 'lens', x: X1, f: f1, a: A1 }, { type: 'lens', x: X2, f: f2, a: A2 }];
      const segs = [], outs = [];
      for (let k = 0; k < 5; k++) {
        const ty = AX - A1 * 0.85 + k * (1.7 * A1 / 4);
        const tr = ptrace(els, tip, { x: X1 - tip.x, y: ty - tip.y }, AX);
        segs.push(...tr.segs);
        if (!tr.blocked && tr.end && tr.end.p.x >= X2 - 1) outs.push(Math.atan2(tr.end.d.y, tr.end.d.x) / DEG);
      }
      drawSegs(st, st.gRay, segs, { arrows: false, width: 1.6 });
      const zb = imageOf([els[0]], tip, AX);
      let b1 = null, m1 = null;
      if (zb && !zb.inf && zb.real) {
        b1 = zb.p.x - X1; m1 = (AX - zb.p.y) / H;
        if (zb.p.x < 790) { arrowObj(gO, zb.p.x, AX, AX - zb.p.y, 'img-real'); label(gO, zb.p.x, AX + 92, 'Zwischenbild', 'lbl-small', 'middle'); }
      }
      const ok = outs.length >= 3;
      const spread = ok ? Math.max(...outs) - Math.min(...outs) : 99;
      const inside = b1 != null && b1 < X2 - X1 && b1 > X2 - X1 - f2;
      const sharp = ok && inside && spread < 1.2;
      const Mtot = b1 ? Math.abs(m1) * (250 / f2) : 0;
      drawMotif(ins, 'cells', clamp(Mtot / 9, 0.4, 2.4), true);
      ins.setBlur(ok ? clamp(spread * 1.6, 0, 14) : 12);
      let t = `<span class="pill">Abstand ${fmt(g / 10, 2)} mm</span> `;
      if (b1 && sharp) t += `<b class="ok">Scharf!</b> Zwischenbild ${fmt(Math.abs(m1), 1)}-fach, insgesamt etwa <span class="pill pill-f">${Math.round(Mtot)}-fach</span> vergrößert`;
      else if (b1 && b1 > X2 - X1) t += '<span class="dim">Das Zwischenbild liegt hinter dem Okular – unscharf. Dreht das Objekt etwas weiter weg.</span>';
      else t += '<span class="dim">unscharf – Abstand anpassen</span>';
      read.innerHTML = t;
      state = { g, sharp, b1, m1, Mtot };
      opts.onChange && opts.onChange(state);
    }
    render();
    return { stage: st, get state() { return state; } };
  }

  /* =========================================================
     F) Spiegel und Prismen: Hohlspiegel, Newton-Teleskop, Umlenkprisma
     ========================================================= */
  function mirrors(container, opts) {
    opts = Object.assign({ mode: 'hohl', modes: ['hohl', 'newton', 'porro'] }, opts);
    const st = new Stage(container, { w: 800, h: 440, label: 'Spiegel und Prismen lenken Licht' });
    const AX = 230;
    let mode = opts.mode;
    const gB = s('g', null, st.gBody), gM = s('g', null, st.gOver);
    const read = h('div', { class: 'readout' });
    st.block.append(read);
    const ctr = controls(st.block);
    if (opts.modes.length > 1) {
      const names = { hohl: 'Hohlspiegel', newton: 'Spiegelteleskop', porro: 'Umlenkprisma' };
      const seg = UI.segmented(opts.modes.map((m) => ({ value: m, label: names[m] })), mode, (v) => { mode = v; render(); });
      ctr.append(h('div', { class: 'ctl' }, seg.el));
    }
    let state = {};
    function render() {
      gB.innerHTML = ''; gM.innerHTML = ''; st.gRay.innerHTML = '';
      const XM = 690, R = 540, AM = 130;
      if (mode === 'hohl' || mode === 'newton') {
        const M = O.concaveMirror(XM, AX, R, AM);
        s('path', { d: M.path, class: 'mirror' }, gB);
        s('path', { d: M.path, class: 'mirror-back', transform: 'translate(7 0)' }, gB);
        const bodies = [M];
        let heights = [-110, -80, -50, -20, 20, 50, 80, 110];
        const xs = 470, F = { x: XM - R / 2, y: AX };
        if (mode === 'newton') {
          const S = O.planeMirror({ x: xs - 40, y: AX - 40 }, { x: xs + 40, y: AX + 40 }, { x: xs + 40, y: AX - 40 });
          bodies.push(S);
          s('path', { d: S.path, class: 'mirror small' }, gB);
          s('rect', { x: 330, y: AX - 150, width: XM - 320, height: 300, rx: 8, class: 'scope-tube faint' }, gB);
          s('rect', { x: xs - 16, y: AX - (xs - F.x) - 60, width: 32, height: 60, rx: 4, class: 'okular-box' }, gB);
          label(gB, xs + 24, AX - (xs - F.x) - 40, 'Okular', 'lbl-small');
          label(gB, 340, AX - 160, 'Rohr (vorne offen)', 'lbl-small');
          heights = [-120, -95, -70, -45, 45, 70, 95, 120];
        } else {
          s('circle', { cx: F.x, cy: AX, r: 5, class: 'focus-dot' }, gM);
          label(gM, F.x, AX - 12, 'F', 'lbl-focus', 'middle');
        }
        s('line', { x1: 0, y1: AX, x2: 800, y2: AX, class: 'axis faint' }, gB);
        label(gB, XM + 14, AX + AM + 18, 'Hohlspiegel', 'lbl-small', 'middle');
        const segs = [];
        heights.forEach((hy) => { const tr = O.trace(bodies, { x: 0, y: AX + hy }, { x: 1, y: 0 }, { maxLen: 900 }); segs.push(...tr.segments); });
        drawSegs(st, st.gRay, segs, { width: 1.8 });
        read.innerHTML = mode === 'hohl'
          ? 'Ein <b>Hohlspiegel</b> sammelt paralleles Licht im Brennpunkt F – wie eine Sammellinse, aber ohne dass das Licht durch Glas muss.'
          : 'Im <b>Spiegelteleskop</b> (nach Newton) lenkt ein kleiner ebener Spiegel das gesammelte Licht seitlich zum Okular.';
      } else {
        const P = O.polygon([{ x: 470, y: AX - 140 }, { x: 610, y: AX }, { x: 470, y: AX + 140 }], 1.5);
        s('path', { d: P.path, class: 'body mat-glas' }, gB);
        label(gB, 560, AX + 150, 'Umlenkprisma (Glas)', 'lbl-small', 'middle');
        const red = [], blue = [];
        [-105, -80].forEach((hy) => red.push(...O.trace([P], { x: 0, y: AX + hy }, { x: 1, y: 0 }, { maxLen: 900 }).segments));
        [35, 55].forEach((hy) => blue.push(...O.trace([P], { x: 0, y: AX + hy }, { x: 1, y: 0 }, { maxLen: 900 }).segments));
        drawSegs(st, st.gRay, red, { width: 2 });
        drawSegs(st, st.gRay, blue, { width: 2, cls: 'alt' });
        label(gM, 20, AX - 115, 'oben (rot)', 'lbl-small');
        label(gM, 20, AX + 75, 'unten (blau)', 'lbl-small');
        read.innerHTML = 'Das Licht wird an den beiden schrägen Flächen <b>total reflektiert</b> und läuft zurück – oben und unten sind dabei vertauscht.';
      }
      state = { mode };
      opts.onChange && opts.onChange(state);
    }
    render();
    return { stage: st, get state() { return state; } };
  }

  window.Bench = { ptrace, imageOf, imaging, eye, magnifier, twoLensScope, microscope, mirrors, drawEye, EYES };
})();
