/* =========================================================
   app.js – Navigation, Fortschritt, Karte, Logbuch, Urkunde
   Alle Daten bleiben im Browser (localStorage), nichts wird gesendet.
   ========================================================= */
(function () {
  'use strict';
  const { h, esc } = UI;
  const STATIONS = CONTENT.STATIONS;
  const KEY = 'mission-aurelia-v1';
  const KIND = { story: ['Geschichte', 'k-story'], info: ['Wissen', 'k-info'], exp: ['Experiment', 'k-exp'], task: ['Aufgabe', 'k-task'] };
  const CRYSTAL_STATIONS = STATIONS.filter((s) => s.crystal !== false);

  /* ---------- Fortschritt ---------- */
  let prog = load();
  function load() {
    try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && p.steps) return p; } catch (_) { /* leer */ }
    return { team: '', steps: {}, stations: {}, data: {}, all: false };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (_) { /* privat-Modus */ } }
  const isDone = (st) => !!prog.stations[st.id];
  function isOpen(i) { return i === 0 || prog.all || isDone(STATIONS[i - 1]); }
  const crystals = () => CRYSTAL_STATIONS.filter(isDone).length;
  function nextStation() { return STATIONS.find((s, i) => !isDone(s) && isOpen(i)); }

  /* ---------- Kristall-Icon ---------- */
  function crystalSvg(color, cls) {
    return `<svg viewBox="0 0 40 48" class="crys ${cls || ''}" aria-hidden="true"><path d="M20 2 L36 16 L28 46 L12 46 L4 16 Z" fill="${color}" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/><path d="M20 2 L20 46 M4 16 L36 16 M20 2 L12 46 M20 2 L28 46" stroke="rgba(255,255,255,.45)" stroke-width="1" fill="none"/></svg>`;
  }

  /* ---------- Kopfzeile ---------- */
  const app = document.getElementById('app');
  const head = document.getElementById('topbar');
  function renderHeader() {
    const n = crystals();
    const nights = 8 - n;
    head.innerHTML = '';
    const brand = h('a', { href: '#/', class: 'brand' }, h('span', { class: 'brand-icon', html: crystalSvg('#ffd34d') }), h('span', null, h('b', null, 'Mission Aurelia'), h('small', null, 'Lernpfad Lichtbrechung')));
    const row = h('div', { class: 'crystal-row', title: `${n} von 8 Lichtkristallen`, 'aria-label': `${n} von 8 Lichtkristallen` });
    CRYSTAL_STATIONS.forEach((s) => row.append(h('span', { html: crystalSvg(isDone(s) ? s.color : '#2a3558', isDone(s) ? 'got' : 'empty') })));
    const count = h('div', { class: 'countdown' }, n === 8 ? '☄ Aurelia ist da!' : nights === 1 ? '☄ Noch 1 Nacht bis Aurelia' : `☄ Noch ${nights} Nächte bis Aurelia`);
    const nav = h('nav', { class: 'topnav' },
      h('a', { href: '#/', class: 'navlink' }, 'Karte'),
      h('a', { href: '#/logbuch', class: 'navlink' }, 'Logbuch'));
    if (prog.team) nav.prepend(h('span', { class: 'team-tag', title: 'Euer Team' }, '👥 ' + prog.team));
    head.append(brand, h('div', { class: 'head-mid' }, row, count), nav);
  }

  /* ---------- Karte ---------- */
  const NODES = [
    [90, 560], [230, 500], [380, 540], [530, 470], [420, 385], [260, 330], [400, 250], [520, 205], [610, 185],
  ];
  function renderMap() {
    app.innerHTML = '';
    const wrap = h('section', { class: 'map-view' });
    const nx = nextStation();
    // Begrüßung
    if (!isDone(STATIONS[0])) {
      wrap.append(h('div', { class: 'hero' },
        h('h1', null, 'Mission Aurelia'),
        h('p', { class: 'hero-sub' }, 'Ein Lernpfad zur Lichtbrechung – von der Grenzfläche bis zur Linse'),
        h('p', null, 'Die Sternwarte Lichtberg braucht eure Hilfe: Ihre wichtigste Linse ist zerbrochen – und in 8 Nächten kommt ein Komet, der nur alle 312 Jahre zu sehen ist.'),
        UI.btn('🚀 Mission starten', () => go(`#/s/prolog/0`), 'btn-primary btn-big')));
    } else if (nx) {
      wrap.append(h('div', { class: 'hero small' }, UI.dialog([{ who: 'lumi', text: `Weiter geht's, <b>${esc(prog.team || 'Lichtblitz')}</b>! Als Nächstes: <b>Station ${nx.nr} – ${nx.title}</b>.` }]),
        UI.btn(`Weiter zu Station ${nx.nr} →`, () => go(resumeHash(nx)), 'btn-primary')));
    } else {
      wrap.append(h('div', { class: 'hero small' }, UI.dialog([{ who: 'lumi', text: `Mission erfüllt, <b>${esc(prog.team || 'Lichtblitz')}</b>! Alle 8 Lichtkristalle sind gesammelt.` }]),
        h('div', { class: 'btn-row' }, UI.btn('🏅 Zur Urkunde', () => go('#/urkunde'), 'btn-primary'), UI.btn('📓 Logbuch', () => go('#/logbuch'), 'btn-ghost'))));
    }

    // SVG-Karte
    const svg = UI.s('svg', { viewBox: '0 0 800 620', class: 'map', role: 'img', 'aria-label': 'Karte des Lernpfads: ein Weg den Berg hinauf zur Sternwarte' });
    svg.innerHTML = `
      <defs>
        <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a1c"/><stop offset="1" stop-color="#16234d"/></linearGradient>
        <linearGradient id="mtail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7fbff"/><stop offset="1" stop-color="#5fa8ff" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="800" height="620" fill="url(#msky)"/>
      ${Array.from({ length: 60 }, (_, i) => { const x = (i * 137.5) % 800, y = (i * 71.3) % 300; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.6 + (i % 3) * 0.4).toFixed(1)}" fill="#fff" opacity="${(0.4 + (i % 4) * 0.15).toFixed(2)}"/>`; }).join('')}
      <g opacity="${0.35 + crystals() / 8 * 0.65}"><path d="M120 120 Q60 80 0 70 L0 84 Q58 94 117 126Z" fill="url(#mtail)" transform="rotate(180 120 120)"/><circle cx="120" cy="120" r="${4 + crystals() * 0.6}" fill="#e9fdff"/></g>
      <path d="M0 620 L0 470 Q150 420 260 440 Q380 300 520 330 Q610 180 720 120 Q770 140 800 170 L800 620Z" fill="#0f1a3a"/>
      <path d="M0 620 L0 560 Q200 500 400 560 Q600 520 800 560 L800 620Z" fill="#0a1229"/>
      <g transform="translate(700 92)"><rect x="-36" y="22" width="72" height="36" fill="#3a4670"/><path d="M-42 24 A42 42 0 0 1 42 24Z" fill="#c9d1ea"/><rect x="-5" y="-22" width="10" height="50" rx="3" fill="#8f9bc4" transform="rotate(-38)"/><rect x="-8" y="36" width="16" height="22" fill="#ffd34d" opacity=".85"/></g>
      <text x="700" y="172" text-anchor="middle" class="map-label">Sternwarte</text>`;
    let d = `M${NODES[0][0]} ${NODES[0][1]}`;
    for (let i = 1; i < NODES.length; i++) {
      const [x0, y0] = NODES[i - 1], [x1, y1] = NODES[i];
      d += ` Q${(x0 + x1) / 2 + (i % 2 ? 40 : -40)} ${(y0 + y1) / 2 + 30} ${x1} ${y1}`;
    }
    UI.s('path', { d, class: 'map-path' }, svg);
    STATIONS.forEach((st, i) => {
      const [x, y] = NODES[i];
      const open = isOpen(i), done = isDone(st);
      const g = UI.s('g', { class: 'node' + (done ? ' done' : open ? ' open' : ' locked'), transform: `translate(${x} ${y})`, tabindex: open ? 0 : -1, role: 'link', 'aria-label': `${st.nr ? 'Station ' + st.nr + ': ' : ''}${st.title}${done ? ' (erledigt)' : open ? '' : ' (gesperrt)'}` }, svg);
      if (open && !done) UI.s('circle', { r: 38, class: 'node-pulse' }, g);
      UI.s('circle', { r: 30, class: 'node-c' }, g);
      if (done && st.crystal !== false) {
        const c = UI.s('g', null, g);
        c.innerHTML = crystalSvg(st.color);
        const sv = c.firstElementChild;
        sv.setAttribute('x', -14); sv.setAttribute('y', -17); sv.setAttribute('width', 28); sv.setAttribute('height', 34);
      } else {
        UI.s('text', { y: 8, 'text-anchor': 'middle', class: 'node-t', text: st.nr === 0 ? (done ? '✓' : '★') : (open ? st.nr : '🔒') }, g);
      }
      UI.s('text', { y: 52, 'text-anchor': 'middle', class: 'node-l', text: st.short }, g);
      if (open) {
        const act = () => go(done ? `#/s/${st.id}/0` : resumeHash(st));
        g.addEventListener('click', act);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      }
    });
    wrap.append(h('div', { class: 'map-wrap' }, svg));

    // Liste
    const list = h('ol', { class: 'station-list' });
    STATIONS.forEach((st, i) => {
      const open = isOpen(i), done = isDone(st);
      const li = h('li', { class: done ? 'done' : open ? 'open' : 'locked' },
        h('span', { class: 'sl-icon', html: done && st.crystal !== false ? crystalSvg(st.color) : (open ? (st.nr || '★') : '🔒') }),
        h('span', { class: 'sl-text' }, h('b', null, st.nr ? `Station ${st.nr}` : 'Start'), ' ', st.title),
        open ? UI.btn(done ? 'Wiederholen' : (Object.keys(prog.steps).some((k) => k.startsWith(st.id + '.')) ? 'Fortsetzen' : 'Starten'), () => go(done ? `#/s/${st.id}/0` : resumeHash(st)), done ? 'btn-ghost' : 'btn-primary') : h('span', { class: 'dim' }, 'gesperrt'));
      list.append(li);
    });
    wrap.append(list);
    app.append(wrap);
  }

  function maxStep(st) {
    if (prog.all) return st.steps.length - 1;
    for (let i = 0; i < st.steps.length; i++) {
      if (st.steps[i].gate && !prog.steps[st.id + '.' + i]) return i;
    }
    return st.steps.length - 1;
  }
  function resumeHash(st) { return `#/s/${st.id}/${maxStep(st)}`; }

  /* ---------- Station ---------- */
  function renderStation(id, idx) {
    const si = STATIONS.findIndex((s) => s.id === id);
    if (si < 0 || !isOpen(si)) { go('#/'); return; }
    const st = STATIONS[si];
    const max = maxStep(st);
    idx = Math.max(0, Math.min(isNaN(idx) ? 0 : idx, st.steps.length - 1));
    if (idx > max) { go(`#/s/${id}/${max}`); return; }
    const step = st.steps[idx];
    const key = st.id + '.' + idx;
    app.innerHTML = '';

    const sec = h('section', { class: 'station', style: { '--st-color': st.color || '#ffd34d' } });
    const dots = h('div', { class: 'stepper', role: 'list' });
    st.steps.forEach((sp, i) => {
      const k = KIND[sp.kind];
      const reachable = i <= max;
      const solved = !sp.gate || prog.steps[st.id + '.' + i];
      const b = h('button', { type: 'button', role: 'listitem', class: 'dot ' + k[1] + (i === idx ? ' cur' : '') + (reachable ? '' : ' locked') + (solved && i < idx ? ' seen' : ''), title: `${i + 1}. ${sp.title} (${k[0]})`, 'aria-label': `Schritt ${i + 1}: ${sp.title}`, disabled: !reachable });
      b.addEventListener('click', () => go(`#/s/${id}/${i}`));
      dots.append(b);
    });
    sec.append(h('div', { class: 'station-head' },
      h('div', { class: 'st-kicker' }, st.nr ? `Station ${st.nr} von 8` : 'Prolog', h('span', { class: 'st-count' }, ` · Schritt ${idx + 1}/${st.steps.length}`)),
      h('h1', null, st.title), dots));

    const k = KIND[step.kind];
    const body = h('div', { class: 'step-body' });
    const art = h('article', { class: 'step' }, h('div', { class: 'step-head' }, h('span', { class: 'kind-badge ' + k[1] }, k[0]), h('h2', null, step.title)), body);
    sec.append(art);

    // Navigation
    const back = UI.btn('← Zurück', () => go(idx > 0 ? `#/s/${id}/${idx - 1}` : '#/'), 'btn-ghost');
    const last = idx === st.steps.length - 1;
    const next = UI.btn(last ? (st.crystal === false ? 'Los geht\'s! →' : '✨ Station abschließen') : 'Weiter →', () => {
      if (last) finishStation(st);
      else go(`#/s/${id}/${idx + 1}`);
    }, 'btn-primary');
    const hint = h('span', { class: 'nav-hint' });
    const nav = h('nav', { class: 'step-nav' }, back, hint, next);
    sec.append(nav);
    app.append(sec);

    let solved = !step.gate || !!prog.steps[key] || prog.all;
    function setGate() {
      next.disabled = !solved;
      hint.textContent = solved ? '' : (step.kind === 'exp' ? 'Erledigt zuerst den Auftrag.' : 'Löst zuerst die Aufgabe.');
    }
    const api = {
      solved: !!prog.steps[key],
      done() {
        if (!prog.steps[key]) { prog.steps[key] = true; save(); }
        if (!solved) { solved = true; setGate(); next.classList.add('pulse'); }
        // Punkte im Stepper aktualisieren
        const nextDot = dots.children[idx + 1];
        if (nextDot) { nextDot.disabled = false; nextDot.classList.remove('locked'); }
      },
      need(n) { let c = 0; return () => { c++; if (c >= n) api.done(); }; },
      get: (k2) => prog.data[k2],
      set: (k2, v) => { prog.data[k2] = v; save(); },
      team: prog.team,
      teamHtml: esc(prog.team || 'Lichtblitz'),
      setTeam: (v) => { prog.team = v; save(); renderHeader(); },
    };
    setGate();
    try { step.render(body, api); } catch (err) { console.error(err); body.append(UI.box('warn', 'Hoppla', 'Dieser Schritt konnte nicht geladen werden. Bitte ladet die Seite neu.')); }
    window.scrollTo(0, 0);
  }

  function finishStation(st) {
    const first = !prog.stations[st.id];
    prog.stations[st.id] = true;
    save();
    renderHeader();
    if (st.crystal === false) { go('#/s/' + STATIONS[1].id + '/0'); return; }
    const n = crystals();
    const ov = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Lichtkristall erhalten' });
    const isLast = st.id === STATIONS[STATIONS.length - 1].id;
    const card = h('div', { class: 'overlay-card', style: { '--st-color': st.color } },
      h('div', { class: 'big-crystal', html: crystalSvg(st.color) }),
      h('h2', null, first ? `Lichtkristall ${st.nr} erhalten!` : `Station ${st.nr} wiederholt`),
      h('p', { class: 'dim' }, `${n} von 8 Kristallen – LUMIs Lichtspeicher ist zu ${Math.round(n / 8 * 100)} % geladen.`),
      h('div', { class: 'logentry' }, h('div', { class: 'logentry-t' }, '📓 Neuer Logbuch-Eintrag'), h('div', { html: st.merksatz })),
      h('p', { class: 'copy-hint' }, '✏️ Schreibt den Merksatz in euer Heft!'),
      h('div', { class: 'btn-row' },
        isLast ? UI.btn('🏅 Zur Urkunde', () => { close(); go('#/urkunde'); }, 'btn-primary') : UI.btn('Zur Karte', () => { close(); go('#/'); }, 'btn-primary'),
        UI.btn('📓 Logbuch', () => { close(); go('#/logbuch'); }, 'btn-ghost')));
    ov.append(card);
    document.body.append(ov);
    const close = () => ov.remove();
    card.querySelector('.btn-primary').focus();
  }

  /* ---------- Logbuch ---------- */
  function renderLog() {
    app.innerHTML = '';
    const sec = h('section', { class: 'page logbook' });
    sec.append(h('div', { class: 'page-head' }, h('h1', null, '📓 Logbuch'), UI.btn('🖨 Drucken', () => window.print(), 'btn-ghost no-print')));
    sec.append(h('p', { class: 'dim' }, `Forschungsteam: ${prog.team || '–'} · Alle Merksätze aus LUMIs Lichtspeicher`));
    CRYSTAL_STATIONS.forEach((st) => {
      const done = isDone(st);
      sec.append(h('div', { class: 'log-item' + (done ? '' : ' locked') },
        h('div', { class: 'log-icon', html: crystalSvg(done ? st.color : '#2a3558') }),
        h('div', null, h('h3', null, `Station ${st.nr}: ${st.title}`), done ? h('div', { html: st.merksatz }) : h('div', { class: 'dim' }, 'Noch nicht freigeschaltet – schließt die Station ab.'))));
    });
    app.append(sec);
    window.scrollTo(0, 0);
  }

  /* ---------- Urkunde ---------- */
  function renderCert() {
    app.innerHTML = '';
    const sec = h('section', { class: 'page' });
    if (crystals() < 8) {
      sec.append(h('h1', null, '🏅 Urkunde'), UI.dialog([{ who: 'lumi', text: `Die Urkunde gibt es, wenn alle 8 Lichtkristalle gesammelt sind. Ihr habt schon <b>${crystals()}</b>!` }]), UI.btn('Zur Karte', () => go('#/'), 'btn-primary'));
      app.append(sec); return;
    }
    const date = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    const cert = h('div', { class: 'cert' },
      h('div', { class: 'cert-top' }, 'Sternwarte Lichtberg'),
      h('h1', null, 'Urkunde'),
      h('p', null, 'Hiermit wird bestätigt, dass das Forschungsteam'),
      h('div', { class: 'cert-name' }, prog.team || 'Lichtblitz'),
      h('p', null, 'die Mission Aurelia erfolgreich abgeschlossen hat. Das Team hat erforscht, wie Licht an Grenzflächen gebrochen wird und wie Linsen Licht sammeln – und damit das Fernrohr der Sternwarte gerettet.'),
      h('p', null, 'Es trägt ab heute den Titel'),
      h('div', { class: 'cert-title' }, 'Junior-Optik-Team'),
      h('div', { class: 'cert-crystals', html: CRYSTAL_STATIONS.map((s) => crystalSvg(s.color)).join('') }),
      h('div', { class: 'cert-sign' },
        h('div', null, h('div', { class: 'sig' }, 'V. Okular'), h('small', null, 'Prof. Vega Okular, Leiterin der Sternwarte')),
        h('div', null, h('div', { class: 'sig' }, 'LUMI ✦'), h('small', null, 'LUMI, Optik-Roboter'))),
      h('div', { class: 'cert-date' }, date));
    sec.append(cert, h('div', { class: 'btn-row no-print center' }, UI.btn('🖨 Urkunde drucken', () => window.print(), 'btn-primary'), UI.btn('📓 Logbuch', () => go('#/logbuch'), 'btn-ghost')));
    app.append(sec);
    window.scrollTo(0, 0);
  }

  /* ---------- Router ---------- */
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function route() {
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
    const hs = location.hash.replace(/^#\/?/, '');
    const parts = hs.split('/');
    renderHeader();
    if (parts[0] === 's') renderStation(parts[1], parseInt(parts[2], 10));
    else if (parts[0] === 'logbuch') renderLog();
    else if (parts[0] === 'urkunde') renderCert();
    else if (parts[0] === 'freischalten') {
      prog.all = true; save();
      go('#/');
      setTimeout(() => alert('Lehrkraft-Modus: Alle Stationen sind auf diesem Gerät freigeschaltet.'), 50);
    } else renderMap();
  }

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Wirklich den gesamten Fortschritt auf diesem Gerät löschen? (Teamname, Kristalle, Messwerte)')) {
      localStorage.removeItem(KEY);
      prog = load();
      go('#/');
    }
  });
  window.addEventListener('hashchange', route);
  route();
})();
