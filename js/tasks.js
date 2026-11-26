/* =========================================================
   tasks.js – Aufgabentypen
   ========================================================= */
(function () {
  'use strict';
  const { h, feedback } = UI;

  const PRAISE = ['Richtig!', 'Genau!', 'Super!', 'Stark!', 'Volltreffer!', 'Prima!'];
  const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

  function card(container, title) {
    const el = h('div', { class: 'task' });
    if (title) el.append(h('div', { class: 'task-title', html: title }));
    container.append(el);
    return el;
  }

  /* ---------- Multiple Choice ---------- */
  function mc(container, o) {
    const el = card(container, o.title);
    el.append(h('div', { class: 'task-q', html: o.q }));
    const list = h('div', { class: 'mc' + (o.grid ? ' mc-grid' : '') });
    const fb = h('div', { class: 'fb-slot' });
    let done = false;
    const opts = o.shuffle === false ? o.options : UI.shuffle(o.options);
    opts.forEach((opt) => {
      const b = h('button', { type: 'button', class: 'mc-opt', html: opt.t });
      b.addEventListener('click', () => {
        if (done) return;
        fb.innerHTML = '';
        if (opt.ok) {
          done = true;
          b.classList.add('right');
          list.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          fb.append(feedback('ok', '<b>' + praise() + '</b> ' + (opt.fb || o.fbOk || '')));
          o.onSolved && o.onSolved();
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          fb.append(feedback('no', opt.fb || 'Noch nicht. Überlegt noch einmal!'));
        }
      });
      list.append(b);
    });
    el.append(list, fb);
    if (o.solved) { // bereits gelöst: Lösung anzeigen
      done = true;
      [...list.children].forEach((b, i) => { b.disabled = true; if (opts[i].ok) b.classList.add('right'); });
    }
    return el;
  }

  /* ---------- Lückentext mit Auswahl ---------- */
  function cloze(container, o) {
    const el = card(container, o.title);
    if (o.q) el.append(h('div', { class: 'task-q', html: o.q }));
    const p = h('div', { class: 'cloze' });
    const selects = [];
    o.parts.forEach((part) => {
      if (typeof part === 'string') { p.append(h('span', { html: part })); return; }
      if (part.br) { p.append(h('br')); return; }
      const sel = h('select', { 'aria-label': 'Lücke' }, h('option', { value: '' }, '… wählen …'), ...UI.shuffle(part.opts).map((x) => h('option', { value: x }, x)));
      sel.addEventListener('change', () => sel.classList.remove('right', 'wrong'));
      selects.push({ sel, a: part.a });
      p.append(sel);
    });
    const fb = h('div', { class: 'fb-slot' });
    const check = UI.btn('Prüfen', () => {
      let all = true;
      selects.forEach(({ sel, a }) => {
        const ok = sel.value === a;
        sel.classList.toggle('right', ok);
        sel.classList.toggle('wrong', !ok);
        if (!ok) all = false;
      });
      fb.innerHTML = '';
      if (all) {
        fb.append(feedback('ok', '<b>' + praise() + '</b> ' + (o.fbOk || 'Alles richtig ergänzt.')));
        selects.forEach(({ sel }) => { sel.disabled = true; });
        check.disabled = true;
        o.onSolved && o.onSolved();
      } else {
        const n = selects.filter(({ sel, a }) => sel.value !== a).length;
        fb.append(feedback('no', `${n} ${n === 1 ? 'Lücke ist' : 'Lücken sind'} noch nicht richtig (rot markiert). ${o.hint || ''}`));
      }
    }, 'btn-primary');
    el.append(p, h('div', { class: 'task-actions' }, check), fb);
    if (o.solved) { selects.forEach(({ sel, a }) => { sel.value = a; sel.disabled = true; sel.classList.add('right'); }); check.disabled = true; }
    return el;
  }

  /* ---------- Zahl eingeben ---------- */
  function numeric(container, o) {
    const el = card(container, o.title);
    el.append(h('div', { class: 'task-q', html: o.q }));
    const input = h('input', { type: 'number', inputmode: 'decimal', class: 'num', step: 'any', 'aria-label': 'Antwort' });
    const fb = h('div', { class: 'fb-slot' });
    let tries = 0;
    const check = UI.btn('Prüfen', () => {
      const v = parseFloat(String(input.value).replace(',', '.'));
      fb.innerHTML = '';
      if (isNaN(v)) { fb.append(feedback('no', 'Bitte gebt eine Zahl ein.')); return; }
      tries++;
      if (Math.abs(v - o.answer) <= o.tol) {
        input.classList.add('right'); input.disabled = true; check.disabled = true;
        fb.append(feedback('ok', '<b>' + praise() + '</b> ' + (o.fbOk || '')));
        o.onSolved && o.onSolved(v);
      } else {
        input.classList.add('wrong');
        let msg = v > o.answer ? (o.fbHigh || 'Das ist zu groß.') : (o.fbLow || 'Das ist zu klein.');
        if (tries >= 2 && o.hint) msg += ' <br><b>Tipp:</b> ' + o.hint;
        fb.append(feedback('no', msg));
      }
    }, 'btn-primary');
    input.addEventListener('input', () => input.classList.remove('wrong'));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check.click(); });
    el.append(h('div', { class: 'num-row' }, input, o.unit ? h('span', { class: 'unit' }, o.unit) : null, check), fb);
    if (o.solved) { input.value = o.answer; input.disabled = true; check.disabled = true; input.classList.add('right'); }
    return el;
  }

  /* ---------- Beschriften (antippen & zuordnen) ---------- */
  function labeling(container, o) {
    const el = card(container, o.title);
    if (o.q) el.append(h('div', { class: 'task-q', html: o.q }));
    const holder = h('div', { class: 'label-holder' });
    el.append(holder);
    const built = o.build(holder); // {stage, zones}
    const wrap = built.stage.wrap;
    const W = built.stage.w, H = built.stage.h;
    const chips = h('div', { class: 'chips' });
    const fb = h('div', { class: 'fb-slot' });
    let selected = null;
    const placed = {}; // zoneId -> item
    const zoneEls = {};
    const items = UI.shuffle(o.items);
    const chipEls = {};
    items.forEach((it) => {
      const c = h('button', { type: 'button', class: 'chip', html: it.text });
      c.addEventListener('click', () => {
        if (c.classList.contains('used')) return;
        if (selected === it) { selected = null; c.classList.remove('sel'); wrap.classList.remove('picking'); return; }
        Object.values(chipEls).forEach((x) => x.classList.remove('sel'));
        selected = it; c.classList.add('sel'); wrap.classList.add('picking');
      });
      chipEls[it.zone] = c;
      chips.append(c);
    });
    o.items.forEach((it) => {
      const z = built.zones[it.zone];
      const zb = h('button', { type: 'button', class: 'zone', style: { left: (z.x / W * 100) + '%', top: (z.y / H * 100) + '%' }, 'aria-label': 'Feld' }, '?');
      zb.addEventListener('click', () => {
        if (placed[it.zone]) { // zurücklegen
          const back = placed[it.zone];
          chipEls[back.zone].classList.remove('used');
          delete placed[it.zone];
          zb.textContent = '?'; zb.classList.remove('filled', 'wrong', 'right');
          return;
        }
        if (!selected) { fb.innerHTML = ''; fb.append(feedback('info', 'Tippt zuerst unten auf einen Begriff und dann auf das passende Fragezeichen.')); return; }
        placed[it.zone] = selected;
        zb.innerHTML = selected.text; zb.classList.add('filled');
        chipEls[selected.zone].classList.add('used'); chipEls[selected.zone].classList.remove('sel');
        selected = null; wrap.classList.remove('picking');
      });
      zoneEls[it.zone] = zb;
      wrap.append(zb);
    });
    const check = UI.btn('Prüfen', () => {
      fb.innerHTML = '';
      const missing = o.items.filter((it) => !placed[it.zone]).length;
      if (missing) { fb.append(feedback('info', `Es fehlen noch ${missing} Begriff${missing > 1 ? 'e' : ''}.`)); return; }
      let wrong = 0;
      o.items.forEach((it) => {
        const ok = placed[it.zone].zone === it.zone;
        zoneEls[it.zone].classList.toggle('right', ok);
        zoneEls[it.zone].classList.toggle('wrong', !ok);
        if (!ok) wrong++;
      });
      if (!wrong) {
        fb.append(feedback('ok', '<b>' + praise() + '</b> ' + (o.fbOk || 'Alles richtig beschriftet.')));
        check.disabled = true;
        Object.values(zoneEls).forEach((z) => { z.disabled = true; });
        o.onSolved && o.onSolved();
      } else {
        fb.append(feedback('no', `${wrong} Begriff${wrong > 1 ? 'e sind' : ' ist'} falsch zugeordnet (rot). Tippt auf ein rotes Feld, um den Begriff zurückzulegen.`));
      }
    }, 'btn-primary');
    el.append(h('div', { class: 'chips-hint' }, 'Tippt auf einen Begriff und dann auf das passende Fragezeichen im Bild.'), chips, h('div', { class: 'task-actions' }, check), fb);
    if (o.solved) {
      o.items.forEach((it) => { const z = zoneEls[it.zone]; z.innerHTML = it.text; z.classList.add('filled', 'right'); z.disabled = true; chipEls[it.zone].classList.add('used'); });
      check.disabled = true;
    }
    return el;
  }

  /* ---------- Messtabelle ---------- */
  function table(container, o) {
    const el = card(container, o.title);
    if (o.q) el.append(h('div', { class: 'task-q', html: o.q }));
    const tbl = h('table', { class: 'mtable' });
    const r1 = h('tr', null, h('th', { html: o.head[0] }));
    const r2 = h('tr', null, h('th', { html: o.head[1] }));
    const inputs = [];
    o.rows.forEach((x, i) => {
      r1.append(h('td', null, x + (o.unit != null ? ' ' + o.unit : '°')));
      const inp = h('input', { type: 'number', inputmode: 'decimal', step: 'any', class: 'num small', 'aria-label': `${o.head[1]} bei ${x}${o.unit != null ? ' ' + o.unit : '°'}` });
      if (o.prefill && o.prefill[i] != null) inp.value = o.prefill[i];
      inp.addEventListener('input', () => inp.classList.remove('wrong', 'right'));
      inputs.push(inp);
      r2.append(h('td', null, inp, h('span', { class: 'deg' }, o.unit != null ? ' ' + o.unit : '°')));
    });
    tbl.append(r1, r2);
    const fb = h('div', { class: 'fb-slot' });
    const check = UI.btn('Messwerte prüfen', () => {
      fb.innerHTML = '';
      let wrong = 0, empty = 0;
      const vals = [];
      inputs.forEach((inp, i) => {
        const v = parseFloat(String(inp.value).replace(',', '.'));
        vals.push(v);
        if (isNaN(v)) { empty++; return; }
        const ok = Math.abs(v - o.truth[i]) <= o.tol;
        inp.classList.toggle('right', ok); inp.classList.toggle('wrong', !ok);
        if (!ok) wrong++;
      });
      if (empty) { fb.append(feedback('info', `Es fehlen noch ${empty} Messwert${empty > 1 ? 'e' : ''}.`)); return; }
      if (wrong) { fb.append(feedback('no', `${wrong} Messwert${wrong > 1 ? 'e weichen' : ' weicht'} zu stark ab (rot). Stellt den Winkel α noch einmal genau ein und lest mit der Lupe ab. ${o.hint || ''}`)); return; }
      inputs.forEach((inp) => { inp.disabled = true; });
      check.disabled = true;
      fb.append(feedback('ok', '<b>' + praise() + '</b> ' + (o.fbOk || 'Saubere Messung!')));
      o.onSolved && o.onSolved(vals);
    }, 'btn-primary');
    el.append(h('div', { class: 'table-scroll' }, tbl), h('div', { class: 'task-actions' }, check), fb);
    if (o.solved) { inputs.forEach((inp) => { inp.disabled = true; inp.classList.add('right'); }); check.disabled = true; }
    return el;
  }

  /* ---------- Vorhersage (A/B/C) ---------- */
  function predict(container, o) {
    // o.sim: Simulation mit predict(); o.q; o.fbRight; o.fbWrong(kind)
    const el = card(container, o.title);
    el.append(h('div', { class: 'task-q', html: o.q }));
    const row = h('div', { class: 'predict-row' });
    const fb = h('div', { class: 'fb-slot' });
    let answered = false;
    const keys = ['A', 'B', 'C'];
    const buttons = keys.map((k) => {
      const b = h('button', { type: 'button', class: 'mc-opt key' }, 'Strahl ' + k);
      b.addEventListener('click', () => { if (!answered) o.sim.choose(k); });
      row.append(b);
      return b;
    });
    el.append(row, fb);
    if (o.solved) {
      buttons.forEach((b) => { b.disabled = true; });
      fb.append(feedback('info', o.fbAgain || 'Ihr habt diese Vermutung schon geprüft.'));
      return el;
    }
    o.sim.predict((real, kind) => {
      answered = true;
      buttons.forEach((b) => { b.disabled = true; });
      fb.innerHTML = '';
      if (real) fb.append(feedback('ok', '<b>Eure Vermutung stimmt!</b> ' + (o.fbRight || '')));
      else fb.append(feedback('no', '<b>Gute Idee – aber das Experiment zeigt etwas anderes.</b> ' + (o.fbWrong ? o.fbWrong(kind) : '')));
      o.onSolved && o.onSolved(real);
    });
    return el;
  }

  window.Tasks = { mc, cloze, numeric, labeling, table, predict, card };
})();
