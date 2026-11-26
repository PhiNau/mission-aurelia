/* =========================================================
   content.js – Geschichte, Stationen, Schritte
   Schritt: { kind: 'story'|'info'|'exp'|'task', title, gate, render(el, api) }
   ========================================================= */
(function () {
  'use strict';
  const { h, dialog: D, box } = UI;
  const T = Tasks;

  const P = (html) => h('div', { class: 'prose', html });

  /* ---------- Illustrationen ---------- */
  const SCENE_PROLOG = `
  <svg viewBox="0 0 800 300" class="scene" role="img" aria-label="Sternwarte auf einem Berg bei Nacht, das Fernrohr ist kaputt">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a1c"/><stop offset="1" stop-color="#1b2a5c"/></linearGradient>
      <linearGradient id="tail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7fbff"/><stop offset="1" stop-color="#5fa8ff" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="800" height="300" fill="url(#sky)"/>
    <g fill="#fff">
      <circle cx="60" cy="40" r="1.4"/><circle cx="140" cy="90" r="1"/><circle cx="220" cy="30" r="1.6"/><circle cx="300" cy="70" r="1"/>
      <circle cx="380" cy="25" r="1.2"/><circle cx="470" cy="60" r="1"/><circle cx="520" cy="20" r="1.5"/><circle cx="700" cy="140" r="1"/>
      <circle cx="760" cy="50" r="1.3"/><circle cx="90" cy="150" r="1"/><circle cx="250" cy="130" r="1.1"/><circle cx="430" cy="120" r="0.9"/>
    </g>
    <g class="scene-comet">
      <path d="M640 70 Q700 40 790 10 L795 22 Q705 52 643 76Z" fill="url(#tail)"/>
      <circle cx="640" cy="73" r="7" fill="#e9fdff"/>
    </g>
    <text x="785" y="100" fill="#9fd8ff" font-size="13" text-anchor="end">Komet Aurelia (noch weit weg)</text>
    <path d="M0 300 L0 230 Q120 170 240 200 Q330 120 420 150 Q520 110 600 190 Q700 160 800 220 L800 300Z" fill="#0d1530"/>
    <path d="M0 300 L0 260 Q160 230 300 250 Q450 225 560 250 Q680 235 800 260 L800 300Z" fill="#080e22"/>
    <g transform="translate(370 98)">
      <rect x="-48" y="30" width="96" height="40" fill="#3a4670"/>
      <path d="M-56 32 A56 56 0 0 1 56 32 Z" fill="#c9d1ea"/>
      <rect x="-8" y="-22" width="16" height="54" fill="#1b2340" transform="rotate(25)"/>
      <rect x="-6" y="-58" width="14" height="70" rx="3" fill="#8f9bc4" transform="rotate(-38)"/>
      <circle cx="35" cy="-52" r="4" fill="#9fd8ff" opacity=".8"/><path d="M42 -60 l6 -5 M44 -50 l8 1 M37 -45 l3 7" stroke="#9fd8ff" stroke-width="2"/>
      <rect x="-10" y="45" width="20" height="25" fill="#ffd34d" opacity=".85"/>
    </g>
    <text x="300" y="205" fill="#c9d1ea" font-size="14">Sternwarte Lichtberg</text>
  </svg>`;

  const SCENE_STRAW = `
  <svg viewBox="0 0 320 260" class="mini-fig" role="img" aria-label="Ein Strohhalm im Wasserglas sieht an der Wasseroberfläche geknickt aus">
    <rect x="80" y="40" width="160" height="200" rx="10" fill="rgba(160,220,255,.08)" stroke="#9fd8ff" stroke-width="3"/>
    <rect x="83" y="110" width="154" height="127" rx="8" fill="rgba(80,160,255,.35)"/>
    <line x1="83" y1="110" x2="237" y2="110" stroke="#cfefff" stroke-width="2"/>
    <line x1="40" y1="20" x2="152" y2="110" stroke="#ffb347" stroke-width="10" stroke-linecap="round"/>
    <line x1="152" y1="110" x2="198" y2="215" stroke="#ffb347" stroke-width="10" stroke-linecap="round" opacity=".9"/>
    <line x1="152" y1="110" x2="240" y2="181" stroke="#ffb347" stroke-width="3" stroke-dasharray="6 6" opacity=".7"/>
    <text x="246" y="186" fill="#ffd9a0" font-size="13">wo der Halm</text>
    <text x="246" y="202" fill="#ffd9a0" font-size="13">wirklich ist</text>
    <text x="250" y="105" fill="#cfefff" font-size="14">Wasser-</text>
    <text x="250" y="121" fill="#cfefff" font-size="14">oberfläche</text>
  </svg>`;

  const SCENE_FIBER = `
  <svg viewBox="0 0 420 120" class="mini-fig" role="img" aria-label="Licht wird in einer Glasfaser immer wieder total reflektiert">
    <path d="M10 40 H410 M10 80 H410" stroke="#9fd8ff" stroke-width="3"/>
    <rect x="10" y="40" width="400" height="40" fill="rgba(160,220,255,.15)"/>
    <polyline points="10,62 50,40 110,80 170,40 230,80 290,40 350,80 410,48" fill="none" stroke="#ff5a5a" stroke-width="3"/>
    <text x="10" y="108" fill="#c9d1ea" font-size="13">Glasfaser: Das Licht kann nicht entkommen – Totalreflexion an jeder Wand.</text>
  </svg>`;

  const SCENE_LENSES = `
  <svg viewBox="0 0 420 170" class="mini-fig" role="img" aria-label="Sammellinse ist in der Mitte dick, Zerstreuungslinse ist in der Mitte dünn">
    <path d="M100 20 A160 160 0 0 0 100 150 A160 160 0 0 0 100 20Z" fill="rgba(140,220,255,.3)" stroke="#9fd8ff" stroke-width="2.5"/>
    <text x="100" y="168" fill="#c9d1ea" font-size="14" text-anchor="middle">Sammellinse (konvex)</text>
    <path d="M285 20 L335 20 A110 110 0 0 0 335 150 L285 150 A110 110 0 0 0 285 20Z" fill="rgba(140,220,255,.3)" stroke="#9fd8ff" stroke-width="2.5"/>
    <text x="310" y="168" fill="#c9d1ea" font-size="14" text-anchor="middle">Zerstreuungslinse (konkav)</text>
  </svg>`;

  /* kleines α-β-Diagramm aus den eigenen Messwerten */
  function plotAB(container, vals) {
    const W = 420, H = 300, m = { l: 50, r: 20, t: 20, b: 46 };
    const x = (a) => m.l + (a / 90) * (W - m.l - m.r);
    const y = (b) => H - m.b - (b / 90) * (H - m.t - m.b);
    let g = `<svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="Diagramm: Brechungswinkel beta in Abhängigkeit vom Einfallswinkel alpha">`;
    for (let v = 0; v <= 90; v += 15) {
      g += `<line x1="${x(0)}" y1="${y(v)}" x2="${x(90)}" y2="${y(v)}" class="grid"/><text x="${x(0) - 8}" y="${y(v) + 4}" text-anchor="end">${v}°</text>`;
      g += `<text x="${x(v)}" y="${y(0) + 18}" text-anchor="middle">${v}°</text>`;
    }
    g += `<line x1="${x(0)}" y1="${y(0)}" x2="${x(90)}" y2="${y(90)}" class="ref"/><text x="${x(62)}" y="${y(70)}" class="ref-t">wäre β = α (kein Knick)</text>`;
    let d = '';
    for (let a = 0; a <= 89; a += 1) { const b = Optics.snell(a, 1, 1.5); d += (a ? 'L' : 'M') + x(a).toFixed(1) + ' ' + y(b).toFixed(1); }
    g += `<path d="${d}" class="curve"/>`;
    [0, 20, 40, 60, 80].forEach((a, i) => { if (!isNaN(vals[i])) g += `<circle cx="${x(a)}" cy="${y(vals[i])}" r="5.5" class="pt"/>`; });
    g += `<text x="${(x(0) + x(90)) / 2}" y="${H - 6}" text-anchor="middle" class="ax">Einfallswinkel α (Luft)</text>`;
    g += `<text transform="translate(14 ${(y(0) + y(90)) / 2}) rotate(-90)" text-anchor="middle" class="ax">Brechungswinkel β (Glas)</text></svg>`;
    container.append(h('figure', { class: 'plot-fig' }, h('div', { html: g }), h('figcaption', { html: 'Eure Messpunkte (gelb) und der genaue Verlauf (blau).' })));
  }

  /* =========================================================
     STATIONEN
     ========================================================= */
  function teamStep(el, api) {
    if (api.team) {
      el.append(D([{ who: 'lumi', text: `Ich kenne euch schon: <b>${api.teamHtml}</b>! Ihr könnt den Namen hier noch ändern.` }]));
    } else {
      el.append(D([{ who: 'lumi', text: 'Wie heißt euer Team? Ich speichere den Namen – aber nur hier auf diesem Gerät.' }]));
    }
    const card = T.card(el, 'Teamname');
    const input = h('input', { type: 'text', class: 'text-in', maxlength: 30, placeholder: 'z. B. Die Lichtblitze', value: api.team || '', 'aria-label': 'Teamname' });
    const fb = h('div', { class: 'fb-slot' });
    const go = UI.btn('Speichern', () => {
      const v = input.value.trim();
      fb.innerHTML = '';
      if (v.length < 2) { fb.append(UI.feedback('info', 'Bitte gebt einen Namen mit mindestens 2 Zeichen ein.')); return; }
      api.setTeam(v);
      fb.append(UI.feedback('ok', `Willkommen im Forschungsteam, <b>${UI.esc(v)}</b>! Piep-piep!`));
      api.done();
    }, 'btn-primary');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); });
    card.append(h('div', { class: 'num-row' }, input, go), fb);
    if (api.team) api.done();
  }

  const STATIONS = [];

  /* ---------- PROLOG ---------- */
  STATIONS.push({
    id: 'prolog', nr: 0, title: 'Prolog: Sturm über dem Lichtberg', short: 'Prolog', crystal: false,
    steps: [
      { kind: 'story', title: 'Ein Notruf aus der Sternwarte', render(el) {
        el.append(h('div', { class: 'scene-wrap', html: SCENE_PROLOG }));
        el.append(D([
          { who: 'prof', text: 'Gut, dass ihr da seid! Ich bin <b>Professorin Vega Okular</b>, die Leiterin der Sternwarte Lichtberg. Wir haben ein riesiges Problem.' },
          { who: 'prof', text: 'Letzte Nacht hat ein Sturm unser großes Linsenfernrohr umgeworfen. Die große Glaslinse vorne im Rohr – das <b>Objektiv</b> – ist in tausend Stücke zersprungen.' },
          { who: 'prof', text: 'Und das ausgerechnet jetzt: In <b>8 Nächten</b> zieht der Komet <b>Aurelia</b> an der Erde vorbei. Er kommt nur alle 312 Jahre! Ohne Fernrohr sehen wir von ihm nur einen verschwommenen Fleck.' },
        ]));
      } },
      { kind: 'story', title: 'LUMI braucht Hilfe', render(el) {
        el.append(D([
          { who: 'lumi', text: 'Piep! Hallo! Ich bin <b>LUMI</b>, der Optik-Roboter der Sternwarte. Ich schleife normalerweise die Linsen für die Fernrohre.' },
          { who: 'lumi', text: 'Aber beim Sturm hat ein Blitz meinen <b>Lichtspeicher</b> gelöscht. Ich weiß nicht mehr, wie Licht durch Glas läuft. Ohne dieses Wissen kann ich keine Linse bauen, die funktioniert.' },
          { who: 'prof', text: 'Deshalb brauchen wir euch. Geht mit LUMI durch die <b>8 Stationen</b> der Sternwarte. An jeder Station erforscht ihr ein Stück Lichtphysik – und LUMI bekommt einen <b>Lichtkristall</b> zurück.' },
          { who: 'lumi', text: 'Mit allen 8 Kristallen ist mein Speicher wieder voll und ich kann die neue Linse schleifen. Dann sehen wir Aurelia gestochen scharf!' },
        ]));
      } },
      { kind: 'task', title: 'Euer Forschungsteam', gate: true, render: teamStep },
      { kind: 'info', title: 'So funktioniert der Lernpfad', render(el, api) {
        el.append(P(`<p>Jede Station besteht aus mehreren Schritten. Ihr erkennt sie an diesen Zeichen:</p>`));
        el.append(h('div', { class: 'legend-grid', html: `
          <div><span class="kind-badge k-story">Geschichte</span><p>Was in der Sternwarte passiert.</p></div>
          <div><span class="kind-badge k-learn">Lernabschnitt</span><p>Ihr erkundet ein Phänomen selbst und erarbeitet das Wissen.</p></div>
          <div><span class="kind-badge k-info">Wissen</span><p>Neue Begriffe und Erklärungen.</p></div>
          <div><span class="kind-badge k-exp">Experiment</span><p>Ihr probiert selbst aus – mit Laser und Glas.</p></div>
          <div><span class="kind-badge k-task">Aufgabe</span><p>Erst wenn sie gelöst ist, geht es weiter.</p></div>` }));
        el.append(box('tip', 'Euer Logbuch', 'Am Ende jeder Station bekommt ihr einen <b>Merksatz</b> für euer Logbuch. Ihr findet alle Merksätze oben unter <b>Logbuch</b>. <b>Schreibt sie auch in euer Heft!</b>'));
        el.append(D([{ who: 'lumi', text: `Bereit, <b>${api.teamHtml}</b>? Dann ab zur ersten Station!` }]));
      } },
    ],
  });

  /* ---------- STATION 1 ---------- */
  STATIONS.push({
    id: 's1', nr: 1, title: 'Der geknickte Lichtstrahl', short: 'Der Knick', color: '#ff5a5a',
    merksatz: 'Licht breitet sich in einem Stoff <b>geradlinig</b> aus. Trifft es <b>schräg</b> auf die <b>Grenzfläche</b> zwischen zwei durchsichtigen Stoffen (z. B. Luft und Glas), ändert es dort seine Richtung. Diesen Vorgang nennt man <b>Brechung</b>.',
    steps: [
      { kind: 'story', title: 'Die Werkstatt', render(el) {
        el.append(D([
          { who: 'lumi', text: 'Station 1! An eines erinnere ich mich noch: Licht breitet sich <b>geradlinig</b> aus. Deshalb zeichnen wir Licht als <b>Lichtstrahl</b> – eine gerade Linie mit Pfeil.' },
          { who: 'prof', text: 'Richtig. Aber Licht hat Überraschungen auf Lager! In der Werkstatt liegt ein Glasblock, in dem ein kleiner Kristall eingeschlossen ist.' },
          { who: 'lumi', text: 'Ein Kristall! Den brauche ich! Wenn ihr ihn mit dem Laserstrahl trefft, kann ich seine Energie aufnehmen.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Licht trifft auf Glas', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Bevor ihr den Kristall sucht, untersucht ihr, was mit Licht an einem Glasblock passiert. Dreht den Laser am <b>gelben Griff</b> oder mit dem Regler.</p>',
          sim: (e, cb) => Sims.bench(e, { shape: 'block', onChange: cb }),
          items: [
            { t: 'Lasst den Strahl <b>möglichst steil</b> (fast senkrecht) auf die Oberseite des Glases treffen.', check: (st) => st.inDeg != null && st.inDeg < 25, fb: 'Trifft das Licht fast senkrecht auf, knickt es kaum ab.' },
            { t: 'Lasst den Strahl <b>sehr flach</b> auf das Glas treffen.', check: (st) => st.inDeg != null && st.inDeg > 60, fb: 'Je schräger das Licht auftrifft, desto stärker knickt es an der Oberfläche ab.' },
            { t: 'Schaut genau hin: <b>Wo</b> ändert der Strahl seine Richtung? Ist er im Glas gerade oder krumm?', fb: 'Der Knick passiert nur an der Oberfläche. Im Glas und in der Luft läuft das Licht geradeaus.' },
            { t: 'Vergleicht den Strahl <b>unter</b> dem Glasblock mit der gestrichelten Linie.', fb: 'Unten knickt das Licht noch einmal ab und läuft danach in der alten Richtung weiter – nur seitlich verschoben.' },
          ],
          summary: 'Licht ändert seine Richtung nur an der <b>Grenzfläche</b> zwischen Luft und Glas – und zwar umso stärker, je schräger es auftrifft. Diesen Vorgang nennt man <b>Brechung</b>. Senkrecht auftreffendes Licht geht ohne Knick hindurch.',
        });
      } },
      { kind: 'exp', title: 'Trefft den Kristall!', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Richtet den Laser so aus, dass der Strahl den Kristall im Glasblock trifft. Dreht ihn dazu am <b>gelben Griff</b> (oder benutzt den Regler). Die <b>gestrichelte Linie</b> zeigt, wohin der Laser zielt.</p><p class="dim">Tipp: Zielt zuerst ganz direkt auf den Kristall. Was passiert?</p>'));
        const fb = h('div', { class: 'fb-slot' });
        Sims.target(el, { onHit: () => {
          fb.innerHTML = '';
          fb.append(UI.feedback('ok', '<b>Treffer!</b> Der Kristall leuchtet. Aber habt ihr es gemerkt? Ihr musstet <b>am Kristall vorbei</b> zielen!'));
          api.done();
        } });
        el.append(fb);
      } },
      { kind: 'task', title: 'Warum daneben?', gate: true, render(el, api) {
        el.append(D([{ who: 'lumi', text: 'Seltsam! Warum hat der Laser den Kristall verfehlt, als ihr direkt auf ihn gezielt habt?' }]));
        T.mc(el, { q: 'Welche Erklärung passt zu eurer Beobachtung?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Der Lichtstrahl ändert an der Oberfläche des Glases seine Richtung.', ok: true, fb: 'Genau dort, wo das Licht von der Luft ins Glas übergeht, macht der Strahl einen Knick.' },
          { t: 'Der Laser ist kaputt und schießt schief.', fb: 'Nein – in der Luft lief der Strahl genau auf der gestrichelten Linie. Schaut, wo der Strahl davon abweicht.' },
          { t: 'Der Lichtstrahl wird im Glas immer krummer.', fb: 'Schaut genau hin: Im Glas ist der Strahl wieder eine gerade Linie. Der Knick passiert nur an einer Stelle.' },
          { t: 'Der Kristall stößt das Licht ab.', fb: 'Dann müsste der Strahl erst kurz vor dem Kristall abbiegen. Wo genau knickt er ab?' },
        ] });
      } },
      { kind: 'info', title: 'Brechung – überall im Alltag', render(el) {
        el.append(h('div', { class: 'two-col' },
          h('div', { html: SCENE_STRAW }),
          P(`<p>Trifft Licht <b>schräg</b> auf die Fläche zwischen zwei durchsichtigen Stoffen, ändert es dort seine Richtung. Diesen Vorgang nennt man <b>Brechung</b>.</p>
             <p>Die Fläche, an der zwei Stoffe aneinanderstoßen (z. B. Luft und Glas oder Luft und Wasser), heißt <b>Grenzfläche</b>.</p>
             <p>Innerhalb eines Stoffes läuft das Licht weiter <b>geradeaus</b>.</p>
             <p>Darum sieht ein Strohhalm im Wasserglas geknickt aus: Das Licht vom Halm unter Wasser wird an der Wasseroberfläche gebrochen, bevor es in eure Augen fällt.</p>`)));
        el.append(box('try', 'Probiert es aus: Der Münzversuch', 'Legt eine Münze in eine leere Tasse. Geht so weit zurück, dass die Münze gerade hinter dem Rand verschwindet. Jetzt gießt jemand vorsichtig Wasser in die Tasse – und die Münze taucht wieder auf! <br><b>Warum?</b> Das Licht von der Münze wird an der Wasseroberfläche gebrochen und gelangt so über den Rand in eure Augen.'));
      } },
      { kind: 'task', title: 'Kurzer Check', gate: true, render(el, api) {
        T.mc(el, { q: 'Wo wird Licht gebrochen?', solved: api.solved, onSolved: api.done, options: [
          { t: 'An der Grenzfläche zwischen zwei Stoffen', ok: true, fb: 'Nur dort ändert das Licht seine Richtung.' },
          { t: 'Überall im Inneren des Glases', fb: 'Im Inneren des Glases läuft das Licht geradeaus.' },
          { t: 'Nur in der Luft', fb: 'In der Luft läuft das Licht geradeaus – bis es auf eine Grenzfläche trifft.' },
        ] });
      } },
    ],
  });

  /* ---------- STATION 2 ---------- */
  STATIONS.push({
    id: 's2', nr: 2, title: 'Die Sprache der Optik', short: 'Fachbegriffe', color: '#ff9f43',
    merksatz: 'Das <b>Einfallslot</b> steht im Auftreffpunkt <b>senkrecht</b> (90°) auf der Grenzfläche. Der <b>Einfallswinkel α</b> liegt zwischen einfallendem Strahl und Lot, der <b>Brechungswinkel β</b> zwischen gebrochenem Strahl und Lot. <b>Winkel werden immer zum Lot gemessen.</b>',
    steps: [
      { kind: 'story', title: 'Wie Optiker sprechen', render(el) {
        el.append(D([
          { who: 'lumi', text: 'In meinem Speicher steht nur noch: „Strahl knickt irgendwie ab.“ Das ist mir zu ungenau! Wie stark knickt er denn ab?' },
          { who: 'prof', text: 'Um das genau zu beschreiben, brauchen wir Fachbegriffe. Optikerinnen und Optiker auf der ganzen Welt benutzen dieselben – so verstehen sie sich sofort.' },
          { who: 'prof', text: 'Der wichtigste Begriff ist eine gedachte Hilfslinie: das <b>Einfallslot</b>.' },
        ]));
      } },
      { kind: 'learn', title: 'Lot, Einfallswinkel, Brechungswinkel', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: `<ul>
            <li>Das <b>Einfallslot</b> (kurz: <b>Lot</b>) ist eine gedachte Linie. Sie steht im Auftreffpunkt <b>senkrecht</b> (im 90°-Winkel) auf der Grenzfläche.</li>
            <li>Der <b>Einfallswinkel α</b> (sprich: alpha) liegt zwischen dem <b>einfallenden Strahl</b> und dem Lot.</li>
            <li>Der <b>Brechungswinkel β</b> (sprich: beta) liegt zwischen dem <b>gebrochenen Strahl</b> und dem Lot.</li></ul>`,
          sim: (e, cb) => Sims.diagram(e, { alpha: 50, mode: 'explain', slider: true, onChange: cb }),
          items: [
            { t: 'Stellt <b>α = 0°</b> ein.', check: (st) => st.alpha === 0, fb: 'Das Licht fällt genau entlang des Lots ein: α und β sind beide 0° – kein Knick.' },
            { t: 'Stellt einen <b>sehr großen</b> Einfallswinkel ein (über 75°). Wie groß wird β?', check: (st) => st.alpha > 75, fb: 'β bleibt viel kleiner als α – höchstens etwa 42°. Im Glas liegt der Strahl immer näher am Lot.' },
            { t: 'Zeigt euch gegenseitig am Bildschirm: Zwischen welchen Linien liegt α, zwischen welchen β?', fb: 'α liegt zwischen einfallendem Strahl und Lot, β zwischen gebrochenem Strahl und Lot.' },
          ],
          summary: 'Winkel werden in der Optik <b>immer zum Lot</b> gemessen – <b>nie</b> zur Grenzfläche. Beim Übergang von Luft in Glas ist β kleiner als α.',
        });
      } },
      { kind: 'task', title: 'Beschriftet die Skizze', gate: true, render(el, api) {
        T.labeling(el, {
          q: 'LUMI hat die Beschriftung vergessen. Ordnet die Begriffe richtig zu.',
          solved: api.solved, onSolved: api.done,
          build: (holder) => Sims.diagram(holder, { alpha: 50, mode: 'blank' }),
          items: [
            { zone: 'einfallend', text: 'einfallender Strahl' },
            { zone: 'gebrochen', text: 'gebrochener Strahl' },
            { zone: 'lot', text: 'Einfallslot' },
            { zone: 'grenz', text: 'Grenzfläche' },
            { zone: 'alpha', text: 'α' },
            { zone: 'beta', text: 'β' },
            { zone: 'luft', text: 'Luft' },
            { zone: 'glas', text: 'Glas' },
          ],
        });
      } },
      { kind: 'task', title: 'Welcher Winkel ist es?', gate: true, render(el, api) {
        const need = api.need(2);
        Sims.diagram(el, { alpha: 40, mode: 'angles4' });
        T.mc(el, { q: 'Welcher der vier markierten Winkel ist der <b>Einfallswinkel α</b>?', grid: true, shuffle: false, solved: api.solved, onSolved: need, options: [
          { t: 'Winkel 1', ok: true, fb: 'Winkel 1 liegt zwischen einfallendem Strahl und Lot.' },
          { t: 'Winkel 2', fb: 'Winkel 2 wird zur Grenzfläche gemessen. Winkel misst man aber immer zum Lot!' },
          { t: 'Winkel 3', fb: 'Winkel 3 gehört zum gebrochenen Strahl im Glas.' },
          { t: 'Winkel 4', fb: 'Winkel 4 gehört zum gebrochenen Strahl und wird außerdem zur Grenzfläche gemessen.' },
        ] });
        T.mc(el, { q: 'Und welcher ist der <b>Brechungswinkel β</b>?', grid: true, shuffle: false, solved: api.solved, onSolved: need, options: [
          { t: 'Winkel 1', fb: 'Winkel 1 gehört zum einfallenden Strahl.' },
          { t: 'Winkel 2', fb: 'Winkel 2 gehört zum einfallenden Strahl – und liegt an der Grenzfläche.' },
          { t: 'Winkel 3', ok: true, fb: 'Winkel 3 liegt zwischen gebrochenem Strahl und Lot.' },
          { t: 'Winkel 4', fb: 'Fast! Winkel 4 gehört zwar zum gebrochenen Strahl, wird aber zur Grenzfläche gemessen.' },
        ] });
      } },
    ],
  });

  /* ---------- STATION 3 ---------- */
  const TRUTH_IN = [0, 20, 40, 60, 80].map((a) => Optics.snell(a, 1, 1.5));
  STATIONS.push({
    id: 's3', nr: 3, title: 'Messlabor: Von der Luft ins Glas', short: 'Messlabor', color: '#ffd34d',
    merksatz: 'Geht Licht von <b>Luft in Glas</b> über, wird es <b>zum Lot hin</b> gebrochen: Der Brechungswinkel β ist <b>kleiner</b> als der Einfallswinkel α. Je größer α, desto größer β. Trifft Licht <b>senkrecht</b> auf (α = 0°), geht es <b>ungebrochen</b> hindurch. Verschiedene Stoffe brechen unterschiedlich stark.',
    steps: [
      { kind: 'story', title: 'Die optische Scheibe', render(el) {
        el.append(D([
          { who: 'prof', text: 'Jetzt wird gemessen wie im echten Labor! Das hier ist eine <b>optische Scheibe</b> mit Winkelskala. In der Mitte liegt ein <b>halbrunder Glaskörper</b>.' },
          { who: 'lumi', text: 'Der Laser zielt immer genau auf den Mittelpunkt der geraden Glasseite. Den <b>Einfallswinkel α</b> stellt ihr ein. Den <b>Brechungswinkel β</b> lest ihr an der Skala ab.' },
          { who: 'prof', text: 'Kleiner Trick: Auf der <b>runden</b> Seite trifft das Licht genau senkrecht auf. Dort wird es nicht noch einmal gebrochen. Darum könnt ihr β ganz bequem außen an der Skala ablesen.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Die optische Scheibe', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Macht euch mit der optischen Scheibe vertraut. Dreht den Laser, indem ihr ihn am <b>gestrichelten Ring</b> zieht, oder mit dem Regler.</p>',
          sim: (e, cb) => Sims.disc(e, { mode: 'in', alpha: 30, lupe: false, onChange: cb }),
          items: [
            { t: 'Stellt <b>α = 0°</b> ein.', check: (st) => st.alpha === 0, fb: 'Senkrecht einfallendes Licht geht ohne Knick ins Glas.' },
            { t: 'Stellt etwa <b>α = 45°</b> ein. Liegt der Strahl im Glas näher am Lot oder weiter weg?', check: (st) => st.alpha >= 40 && st.alpha <= 50, fb: 'Näher am Lot: Das Licht wird <b>zum Lot hin</b> gebrochen (β < α).' },
            { t: 'Dreht den Laser ganz weit – über <b>80°</b>.', check: (st) => st.alpha > 80, fb: 'Selbst bei fast 90° bleibt der Strahl im Glas unter etwa 42°.' },
            { t: 'Sucht den <b>schwachen Strahl</b>, der an der Glasoberfläche zurückgeworfen wird.', fb: 'Ein kleiner Teil des Lichts wird immer reflektiert – so wie an einem Spiegel.' },
          ],
          summary: 'Beim Übergang von Luft in Glas wird Licht <b>zum Lot hin</b> gebrochen. Je größer α, desto größer auch β – aber β ist immer kleiner. Wie groß β genau ist, messt ihr jetzt.',
        });
      } },
      { kind: 'exp', title: 'Messreihe aufnehmen', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Stellt nacheinander die Einfallswinkel aus der Tabelle ein. Lest jeweils den Brechungswinkel β an der Skala ab und tragt ihn ein (auf ganze Grad gerundet).</p><p class="dim">Tipp: Schaltet die <b>Lupe</b> ein – dann könnt ihr genauer ablesen. Die Skala zählt von 0° am Lot bis 90° an der Grenzfläche.</p>'));
        Sims.disc(el, { mode: 'in', alpha: 0 });
        const plotSlot = h('div');
        T.table(el, { title: 'Messprotokoll: Luft → Glas', head: ['Einfallswinkel α', 'Brechungswinkel β'], rows: [0, 20, 40, 60, 80], truth: TRUTH_IN, tol: 2,
          prefill: api.get('messung'), solved: api.solved,
          onSolved: (vals) => { api.set('messung', vals); plotAB(plotSlot, vals); api.done(); } });
        el.append(plotSlot);
        if (api.solved && api.get('messung')) plotAB(plotSlot, api.get('messung'));
      } },
      { kind: 'task', title: 'Was verraten die Messwerte?', gate: true, render(el, api) {
        const m = api.get('messung') || TRUTH_IN.map((x) => Math.round(x));
        el.append(h('div', { class: 'mini-table', html: `<table class="mtable"><tr><th>α</th>${[0, 20, 40, 60, 80].map((a) => `<td>${a}°</td>`).join('')}</tr><tr><th>β</th>${m.map((b) => `<td>${UI.fmt(b, 0)}°</td>`).join('')}</tr></table>` }));
        const need = api.need(2);
        T.mc(el, { q: 'Vergleicht α und β. Was fällt euch auf?', solved: api.solved, onSolved: need, options: [
          { t: 'β ist immer kleiner als α (außer bei 0°).', ok: true, fb: 'Der Strahl im Glas liegt immer näher am Lot als der Strahl in der Luft.' },
          { t: 'β ist immer größer als α.', fb: 'Schaut noch einmal in die Tabelle, z. B. bei α = 60°.' },
          { t: 'β ist genauso groß wie α.', fb: 'Dann gäbe es gar keinen Knick! Vergleicht die Zahlen noch einmal.' },
          { t: 'β ist immer genau halb so groß wie α.', fb: 'Prüft α = 80°: β ist etwa 41° – das ist nicht die Hälfte. So einfach ist der Zusammenhang nicht.' },
        ] });
        T.mc(el, { q: 'Was passiert, wenn das Licht senkrecht auf das Glas trifft (α = 0°)?', solved: api.solved, onSolved: need, options: [
          { t: 'Es geht ohne Knick geradeaus weiter.', ok: true, fb: 'Bei α = 0° ist auch β = 0°: keine Richtungsänderung.' },
          { t: 'Es wird besonders stark gebrochen.', fb: 'Schaut in eure Tabelle: Was habt ihr bei α = 0° gemessen?' },
          { t: 'Es wird vollständig zurückgeworfen.', fb: 'Nein, das Licht ist ja ins Glas gelaufen. Schaut euch den Wert in der Tabelle an.' },
        ] });
      } },
      { kind: 'task', title: 'Merksatz: zum Lot hin', gate: true, render(el, api) {
        Sims.diagram(el, { alpha: 55, mode: 'explain' });
        el.append(P('<p>Der gebrochene Strahl im Glas liegt <b>näher am Lot</b> als der einfallende Strahl in der Luft. Man sagt: Das Licht wird <b>zum Lot hin</b> gebrochen.</p>'));
        T.cloze(el, { title: 'Ergänzt den Merksatz für LUMIs Speicher', solved: api.solved, onSolved: api.done, parts: [
          'Beim Übergang von Luft in Glas wird Licht ', { opts: ['zum Lot hin', 'vom Lot weg', 'gar nicht'], a: 'zum Lot hin' }, ' gebrochen. ',
          'Der Brechungswinkel β ist ', { opts: ['kleiner', 'größer'], a: 'kleiner' }, ' als der Einfallswinkel α. ',
          'Je größer α ist, desto ', { opts: ['größer', 'kleiner'], a: 'größer' }, ' ist auch β. ',
          'Trifft das Licht senkrecht auf (α = 0°), wird es ', { opts: ['nicht', 'sehr stark'], a: 'nicht' }, ' gebrochen.',
        ] });
      } },
      { kind: 'exp', title: 'Bonus: Wasser, Glas oder Diamant?', gate: true, render(el, api) {
        el.append(D([{ who: 'lumi', text: 'Ich habe noch Wasser und einen echten Diamanten im Regal gefunden! Brechen die genauso wie Glas?' }]));
        el.append(P('<p><b>Auftrag:</b> Stellt α = 60° ein und wechselt zwischen den drei Stoffen. Jetzt wird β direkt angezeigt.</p>'));
        Sims.disc(el, { mode: 'in', alpha: 60, materials: true, showBeta: true, lupe: false });
        T.mc(el, { q: 'Welcher Stoff bricht das Licht am stärksten (lenkt es am stärksten zum Lot hin)?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Diamant', ok: true, fb: 'Diamant bricht das Licht viel stärker als Glas und Wasser. Darum funkeln Diamanten so!' },
          { t: 'Glas', fb: 'Glas bricht stärker als Wasser – aber nicht am stärksten.' },
          { t: 'Wasser', fb: 'Wasser bricht am schwächsten von den dreien. Vergleicht β!' },
          { t: 'Alle gleich stark', fb: 'Vergleicht die angezeigten Werte für β genau.' },
        ] });
        el.append(box('info', 'Optisch dichter', 'Ein Stoff, der das Licht stärker bricht, heißt <b>optisch dichter</b>. Diamant ist optisch dichter als Glas, Glas optisch dichter als Wasser, Wasser optisch dichter als Luft.'));
      } },
    ],
  });

  /* ---------- STATION 4 ---------- */
  STATIONS.push({
    id: 's4', nr: 4, title: 'Der Rückweg: Vom Glas in die Luft', short: 'Glas → Luft', color: '#7bed9f',
    merksatz: 'Geht Licht von <b>Glas in Luft</b> über, wird es <b>vom Lot weg</b> gebrochen: Der Winkel in der Luft ist <b>größer</b> als der Winkel im Glas. Der Lichtweg ist <b>umkehrbar</b>. Ist der Winkel im Glas größer als etwa <b>42°</b>, kommt kein Licht mehr heraus: <b>Totalreflexion</b>.',
    steps: [
      { kind: 'story', title: 'Raus aus dem Glas', render(el) {
        el.append(D([
          { who: 'lumi', text: 'Mir fällt etwas ein: In einer Linse muss das Licht nicht nur <b>ins</b> Glas hinein – es muss auch wieder <b>heraus</b>!' },
          { who: 'prof', text: 'Sehr gut aufgepasst! Wir drehen den Versuch einfach um: Jetzt kommt der Laser von unten durch den Glaskörper und tritt oben in die Luft aus.' },
        ]));
      } },
      { kind: 'task', title: 'Eure Vermutung', gate: true, render(el, api) {
        el.append(P('<p>Das Licht läuft im Glas mit α = 30° auf die Grenzfläche zu. <b>Wie geht es in der Luft weiter?</b> Entscheidet euch für einen Strahl – erst dann wird der Laser eingeschaltet.</p>'));
        const sim = Sims.disc(el, { mode: 'out', alpha: 30, lupe: false, showBeta: true, static: !api.solved });
        T.predict(el, { sim, q: 'Welcher Strahl ist richtig?', solved: api.solved, onSolved: api.done,
          fbRight: 'Beim Austritt in die Luft wird das Licht <b>vom Lot weg</b> gebrochen.',
          fbWrong: () => 'Seht ihr? Der Strahl wird <b>vom Lot weg</b> gebrochen – genau andersherum als beim Eintritt ins Glas.' });
      } },
      { kind: 'learn', title: 'Erkunden: Licht verlässt das Glas', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Jetzt läuft das Licht im Glas und tritt oben in die Luft aus. β wird direkt angezeigt.</p>',
          sim: (e, cb) => Sims.disc(e, { mode: 'out', alpha: 10, lupe: false, showBeta: true, onChange: cb }),
          items: [
            { t: 'Stellt etwa <b>α = 20°</b> ein und vergleicht α und β.', check: (st) => st.alpha >= 18 && st.alpha <= 22, fb: 'β ist größer als α: Beim Austritt wird das Licht <b>vom Lot weg</b> gebrochen.' },
            { t: 'Dreht langsam weiter, bis der Strahl in der Luft <b>fast an der Glasoberfläche entlangläuft</b>.', check: (st) => st.beta != null && st.beta > 70 && !st.tir, fb: 'Bei etwa 40° ist β schon fast 90°.' },
            { t: 'Dreht noch ein kleines Stück weiter.', check: (st) => st.tir, fb: 'Jetzt kommt gar kein Licht mehr heraus – es wird vollständig zurückgeworfen: <b>Totalreflexion</b>.' },
            { t: 'Beobachtet den zurückgeworfenen Strahl im Glas, während ihr hin- und herdreht. Wann wird er hell?', fb: 'Je näher ihr an etwa 42° kommt, desto mehr Licht wird reflektiert – darüber alles.' },
          ],
          summary: 'Glas → Luft: Das Licht wird <b>vom Lot weg</b> gebrochen. Ab einem Grenzwinkel von etwa <b>42°</b> tritt kein Licht mehr aus: <b>Totalreflexion</b>.',
        });
      } },
      { kind: 'task', title: 'Der Lichtweg ist umkehrbar', gate: true, render(el, api) {
        const m = api.get('messung');
        const b40 = m && !isNaN(m[2]) ? Math.round(m[2]) : 25;
        el.append(D([{ who: 'prof', text: `Erinnert ihr euch an euer Messlabor? Licht aus der Luft mit <b>α = 40°</b> lief im Glas mit <b>β ≈ ${b40}°</b> weiter.` }]));
        const slot = h('div', { class: 'sim-block' });
        T.numeric(el, { q: `Jetzt läuft das Licht genau <b>andersherum</b>: Es trifft im Glas mit <b>${b40}°</b> auf die Grenzfläche. Unter welchem Winkel zum Lot tritt es in die Luft aus? Vermutet!`, answer: 40, tol: 3, unit: '°',
          solved: api.solved, hint: 'Stellt euch vor, ihr spult einen Film rückwärts ab. Das Licht nimmt denselben Weg – nur in die andere Richtung.',
          fbHigh: 'Zu groß. Denkt an euer Messlabor: Welcher Winkel in der Luft gehörte zu diesem Winkel im Glas?',
          fbLow: 'Zu klein. Beim Austritt wird das Licht vom Lot weg gebrochen – der Winkel in der Luft ist also größer.',
          fbOk: 'Der Lichtweg ist <b>umkehrbar</b>: Das Licht nimmt rückwärts genau denselben Weg. Prüft es im Experiment nach!',
          onSolved: () => { show(); api.done(); } });
        el.append(slot);
        function show() {
          slot.innerHTML = '';
          slot.append(P(`<p><b>Experiment:</b> Stellt α = ${b40}° ein und lest den Winkel in der Luft ab.</p>`));
          Sims.disc(slot, { mode: 'out', alpha: b40, lupe: true, showBeta: true });
        }
        if (api.solved) show();
      } },
      { kind: 'task', title: 'Merksatz: vom Lot weg', gate: true, render(el, api) {
        T.cloze(el, { title: 'Ergänzt den Merksatz', solved: api.solved, onSolved: api.done, parts: [
          'Beim Übergang von Glas in Luft wird Licht ', { opts: ['zum Lot hin', 'vom Lot weg', 'gar nicht'], a: 'vom Lot weg' }, ' gebrochen. ',
          'Der Winkel in der Luft ist dann ', { opts: ['größer', 'kleiner'], a: 'größer' }, ' als der Winkel im Glas. ',
          'Kehrt man die Richtung des Lichts um, nimmt es ', { opts: ['denselben Weg', 'einen anderen Weg'], a: 'denselben Weg' }, '.',
        ] });
        el.append(box('info', 'Kurz gesagt', '<b>Luft → Glas:</b> zum Lot hin.<br><b>Glas → Luft:</b> vom Lot weg.'));
      } },
      { kind: 'exp', title: 'Bonus: Wo bleibt das Licht?', gate: true, render(el, api) {
        el.append(D([{ who: 'lumi', text: 'Hilfe! Als ich den Laser weiter gedreht habe, kam plötzlich <b>gar kein Licht</b> mehr aus dem Glas heraus!' }]));
        el.append(P('<p><b>Auftrag:</b> Dreht den Laser langsam von 30° aus weiter. Beobachtet den Strahl in der Luft und den zurückgeworfenen Strahl im Glas.</p>'));
        Sims.disc(el, { mode: 'out', alpha: 30, lupe: false, showBeta: true });
        T.numeric(el, { q: 'Ab welchem Einfallswinkel α (im Glas) tritt <b>kein Licht mehr</b> in die Luft aus?', answer: 42, tol: 1.5, unit: '°', solved: api.solved, onSolved: api.done,
          fbHigh: 'Schon etwas früher verschwindet der Strahl in der Luft. Dreht in 1°-Schritten.', fbLow: 'Bei diesem Winkel tritt noch Licht aus. Dreht weiter!',
          fbOk: 'Ab etwa 42° wird das Licht vollständig zurückgeworfen.' });
        el.append(box('info', 'Totalreflexion', 'Ist der Winkel im Glas größer als etwa 42°, kann das Licht nicht mehr in die Luft austreten. Es wird vollständig an der Grenzfläche zurückgeworfen. Das nennt man <b>Totalreflexion</b>.'));
        el.append(h('div', { html: SCENE_FIBER }));
        el.append(P('<p class="dim">So funktionieren <b>Glasfaserkabel</b> für schnelles Internet und die Lichtleiter, mit denen Ärztinnen und Ärzte in den Körper schauen (Endoskop).</p>'));
      } },
    ],
  });

  /* ---------- STATION 5 ---------- */
  STATIONS.push({
    id: 's5', nr: 5, title: 'Glasquader und Prisma', short: 'Prisma', color: '#4fd1ff',
    merksatz: 'In einem Glaskörper wird Licht <b>zweimal</b> gebrochen: beim Eintritt <b>zum Lot hin</b>, beim Austritt <b>vom Lot weg</b>. Beim <b>Glasquader</b> läuft das Licht danach <b>parallel versetzt</b> weiter. Ein <b>Prisma</b> lenkt das Licht immer <b>zur dicken Seite (Basis)</b> hin ab.',
    steps: [
      { kind: 'story', title: 'Zwei Grenzflächen', render(el) {
        el.append(D([
          { who: 'prof', text: 'Eine Linse hat <b>zwei</b> Grenzflächen: vorne und hinten. Bevor wir eine Linse bauen, untersuchen wir einfachere Glaskörper mit zwei Flächen.' },
          { who: 'lumi', text: 'Hier im Regal liegen ein <b>Glasquader</b> und ein <b>Prisma</b>. Ein Prisma ist ein Glaskörper mit dreieckiger Grundfläche.' },
        ]));
      } },
      { kind: 'exp', title: 'Der Glasquader', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Dreht den Laser und beobachtet: Wie läuft der Strahl <b>nach</b> dem Quader weiter? Vergleicht mit der gestrichelten Linie (ursprüngliche Richtung).</p>'));
        Sims.bench(el, { shape: 'block' });
        T.mc(el, { q: 'Wie läuft der Strahl hinter dem Glasquader weiter?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Parallel zum einfallenden Strahl, aber seitlich verschoben', ok: true, fb: 'Oben wird das Licht zum Lot hin gebrochen, unten genauso stark vom Lot weg. Die Richtung ist wieder die alte – nur verschoben. Das nennt man <b>Parallelversatz</b>.' },
          { t: 'Genau auf der gestrichelten Linie', fb: 'Schaut genau hin: Der Strahl liegt neben der gestrichelten Linie.' },
          { t: 'In derselben Richtung wie im Glas', fb: 'Beim Austritt wird das Licht noch einmal gebrochen – und zwar vom Lot weg.' },
          { t: 'In eine ganz neue Richtung', fb: 'Vergleicht die Richtung mit der gestrichelten Linie: Sind die Linien parallel?' },
        ] });
      } },
      { kind: 'learn', title: 'Erkunden: Licht im Prisma', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Ein Prisma ist ein Glaskörper mit dreieckiger Grundfläche. Seine beiden Flächen sind <b>nicht parallel</b>. Dreht den Laser am gelben Griff.</p>',
          sim: (e, cb) => Sims.bench(e, { shape: 'prism', allowFlip: true, onChange: cb }),
          items: [
            { t: 'Verfolgt den Strahl durch das Prisma und vergleicht ihn mit der gestrichelten Linie.', fb: 'Das Licht knickt zweimal ab – und beide Male in dieselbe Richtung.' },
            { t: 'Dreht den Laser deutlich nach oben oder unten.', check: (st) => st.shape === 'prism' && Math.abs(st.ang - (st.flip ? 8 : -8)) >= 12, fb: 'Die Stärke der Ablenkung ändert sich – die Richtung aber nicht.' },
            { t: 'Dreht das <b>Prisma um</b>.', check: (st) => st.flip, fb: 'Jetzt liegt die dicke Seite oben – und das Licht wird nach oben abgelenkt.' },
          ],
          summary: 'Ein Prisma lenkt Licht immer <b>zur dicken Seite (Basis)</b> hin ab – egal, wie es liegt.',
        });
      } },
      { kind: 'task', title: 'Vermutung: das Prisma', gate: true, render(el, api) {
        el.append(P('<p>Beim Prisma sind die beiden Flächen <b>nicht parallel</b>. Wie läuft das Licht hinter dem Prisma weiter? Entscheidet euch – dann wird der Strahl sichtbar.</p>'));
        const sim = Sims.bench(el, { shape: 'prism' });
        T.predict(el, { sim, q: 'Welcher Strahl ist richtig?', solved: api.solved, onSolved: api.done,
          fbRight: 'Das Licht wird zweimal gebrochen und beide Male in dieselbe Richtung abgelenkt – nach unten, zur dicken Seite.',
          fbWrong: () => 'Das Licht wird zweimal gebrochen und dabei <b>zur dicken Seite</b> des Prismas hin abgelenkt.' });
      } },
      { kind: 'exp', title: 'Das Prisma untersuchen', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Dreht den Laser in verschiedene Richtungen. Dreht auch das Prisma einmal um. In welche Richtung wird das Licht abgelenkt?</p>'));
        Sims.bench(el, { shape: 'prism', allowFlip: true });
        T.mc(el, { q: 'Wohin lenkt ein Prisma das Licht ab?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Immer zur dicken Seite (Basis) hin', ok: true, fb: 'Egal wie das Prisma liegt: Das Licht wird zur Basis hin abgelenkt.' },
          { t: 'Immer zur Spitze hin', fb: 'Vergleicht den Strahl mit der gestrichelten Linie: Wohin weicht er ab?' },
          { t: 'Immer nach unten', fb: 'Dreht das Prisma einmal um! Was passiert dann?' },
          { t: 'Gar nicht – es entsteht nur ein Parallelversatz', fb: 'Das gilt für den Quader. Beim Prisma ändert sich die Richtung.' },
        ] });
      } },
      { kind: 'task', title: 'Prisma auf dem Kopf', gate: true, render(el, api) {
        el.append(D([{ who: 'lumi', text: 'Und wenn das Prisma auf dem Kopf steht? Zeigt mir, dass ihr es verstanden habt!' }]));
        const sim = Sims.bench(el, { shape: 'prism', flip: true });
        T.predict(el, { sim, q: 'Wie läuft der Strahl hinter dem umgedrehten Prisma weiter?', solved: api.solved, onSolved: (ok) => { api.done(); },
          fbRight: 'Die dicke Seite ist jetzt oben – also wird das Licht nach oben abgelenkt.',
          fbWrong: () => 'Die Basis (dicke Seite) ist jetzt oben – deshalb wird das Licht nach oben abgelenkt.' });
      } },
    ],
  });

  /* ---------- STATION 6 ---------- */
  STATIONS.push({
    id: 's6', nr: 6, title: 'Aus Prismen wird eine Linse', short: 'Linsen', color: '#6c7bff',
    merksatz: 'Eine <b>Sammellinse</b> (in der Mitte dicker) wirkt wie ein Stapel aus Prismen. Strahlen, die <b>parallel zur optischen Achse</b> einfallen, treffen sich hinter der Linse im <b>Brennpunkt F</b>. Der Abstand von der Linsenmitte bis F ist die <b>Brennweite f</b>. Je <b>stärker</b> die Linse gewölbt ist, desto <b>kürzer</b> ist die Brennweite. Eine <b>Zerstreuungslinse</b> (in der Mitte dünner) lässt parallele Strahlen <b>auseinanderlaufen</b>.',
    steps: [
      { kind: 'story', title: 'LUMIs Idee', render(el) {
        el.append(D([
          { who: 'lumi', text: 'Mir kommt eine Idee! Ein Prisma lenkt Licht zur dicken Seite ab. Was, wenn ich mehrere Prismen übereinander staple?' },
          { who: 'lumi', text: 'In die Mitte lege ich einen Quader. <b>Oben</b> ein Prisma mit der Spitze nach oben, <b>unten</b> eins mit der Spitze nach unten. So zeigen alle dicken Seiten zur Mitte!' },
          { who: 'prof', text: 'Genial, LUMI! Genau so kann man sich eine Linse vorstellen. Probieren wir es mit parallelem Licht aus.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Vom Prisma zur Linse', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Parallele Lichtstrahlen fallen von links ein. Wechselt zwischen den Glaskörpern und verändert die Wölbung.</p>',
          sim: (e, cb) => Sims.lensBench(e, { kind: 'prisms', kinds: ['prisms', 'convex', 'concave'], R: 320, curvature: true, onChange: cb }),
          items: [
            { t: 'Schaut euch den <b>Prismenstapel</b> an: Wohin lenkt jedes Stück das Licht?', check: (st) => st.kind === 'prisms', fb: 'Jedes Stück lenkt zu seiner dicken Seite – und die zeigt immer zur Mitte.' },
            { t: 'Schaltet auf <b>Sammellinse</b>. Wo treffen sich die Strahlen?', check: (st) => st.kind === 'convex', fb: 'Fast genau in einem Punkt hinter der Linse: dem <b>Brennpunkt F</b>.' },
            { t: 'Macht die Sammellinse <b>stärker gewölbt</b>.', check: (st) => st.kind === 'convex' && st.R < 210, fb: 'Der Brennpunkt rückt näher an die Linse: Die <b>Brennweite</b> wird kürzer.' },
            { t: 'Schaltet auf <b>Zerstreuungslinse</b>.', check: (st) => st.kind === 'concave', fb: 'Die Strahlen laufen auseinander – als kämen sie von einem Punkt vor der Linse.' },
          ],
          summary: 'Eine <b>Sammellinse</b> (in der Mitte dick) wirkt wie ein Prismenstapel und sammelt paralleles Licht im <b>Brennpunkt F</b>. Je stärker gewölbt, desto kürzer die <b>Brennweite f</b>. Eine <b>Zerstreuungslinse</b> (in der Mitte dünn) lässt Licht auseinanderlaufen.',
        });
      } },
      { kind: 'exp', title: 'Der Prismenstapel', gate: true, render(el, api) {
        Sims.lensBench(el, { kind: 'prisms', R: 200, showF: false });
        const need = api.need(2);
        T.mc(el, { q: 'Was passiert mit den parallelen Lichtstrahlen hinter dem Prismenstapel?', solved: api.solved, onSolved: need, options: [
          { t: 'Sie werden zur Mitte hin abgelenkt und treffen sich ungefähr in einem Bereich.', ok: true, fb: 'Jedes Prisma lenkt zu seiner dicken Seite ab – und die zeigt zur Mitte.' },
          { t: 'Sie laufen parallel weiter.', fb: 'Schaut hinter den Stapel: Laufen die Strahlen wirklich parallel?' },
          { t: 'Sie laufen auseinander.', fb: 'Schaut genau hin: Die Strahlen nähern sich einander an.' },
        ] });
        T.mc(el, { q: 'Die äußeren Prismen haben stärker geneigte Flächen. Wie stark werden die äußeren Strahlen abgelenkt?', solved: api.solved, onSolved: need, options: [
          { t: 'Stärker als die inneren Strahlen', ok: true, fb: 'Darum können sich alle Strahlen fast in einem Punkt treffen: Die äußeren müssen ja einen weiteren Weg zur Mitte zurücklegen.' },
          { t: 'Schwächer als die inneren Strahlen', fb: 'Vergleicht die Knicke des obersten und des mittleren Strahls.' },
          { t: 'Alle gleich stark', fb: 'Der mittlere Strahl wird gar nicht abgelenkt – der äußerste dagegen deutlich.' },
        ] });
      } },
      { kind: 'info', title: 'Die Sammellinse', render(el) {
        el.append(P('<p>Schleift man die Kanten des Prismenstapels glatt, entsteht eine <b>Sammellinse</b>. Schaltet zwischen den beiden Formen um:</p>'));
        Sims.lensBench(el, { kind: 'convex', kinds: ['prisms', 'convex'], R: 190, labels: true });
        el.append(P(`<ul>
          <li>Eine Sammellinse ist in der Mitte <b>dicker</b> als am Rand (<b>konvex</b>).</li>
          <li>Die <b>optische Achse</b> ist die Symmetrieachse durch die Mitte der Linse.</li>
          <li>Strahlen, die <b>parallel zur optischen Achse</b> einfallen, treffen sich hinter der Linse in einem Punkt: dem <b>Brennpunkt F</b>.</li>
          <li>Der Abstand von der Linsenmitte zum Brennpunkt heißt <b>Brennweite f</b>.</li></ul>`));
        el.append(box('info', 'Genau hingeschaut', 'Bei einer echten Linse treffen sich die ganz äußeren Strahlen etwas früher. Das ist normal – gute Fernrohre gleichen das mit mehreren Linsen aus.'));
      } },
      { kind: 'task', title: 'Beschriftet die Linse', gate: true, render(el, api) {
        T.labeling(el, { q: 'Ordnet die Begriffe richtig zu.', solved: api.solved, onSolved: api.done,
          build: (holder) => {
            const lb = Sims.lensBench(holder, { kind: 'convex', R: 230, bare: true, markLabels: false });
            const F = lb.state.F;
            return { stage: lb.stage, zones: {
              achse: { x: 720, y: lb.AX - 26 },
              F: { x: F.x + 2, y: lb.AX + 34 },
              f: { x: (lb.CX + F.x) / 2, y: lb.AX + lb.A + 40 },
              linse: { x: lb.CX, y: lb.AX - lb.A - 30 },
            } };
          },
          items: [
            { zone: 'achse', text: 'optische Achse' },
            { zone: 'F', text: 'Brennpunkt F' },
            { zone: 'f', text: 'Brennweite f' },
            { zone: 'linse', text: 'Sammellinse' },
          ] });
      } },
      { kind: 'exp', title: 'Dicke oder dünne Linse?', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> LUMI kann die Linse unterschiedlich stark wölben. Verändert die Wölbung und beobachtet den Brennpunkt.</p>'));
        Sims.lensBench(el, { kind: 'convex', R: 300, curvature: true });
        T.mc(el, { q: 'Wie hängt die Brennweite von der Wölbung ab?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Je stärker die Linse gewölbt ist, desto kürzer ist die Brennweite.', ok: true, fb: 'Stärker gewölbt = stärker geneigte Flächen = stärkere Ablenkung. Die Strahlen treffen sich früher.' },
          { t: 'Je stärker die Linse gewölbt ist, desto länger ist die Brennweite.', fb: 'Schaut, wohin der Brennpunkt wandert, wenn ihr die Wölbung erhöht.' },
          { t: 'Die Wölbung hat keinen Einfluss.', fb: 'Bewegt den Regler noch einmal und beobachtet F.' },
        ] });
      } },
      { kind: 'exp', title: 'Die Zerstreuungslinse', gate: true, render(el, api) {
        el.append(h('div', { html: SCENE_LENSES }));
        el.append(P('<p>Es gibt auch Linsen, die in der Mitte <b>dünner</b> sind als am Rand: <b>Zerstreuungslinsen</b> (konkav). Hier zeigen die dicken Seiten der „Prismen“ nach außen.</p><p><b>Auftrag:</b> Beobachtet die Strahlen. Schaltet dann die Rückverlängerung ein.</p>'));
        Sims.lensBench(el, { kind: 'concave', R: 220, extensions: 'toggle' });
        T.mc(el, { q: 'Was macht eine Zerstreuungslinse mit parallelem Licht?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Die Strahlen laufen auseinander – so, als kämen sie von einem Punkt vor der Linse.', ok: true, fb: 'Dieser Punkt heißt <b>scheinbarer (virtueller) Brennpunkt</b>. Dort treffen sich nur die gedachten Rückverlängerungen, nicht das echte Licht.' },
          { t: 'Die Strahlen treffen sich hinter der Linse in einem Punkt.', fb: 'Das macht die Sammellinse. Schaut genau hin!' },
          { t: 'Die Strahlen laufen unverändert weiter.', fb: 'Nur der mittlere Strahl läuft geradeaus. Die anderen?' },
        ] });
      } },
    ],
  });

  /* ---------- STATION 7 ---------- */
  function mission(el, api, o) {
    el.append(P(o.text));
    const slot = h('div', { class: 'mission-slot' });
    const showQ = () => {
      if (slot.childElementCount) return;
      slot.append(UI.feedback('ok', o.success));
      T.mc(slot, { q: o.q, options: o.options, solved: api.solved, onSolved: api.done });
    };
    const status = h('div', { class: 'mission-status' }, '🎯 Mission läuft …');
    Sims.thinLens(el, Object.assign({ goal: o.goal, onGoal: () => { status.textContent = '✅ Mission erfüllt!'; status.classList.add('done'); showQ(); } }, o.sim || {}));
    el.append(status, slot);
    if (api.solved) { status.textContent = '✅ Mission erfüllt!'; status.classList.add('done'); showQ(); }
  }
  STATIONS.push({
    id: 's7', nr: 7, title: 'Drei besondere Strahlen', short: 'Strahlen', color: '#b47cff',
    merksatz: 'Für Zeichnungen tut man so, als würde das Licht nur <b>einmal an der Mittelebene</b> der Linse abknicken. Drei Strahlen kann man ohne Messen zeichnen:<br>• <b>Parallelstrahl</b> → wird zum <b>Brennpunktstrahl</b> (läuft durch F).<br>• <b>Mittelpunktstrahl</b> → läuft <b>ungeknickt</b> weiter.<br>• <b>Brennpunktstrahl</b> → wird zum <b>Parallelstrahl</b>.',
    steps: [
      { kind: 'learn', title: 'Ein Trick für Zeichnungen', gate: true, render(el, api) {
        el.append(D([
          { who: 'prof', text: 'Optikerinnen und Optiker zeichnen Linsen meist vereinfacht: Sie tun so, als würde das Licht nur <b>einmal</b> abknicken – an der <b>Mittelebene</b> der Linse.' },
          { who: 'lumi', text: 'Aber das Licht wird doch zweimal gebrochen – vorne und hinten, wie beim Prisma! Ist das nicht geschummelt?' },
          { who: 'prof', text: 'Ein bisschen. Aber für Strahlen nahe der optischen Achse kommt fast dasselbe heraus. Prüft es selbst!' },
        ]));
        let seenReal = false;
        T.learn(el, api, {
          intro: '<p class="dim">Zieht den Laser nach oben oder unten. Dreht ihn am <b>gelben Griff</b>. Die beiden Punkte <b>F</b> sind die Brennpunkte – eine Linse hat auf jeder Seite einen.</p>',
          sim: (e, cb) => Sims.thinLens(e, { y: 190, ang: 0, onChange: cb }),
          items: [
            { t: 'Schaltet auf <b>„Echte Linse“</b>. Wie oft knickt der Strahl ab?', check: (st) => st.mode === 'real', fb: 'Zweimal: beim Eintritt und beim Austritt – wie beim Prisma.' },
            { t: 'Schaltet zurück auf <b>„Vereinfacht“</b> und vergleicht die Richtung hinter der Linse.', check: (st) => { if (st.mode === 'real') seenReal = true; return seenReal && st.mode === 'ideal'; }, fb: 'Hinter der Linse laufen beide Strahlen fast gleich. Für Zeichnungen reicht ein Knick an der Mittelebene.' },
            { t: 'Schickt den Strahl <b>ganz außen</b> durch die Linse (weit weg von der Achse).', check: (st) => Math.abs(st.yLens) > 70 && st.hitsLens, fb: 'Ganz außen weichen echte Linse und Zeichnung stärker voneinander ab.' },
          ],
          summary: 'In Zeichnungen lassen wir das Licht nur <b>einmal an der Mittelebene</b> abknicken. Für Strahlen nicht zu weit von der Achse stimmt das gut mit der echten Linse überein.',
        });
      } },
      { kind: 'exp', title: 'Mission 1: Der Parallelstrahl', gate: true, render(el, api) {
        mission(el, api, {
          text: '<p><b>Mission:</b> Stellt den Laser so ein, dass der Strahl <b>parallel zur optischen Achse</b> auf die Linse trifft (Neigung 0°) – aber nicht genau auf der Achse.</p>',
          sim: { y: 180, ang: 6 },
          goal: (s) => Math.abs(s.inDeg) < 0.3 && Math.abs(s.yLaser) > 25 && s.hitsLens && s.mode === 'ideal',
          success: '<b>Parallelstrahl eingestellt!</b> Schaut genau, wo der Strahl hinter der Linse die Achse kreuzt. Probiert auch andere Höhen.',
          q: 'Wo läuft ein Parallelstrahl hinter der Linse hin?',
          options: [
            { t: 'Durch den Brennpunkt F hinter der Linse', ok: true, fb: 'Der <b>Parallelstrahl</b> wird zum <b>Brennpunktstrahl</b>.' },
            { t: 'Durch den Brennpunkt F vor der Linse', fb: 'Der liegt ja auf der anderen Seite. Wo kreuzt der Strahl die Achse?' },
            { t: 'Er läuft parallel weiter.', fb: 'Dann wäre die Linse wirkungslos. Schaut noch einmal hin!' },
          ],
        });
      } },
      { kind: 'exp', title: 'Mission 2: Der Mittelpunktstrahl', gate: true, render(el, api) {
        mission(el, api, {
          text: '<p><b>Mission:</b> Schickt den Strahl <b>schräg</b> (Neigung mindestens 5°) genau durch die <b>Mitte der Linse</b>.</p>',
          sim: { y: 150, ang: 0 },
          goal: (s) => Math.abs(s.yLens) < 3 && Math.abs(s.inDeg) >= 5 && s.mode === 'ideal',
          success: '<b>Volltreffer in der Mitte!</b> Vergleicht die Neigung vor und nach der Linse.',
          q: 'Was passiert mit einem Strahl, der durch die Linsenmitte geht?',
          options: [
            { t: 'Er läuft ohne Knick geradeaus weiter.', ok: true, fb: 'Der <b>Mittelpunktstrahl</b> wird nicht abgelenkt. In der Mitte sind die beiden Linsenflächen fast parallel – wie bei einem dünnen Quader.' },
            { t: 'Er läuft danach durch den Brennpunkt.', fb: 'Vergleicht die Neigung vor und nach der Linse.' },
            { t: 'Er läuft danach parallel zur Achse.', fb: 'Schaut auf die Anzeige der Neigung nach der Linse.' },
          ],
        });
      } },
      { kind: 'exp', title: 'Mission 3: Der Brennpunktstrahl', gate: true, render(el, api) {
        mission(el, api, {
          text: '<p><b>Mission:</b> Bringt den Strahl dazu, dass er <b>hinter</b> der Linse <b>parallel zur Achse</b> läuft (Neigung nach der Linse 0°).</p><p class="dim">Tipp: Denkt an Station 4 – der Lichtweg ist umkehrbar!</p>',
          sim: { y: 160, ang: 0 },
          goal: (s) => Math.abs(s.outDeg) < 0.8 && Math.abs(s.yLens) > 15 && Math.abs(s.inDeg) > 3 && s.hitsLens && s.mode === 'ideal',
          success: '<b>Geschafft!</b> Hinter der Linse läuft der Strahl parallel zur Achse. Schaut euch an, wo er <b>vor</b> der Linse die Achse kreuzt.',
          q: 'Durch welchen Punkt läuft der Strahl vor der Linse?',
          options: [
            { t: 'Durch den Brennpunkt F vor der Linse', ok: true, fb: 'Der <b>Brennpunktstrahl</b> wird zum <b>Parallelstrahl</b> – genau umgekehrt wie bei Mission 1.' },
            { t: 'Durch die Linsenmitte', fb: 'Dann wäre es ein Mittelpunktstrahl – der läuft schräg weiter.' },
            { t: 'Durch gar keinen besonderen Punkt', fb: 'Schaut, wo euer Strahl vor der Linse die Achse kreuzt.' },
          ],
        });
      } },
      { kind: 'task', title: 'Die drei Strahlen im Überblick', gate: true, render(el, api) {
        T.cloze(el, { title: 'Ordnet zu', q: 'Was wird aus den drei besonderen Strahlen hinter der Sammellinse?', solved: api.solved, onSolved: api.done, parts: [
          '<b>Parallelstrahl</b> → ', { opts: ['Brennpunktstrahl', 'Parallelstrahl', 'läuft ungeknickt weiter'], a: 'Brennpunktstrahl' }, { br: true },
          '<b>Mittelpunktstrahl</b> → ', { opts: ['Brennpunktstrahl', 'Parallelstrahl', 'läuft ungeknickt weiter'], a: 'läuft ungeknickt weiter' }, { br: true },
          '<b>Brennpunktstrahl</b> → ', { opts: ['Brennpunktstrahl', 'Parallelstrahl', 'läuft ungeknickt weiter'], a: 'Parallelstrahl' },
        ] });
      } },
    ],
  });

  /* ---------- STATION 8 ---------- */
  STATIONS.push({
    id: 's8', nr: 8, title: 'Finale: Die neue Fernrohrlinse', short: 'Finale', color: '#ff6fcf',
    merksatz: 'Licht von sehr weit entfernten Objekten (Sterne, Kometen) kommt <b>parallel</b> bei uns an. Die <b>Sammellinse</b> vorne im Fernrohr (das <b>Objektiv</b>) sammelt es im <b>Brennpunkt</b>. Damit das Bild scharf ist, muss die <b>Brennweite</b> zum Abstand zwischen Linse und Okular passen. Kürzeres Fernrohr → stärker gewölbte Linse.',
    steps: [
      { kind: 'story', title: 'Die letzte Nacht', render(el) {
        el.append(D([
          { who: 'lumi', text: 'Piep-piep! Sieben Kristalle – mein Lichtspeicher ist fast voll! Ich kann die neue Linse schleifen. Aber <b>ihr</b> müsst entscheiden, wie sie aussehen soll.' },
          { who: 'prof', text: 'Heute Nacht kommt Aurelia! Das Licht des Kometen kommt aus riesiger Entfernung. Deshalb treffen seine Strahlen <b>parallel</b> bei uns ein.' },
          { who: 'prof', text: 'Die Linse vorne im Fernrohr muss diese Strahlen genau am anderen Ende des Rohres – im <b>Okular</b> – in einem Punkt sammeln. Sonst sehen wir nur einen verschwommenen Fleck.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Die Linse im Fernrohr', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Bevor LUMI schleift, probiert ihr verschiedene Linsen aus. Beobachtet, wo sich die Strahlen treffen und wie scharf der Komet im Okular ist.</p>',
          sim: (e, cb) => Sims.telescope(e, { tube: 420, kind: 'convex', curv: 22, onChange: cb }),
          items: [
            { t: 'Probiert die <b>Zerstreuungslinse</b> aus.', check: (st) => st.kind === 'concave', fb: 'Das Licht läuft auseinander – im Okular ist nur ein verschwommener Fleck.' },
            { t: 'Nehmt eine <b>Sammellinse</b> und macht sie <b>sehr flach</b>.', check: (st) => st.kind === 'convex' && st.f > 480, fb: 'Der Brennpunkt liegt hinter dem Okular – die Strahlen treffen sich zu spät.' },
            { t: 'Macht die Sammellinse <b>stark gewölbt</b>.', check: (st) => st.kind === 'convex' && st.f < 330, fb: 'Jetzt treffen sich die Strahlen schon im Rohr und laufen danach wieder auseinander – auch unscharf.' },
          ],
          summary: 'Ein scharfes Bild entsteht nur, wenn der <b>Brennpunkt genau im Okular</b> liegt.',
        });
      } },
      { kind: 'task', title: 'Vorüberlegung', gate: true, render(el, api) {
        const need = api.need(2);
        T.mc(el, { q: 'Welche Linsenart brauchen wir für das Fernrohr?', solved: api.solved, onSolved: need, options: [
          { t: 'Eine Sammellinse', ok: true, fb: 'Nur sie sammelt paralleles Licht in einem Punkt.' },
          { t: 'Eine Zerstreuungslinse', fb: 'Die lässt paralleles Licht auseinanderlaufen. Das Licht soll sich aber in einem Punkt treffen.' },
          { t: 'Einen Glasquader', fb: 'Ein Quader verschiebt das Licht nur parallel – er sammelt es nicht.' },
        ] });
        T.mc(el, { q: 'Das Fernrohr ist vom Objektiv bis zum Okular <b>42 cm</b> lang. Welche Brennweite muss die Linse haben?', solved: api.solved, onSolved: need, options: [
          { t: 'f = 42 cm', ok: true, fb: 'Der Brennpunkt muss genau im Okular liegen.' },
          { t: 'f = 21 cm', fb: 'Dann würden sich die Strahlen schon in der Mitte des Rohres treffen – und danach wieder auseinanderlaufen.' },
          { t: 'f = 84 cm', fb: 'Dann würden sich die Strahlen erst weit hinter dem Fernrohr treffen.' },
          { t: 'Die Brennweite ist egal.', fb: 'Probiert im nächsten Schritt aus, ob sie wirklich egal ist …' },
        ] });
      } },
      { kind: 'exp', title: 'Stellt das Fernrohr scharf!', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Wählt die Linsenart und stellt die Wölbung so ein, dass das Bild des Kometen im Okular <b>scharf</b> wird. Nutzt für die Feinarbeit die Knöpfe − und +.</p>'));
        const fb = h('div', { class: 'fb-slot' });
        Sims.telescope(el, { tube: 420, kind: 'convex', curv: 8, onFocus: () => {
          fb.innerHTML = '';
          fb.append(UI.feedback('ok', '<b>Gestochen scharf!</b> Der Brennpunkt liegt genau im Okular. LUMI jubelt!'));
          api.done();
        } });
        el.append(fb);
      } },
      { kind: 'exp', title: 'Alarm: Das Rohr ist verbogen!', gate: true, render(el, api) {
        el.append(D([
          { who: 'prof', text: 'Oh nein! Beim Einbau merken wir: Der Sturm hat das lange Rohr verbogen. Wir haben nur noch ein <b>kurzes Ersatzrohr</b>: 26 cm.' },
          { who: 'lumi', text: 'Kein Problem – ich schleife eine zweite Linse. Aber wie muss sie aussehen?' },
        ]));
        const slot = h('div', { class: 'sim-block' });
        T.mc(el, { q: 'Was muss LUMI an der Linse ändern?', solved: api.solved, onSolved: () => { show(); }, options: [
          { t: 'Sie muss stärker gewölbt sein (kürzere Brennweite).', ok: true, fb: 'Das Rohr ist kürzer – also muss sich das Licht früher treffen.' },
          { t: 'Sie muss flacher sein (längere Brennweite).', fb: 'Dann würde sich das Licht noch später treffen – weit hinter dem kurzen Rohr.' },
          { t: 'Sie kann genauso bleiben.', fb: 'Dann liegt der Brennpunkt 42 cm hinter der Linse – das kurze Rohr ist aber nur 26 cm lang.' },
        ] });
        el.append(slot);
        const fb = h('div', { class: 'fb-slot' });
        function show() {
          if (slot.childElementCount) return;
          slot.append(P('<p><b>Auftrag:</b> Stellt das kurze Fernrohr scharf!</p>'));
          Sims.telescope(slot, { tube: 260, kind: 'convex', curv: 22, onFocus: () => {
            fb.innerHTML = '';
            fb.append(UI.feedback('ok', '<b>Perfekt!</b> Auch mit dem kurzen Rohr ist Aurelia scharf zu sehen.'));
            api.done();
          } });
          slot.append(fb);
        }
        if (api.solved) show();
      } },
      { kind: 'story', title: 'Aurelia!', render(el, api) {
        const big = h('div', { class: 'okular big sharp' });
        Sims.comet(big, 'final-comet');
        el.append(h('div', { class: 'finale' }, big));
        el.append(D([
          { who: 'prof', text: `Da ist sie! Komet <b>Aurelia</b> – gestochen scharf! <b>${api.teamHtml}</b>, ihr habt die Sternwarte gerettet!` },
          { who: 'lumi', text: 'Mein Lichtspeicher ist wieder komplett: Brechung, Lot, Prisma, Linse, Brennpunkt … alles da! Danke, danke, danke! Piep!' },
          { who: 'prof', text: 'Ihr seid jetzt offiziell <b>Junior-Optikerinnen und Junior-Optiker</b> der Sternwarte Lichtberg. Eure Urkunde liegt bereit.' },
        ]));
      } },
    ],
  });

  window.CONTENT = { STATIONS, teamStep };
})();
