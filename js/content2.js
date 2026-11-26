/* =========================================================
   content2.js – Teil 2: Optische Instrumente und das Auge
   ========================================================= */
(function () {
  'use strict';
  const { h, dialog: D, box } = UI;
  const T = Tasks;
  const B = Bench;
  const P = (html) => h('div', { class: 'prose', html });

  /* Experiment mit Ziel: erst wenn das Ziel erreicht ist, erscheinen die Fragen */
  function goal(el, api, o) {
    if (o.text) el.append(P(o.text));
    const status = h('div', { class: 'mission-status' }, '🎯 ' + (o.statusText || 'Auftrag läuft …'));
    const slot = h('div', { class: 'mission-slot' });
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      status.textContent = '✅ Geschafft!';
      status.classList.add('done');
      slot.append(UI.feedback('ok', o.success));
      const qs = o.questions || [];
      if (!qs.length) { api.done(); return; }
      const need = api.need(qs.length);
      qs.forEach((q) => (q.cloze ? T.cloze : q.num ? T.numeric : T.mc)(slot, Object.assign({ solved: api.solved, onSolved: need }, q)));
    };
    o.sim(el, (st) => { if (o.check(st)) show(); });
    el.append(status, slot);
    if (api.solved) show();
  }

  const SCENE_HALL = `
  <svg viewBox="0 0 800 260" class="scene" role="img" aria-label="Ausstellungshalle der Sternwarte mit Vitrinen für optische Instrumente">
    <defs><linearGradient id="hall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2850"/><stop offset="1" stop-color="#0a1124"/></linearGradient></defs>
    <rect width="800" height="260" fill="url(#hall)"/>
    <path d="M0 70 L400 10 L800 70" fill="none" stroke="#3a4a85" stroke-width="6"/>
    <rect x="0" y="210" width="800" height="50" fill="#141d3d"/>
    ${[90, 230, 370, 510, 650].map((x, i) => `<g transform="translate(${x} 120)"><rect x="-45" y="0" width="90" height="90" rx="6" fill="rgba(160,220,255,.08)" stroke="#6b7bb8"/><rect x="-50" y="88" width="100" height="10" fill="#3a4670"/>
      <circle cx="0" cy="45" r="${14 + i * 2}" fill="none" stroke="#ffd34d" stroke-width="3" opacity=".8"/><text x="0" y="-10" fill="#c9d1ea" font-size="13" text-anchor="middle">${['Lupe', 'Auge', 'Fernrohr', 'Mikroskop', 'Teleskop'][i]}</text></g>`).join('')}
    <text x="400" y="45" fill="#ffd34d" font-size="20" text-anchor="middle" font-weight="700">Lange Nacht der Optik</text>
  </svg>`;

  const S = [];

  /* ---------- PROLOG TEIL 2 ---------- */
  S.push({
    id: 'p2', part: 2, nr: 0, title: 'Teil 2: Die Lange Nacht der Optik', short: 'Start', crystal: false,
    steps: [
      { kind: 'story', title: 'Eine neue Mission', render(el) {
        el.append(h('div', { class: 'scene-wrap', html: SCENE_HALL }));
        el.append(D([
          { who: 'prof', text: 'Seit Komet Aurelia ist unsere Sternwarte berühmt! Alle wollen wissen, wie man mit Linsen Dinge sichtbar macht, die man mit bloßem Auge nicht sieht.' },
          { who: 'prof', text: 'Darum veranstalten wir die <b>Lange Nacht der Optik</b>: eine Ausstellung mit optischen Instrumenten – Lupe, Fernrohr, Mikroskop, Teleskop … und dem Auge.' },
          { who: 'lumi', text: 'Ich baue die Ausstellungsstücke! Aber für jedes Instrument brauche ich einen <b>Bauplan</b>. Den erarbeitet ihr an den 8 Stationen.' },
          { who: 'prof', text: 'Es haben sich schon Gäste angemeldet – und jeder Gast bringt eine Frage mit. Helft ihnen!' },
        ]));
      } },
      { kind: 'task', title: 'Euer Forschungsteam', gate: true, render: CONTENT.teamStep },
      { kind: 'info', title: 'Was ihr schon wisst', render(el) {
        el.append(P(`<p>Für Teil 2 braucht ihr euer Wissen über die <b>Sammellinse</b> aus Teil 1:</p>
          <ul><li>Parallele Strahlen treffen sich im <b>Brennpunkt F</b>. Der Abstand Linse–F ist die <b>Brennweite f</b>.</li>
          <li><b>Parallelstrahl</b> → wird zum Brennpunktstrahl. <b>Mittelpunktstrahl</b> → geht geradeaus. <b>Brennpunktstrahl</b> → wird zum Parallelstrahl.</li>
          <li>Stärker gewölbte Linse → kürzere Brennweite.</li></ul>`));
        el.append(box('tip', 'Wieder dabei: euer Logbuch', 'Auch in Teil 2 gibt es nach jeder Station einen Merksatz. Für jede Station baut LUMI ein <b>Ausstellungsstück</b>.'));
      } },
    ],
  });

  /* ---------- I1 Bildentstehung ---------- */
  S.push({
    id: 'i1', part: 2, nr: 1, title: 'Bilder aus Licht: Kamera und Projektor', short: 'Bilder', color: '#ffb86b',
    merksatz: 'Steht ein Gegenstand <b>weiter als die Brennweite</b> vor einer Sammellinse (g > f), entsteht hinter der Linse ein <b>reelles Bild</b>, das man auf einem Schirm auffangen kann. Es steht <b>auf dem Kopf</b> und ist seitenvertauscht.<br>• g > 2f: <b>verkleinert</b> (Fotoapparat, Auge)<br>• g = 2f: gleich groß<br>• f < g < 2f: <b>vergrößert</b> (Projektor, Beamer)<br>• g < f: <b>kein Bild</b> auf dem Schirm',
    steps: [
      { kind: 'story', title: 'Gast 1: Der Fotograf', render(el) {
        el.append(D([
          { who: 'prof', text: 'Unser erster Gast ist Herr Kaya, Fotograf. Seine Frage: <i>„Wie kommt das Bild eigentlich in meine Kamera?“</i>' },
          { who: 'lumi', text: 'Eine Kamera ist innen ein dunkler Kasten. Vorne sitzt eine Sammellinse, hinten der Bildsensor. Wir bauen das nach: mit einer <b>Kerze</b>, einer <b>Sammellinse</b> (f = 10 cm) und einem <b>Schirm</b>.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Kerze, Linse, Schirm', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Zieht die <b>Kerze</b> und den <b>Schirm</b> an ihren Griffen oder benutzt die Regler. Oben links seht ihr, was auf dem Schirm erscheint.</p>',
          sim: (e, cb) => B.imaging(e, { g: 300, xs: 560, onChange: cb }),
          items: [
            { t: 'Stellt die Kerze <b>weit weg</b> (mehr als 25 cm) und sucht mit dem Schirm das scharfe Bild.', check: (st) => st.sharp && st.g > 25, fb: 'Das Bild ist <b>kleiner</b> als die Kerze und steht <b>auf dem Kopf</b>. Der Schirm steht nah an der Linse.' },
            { t: 'Schiebt die Kerze <b>näher heran</b> (etwa 14 bis 15 cm) und stellt wieder scharf.', check: (st) => st.sharp && st.g >= 13.5 && st.g <= 15.5, fb: 'Jetzt ist das Bild <b>größer</b> als die Kerze – und der Schirm muss weiter weg.' },
            { t: 'Schiebt die Kerze <b>näher als 10 cm</b> an die Linse (das ist die Brennweite).', check: (st) => st.g < 10, fb: 'Es gibt kein Bild mehr auf dem Schirm – egal, wo der Schirm steht.' },
            { t: 'Schaltet die <b>Konstruktion mit besonderen Strahlen</b> ein.', check: (st) => st.construct, fb: 'Die drei besonderen Strahlen von der Flammenspitze treffen sich genau dort, wo das scharfe Bild entsteht.' },
          ],
          summary: 'Steht die Kerze weiter weg als die Brennweite, entsteht hinter der Linse ein <b>umgekehrtes Bild</b>, das man auf einem Schirm auffangen kann. Je näher die Kerze an die Brennweite heranrückt, desto <b>größer</b> wird das Bild und desto <b>weiter weg</b> liegt es. Innerhalb der Brennweite entsteht kein Bild auf dem Schirm.',
        });
      } },
      { kind: 'exp', title: 'Fangt das Bild ein!', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p><b>Auftrag:</b> Verschiebt den <b>Schirm</b>, bis das Bild der Kerze darauf <b>scharf</b> ist. Ihr könnt Kerze und Schirm auch direkt ziehen. Oben links seht ihr, was auf dem Schirm zu sehen ist.</p>',
          sim: (e, cb) => B.imaging(e, { g: 300, xs: 680, allowConstruct: false, onChange: cb }),
          check: (st) => st.sharp,
          success: '<b>Scharf!</b> Schaut euch das Bild auf dem Schirm genau an.',
          questions: [{ q: 'Wie sieht das Bild der Kerze aus?', options: [
            { t: 'Es steht auf dem Kopf.', ok: true, fb: 'Alle Strahlen von der Flammenspitze treffen sich unterhalb der Achse wieder. Das Bild ist umgekehrt.' },
            { t: 'Es steht aufrecht, genau wie die Kerze.', fb: 'Schaut noch einmal auf das Bild oben links: Wo ist die Flamme?' },
            { t: 'Es ist nur ein heller Fleck ohne Form.', fb: 'Das ist es nur, solange der Schirm an der falschen Stelle steht.' },
          ] }],
        });
      } },
      { kind: 'exp', title: 'Messreihe: Wo entsteht das Bild?', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Stellt nacheinander die Gegenstandsweiten g aus der Tabelle ein. Sucht jeweils die Schirmposition mit dem schärfsten Bild und tragt die <b>Bildweite b</b> (Abstand Linse – Schirm) ein. Achtet auch auf die Größe des Bildes.</p>'));
        B.imaging(el, { g: 300, xs: 600, allowConstruct: false });
        const need = api.need(2);
        T.table(el, { title: 'Messprotokoll (f = 10 cm)', head: ['Gegenstandsweite g', 'Bildweite b'], unit: 'cm', rows: [30, 20, 15], truth: [15, 20, 30], tol: 1,
          prefill: api.get('bildweiten'), solved: api.solved, onSolved: (v) => { api.set('bildweiten', v); need(); } });
        T.cloze(el, { title: 'Wie groß ist das Bild?', solved: api.solved, onSolved: need, parts: [
          'Bei g = 30 cm (mehr als 2f) ist das Bild ', { opts: ['verkleinert', 'gleich groß', 'vergrößert'], a: 'verkleinert' }, '. ', { br: true },
          'Bei g = 20 cm (genau 2f) ist das Bild ', { opts: ['verkleinert', 'gleich groß', 'vergrößert'], a: 'gleich groß' }, '. ', { br: true },
          'Bei g = 15 cm (zwischen f und 2f) ist das Bild ', { opts: ['verkleinert', 'gleich groß', 'vergrößert'], a: 'vergrößert' }, '.',
        ] });
      } },
      { kind: 'exp', title: 'Kerze ganz nah an der Linse', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Schiebt die Kerze <b>näher als 10 cm</b> (die Brennweite) an die Linse. Sucht dann mit dem Schirm nach einem Bild.</p>'));
        B.imaging(el, { g: 140, xs: 700, allowConstruct: false });
        T.mc(el, { q: 'Was beobachtet ihr, wenn die Kerze innerhalb der Brennweite steht (g < f)?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Es entsteht nirgends ein scharfes Bild auf dem Schirm.', ok: true, fb: 'Die Strahlen laufen hinter der Linse auseinander – sie treffen sich nie. Was man damit trotzdem anfangen kann, seht ihr bei der Lupe!' },
          { t: 'Das Bild wird riesig groß und scharf.', fb: 'Schiebt den Schirm hin und her: Wird es irgendwo scharf?' },
          { t: 'Das Bild steht jetzt aufrecht auf dem Schirm.', fb: 'Auf dem Schirm ist gar kein Bild zu sehen – nur ein heller Fleck.' },
        ] });
      } },
      { kind: 'info', title: 'Bilder konstruieren', render(el) {
        el.append(P('<p>Mit den <b>drei besonderen Strahlen</b> aus Teil 1 könnt ihr das Bild zeichnen, ohne zu messen: Alle drei Strahlen starten an der <b>Flammenspitze</b> und treffen sich im <b>Bildpunkt</b>. Schaltet die Konstruktion ein und verschiebt die Kerze.</p>'));
        B.imaging(el, { g: 260, xs: 590, construct: true });
        el.append(box('info', 'Anwendungen', '<b>Fotoapparat und Handy-Kamera:</b> Gegenstand weit weg (g > 2f) → kleines Bild auf dem Sensor.<br><b>Beamer, Projektor:</b> kleines Bild knapp außerhalb von f (f < g < 2f) → großes Bild an der Wand. Darum steht das Bild im Projektor auf dem Kopf!'));
      } },
      { kind: 'task', title: 'Kurzer Check', gate: true, render(el, api) {
        T.mc(el, { q: 'Ein Beamer soll ein kleines Bild <b>groß</b> an die Wand werfen. Wo muss das kleine Bild im Beamer vor der Linse stehen?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Zwischen f und 2f', ok: true, fb: 'Dann entsteht ein vergrößertes, reelles Bild weit hinter der Linse – an der Wand.' },
          { t: 'Weiter weg als 2f', fb: 'Dann wird das Bild verkleinert – so arbeitet die Kamera.' },
          { t: 'Näher als f', fb: 'Dann gibt es gar kein Bild an der Wand.' },
        ] });
      } },
    ],
  });

  /* ---------- I2 Auge ---------- */
  S.push({
    id: 'i2', part: 2, nr: 2, title: 'Das Auge', short: 'Auge', color: '#7bed9f',
    merksatz: '<b>Hornhaut</b> und <b>Augenlinse</b> wirken zusammen wie eine Sammellinse. Sie erzeugen auf der <b>Netzhaut</b> ein verkleinertes, <b>umgekehrtes</b> Bild; das Gehirn „dreht“ es richtig herum. Damit nahe und ferne Gegenstände scharf sind, ändert die Augenlinse ihre Wölbung (<b>Akkommodation</b>): für <b>nahe</b> Gegenstände wird sie <b>stärker gewölbt</b>. Die <b>Iris</b> regelt mit der <b>Pupille</b>, wie viel Licht ins Auge fällt.',
    steps: [
      { kind: 'story', title: 'Gast 2: Die Augenärztin', render(el) {
        el.append(D([
          { who: 'prof', text: 'Das wichtigste optische Instrument habt ihr immer dabei: eure <b>Augen</b>!' },
          { who: 'lumi', text: 'Frau Dr. Linde ist Augenärztin. Sie hat ein großes Augenmodell mitgebracht und fragt: <i>„Wie schafft es das Auge, nah und fern scharf zu sehen?“</i>' },
        ]));
      } },
      { kind: 'info', title: 'Aufbau des Auges', render(el) {
        B.eye(el, { static: true, labels: true, rays: true, object: 'far' });
        el.append(P(`<ul>
          <li><b>Hornhaut:</b> durchsichtiges „Fenster“ vorne. Hier wird das Licht am stärksten gebrochen.</li>
          <li><b>Iris</b> (Regenbogenhaut): der farbige Ring. Ihre Öffnung ist die <b>Pupille</b>. Im Hellen wird sie klein, im Dunkeln groß.</li>
          <li><b>Augenlinse:</b> eine elastische Sammellinse. Der <b>Ziliarmuskel</b> kann ihre Wölbung verändern.</li>
          <li><b>Glaskörper:</b> durchsichtige, gelartige Masse, die das Auge in Form hält.</li>
          <li><b>Netzhaut:</b> Hier sitzen die Sinneszellen, die Licht in Nervensignale umwandeln – wie der Sensor einer Kamera.</li>
          <li><b>Sehnerv:</b> leitet die Signale zum Gehirn.</li></ul>`));
      } },
      { kind: 'task', title: 'Beschriftet das Auge', gate: true, render(el, api) {
        T.labeling(el, { q: 'Ordnet die Begriffe richtig zu.', solved: api.solved, onSolved: api.done,
          build: (holder) => { const e = B.eye(holder, { static: true, rays: false }); return { stage: e.stage, zones: e.zones }; },
          items: [
            { zone: 'hornhaut', text: 'Hornhaut' }, { zone: 'iris', text: 'Iris mit Pupille' }, { zone: 'linse', text: 'Augenlinse' },
            { zone: 'glas', text: 'Glaskörper' }, { zone: 'netz', text: 'Netzhaut' }, { zone: 'nerv', text: 'Sehnerv' },
          ] });
      } },
      { kind: 'learn', title: 'Erkunden: Nah und fern scharf sehen', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Mit dem <b>Ziliarmuskel</b> könnt ihr die Augenlinse wölben. Wechselt zwischen Baum und Buch und beobachtet das Bild auf der Netzhaut (oben links).</p>',
          sim: (e, cb) => B.eye(e, { mode: 'manual', object: 'far', onChange: cb }),
          items: [
            { t: 'Schaut den <b>Baum</b> mit <b>entspannter</b> Linse an. Ist das Netzhautbild scharf?', check: (st) => st.object === 'far' && st.sharp && st.curv < 10, fb: 'Ja: Für ferne Dinge ist die Augenlinse entspannt und flach.' },
            { t: 'Wechselt zum <b>Buch</b>, ohne die Linse zu verändern.', check: (st) => st.object === 'near' && !st.sharp, fb: 'Unscharf! Die Strahlen vom nahen Buch würden sich erst hinter der Netzhaut treffen.' },
            { t: '<b>Wölbt die Linse</b>, bis das Buch scharf ist.', check: (st) => st.object === 'near' && st.sharp, fb: 'Die stärker gewölbte Linse bricht stärker – das Bild liegt wieder auf der Netzhaut. Das nennt man <b>Akkommodation</b>.' },
            { t: 'Schaut euch das Bild auf der Netzhaut genau an: Wie steht es?', fb: 'Auf dem Kopf! Das Gehirn dreht es für uns richtig herum.' },
          ],
          summary: 'Hornhaut und Augenlinse erzeugen auf der Netzhaut ein <b>umgekehrtes</b> Bild. Für <b>nahe</b> Gegenstände wölbt der Ziliarmuskel die Linse <b>stärker</b> (Akkommodation), für ferne ist sie flach.',
        });
      } },
      { kind: 'task', title: 'Kurzer Check', gate: true, render(el, api) {
        const need = api.need(3);
        T.mc(el, { q: 'Wie muss die Augenlinse für <b>nahe</b> Gegenstände eingestellt sein?', solved: api.solved, onSolved: need, options: [
          { t: 'Stärker gewölbt', ok: true, fb: 'Eine stärker gewölbte Linse hat eine kürzere Brennweite. Das nennt man <b>Akkommodation</b>.' },
          { t: 'Flacher', fb: 'Flach (entspannt) ist die Linse beim Blick in die Ferne.' },
          { t: 'Das spielt keine Rolle.', fb: 'Erinnert euch an das Buch: Mit entspannter Linse war es unscharf.' },
        ] });
        T.mc(el, { q: 'Wie steht das Bild auf der Netzhaut?', solved: api.solved, onSolved: need, options: [
          { t: 'Auf dem Kopf – das Gehirn dreht es um.', ok: true, fb: 'Genau wie beim Schirmbild der Kerze. Das Gehirn hat gelernt, das Bild richtig herum zu deuten.' },
          { t: 'Aufrecht', fb: 'Schaut euch das Bild oben links in der Simulation an.' },
          { t: 'Mal so, mal so', fb: 'Eine Sammellinse erzeugt reelle Bilder immer umgekehrt.' },
        ] });
        T.mc(el, { q: 'Ihr kommt aus einem dunklen Kinosaal in die Sonne. Was macht eure Pupille?', solved: api.solved, onSolved: need, options: [
          { t: 'Sie wird kleiner.', ok: true, fb: 'So gelangt weniger Licht ins Auge und die Netzhaut wird nicht geblendet.' },
          { t: 'Sie wird größer.', fb: 'Größer wird sie im Dunkeln, um mehr Licht hereinzulassen.' },
          { t: 'Sie bleibt gleich.', fb: 'Die Iris reagiert ständig auf die Helligkeit.' },
        ] });
      } },
    ],
  });

  /* ---------- I3 Brille ---------- */
  S.push({
    id: 'i3', part: 2, nr: 3, title: 'Sehfehler und Brillen', short: 'Brille', color: '#4fd1ff',
    merksatz: '<b>Kurzsichtig:</b> Der Augapfel ist zu lang. Das Bild ferner Gegenstände entsteht <b>vor</b> der Netzhaut. Hilfe: <b>Zerstreuungslinse</b> (Minus-Dioptrien).<br><b>Weitsichtig:</b> Der Augapfel ist zu kurz (oder die Linse kann sich im Alter nicht mehr stark wölben). Das Bild naher Gegenstände entsteht <b>hinter</b> der Netzhaut. Hilfe: <b>Sammellinse</b> (Plus-Dioptrien).<br>Die Stärke einer Linse gibt man in <b>Dioptrien</b> an: D = 1 / f (f in Metern).',
    steps: [
      { kind: 'story', title: 'Gast 3: Jonas und Oma Erika', render(el) {
        el.append(D([
          { who: 'prof', text: 'Jonas aus der 8b erzählt: <i>„Die Tafel sehe ich nur verschwommen, aber mein Buch kann ich gut lesen.“</i>' },
          { who: 'prof', text: 'Seine Oma Erika sagt genau das Gegenteil: <i>„Die Zeitung muss ich ganz weit weghalten, sonst ist alles unscharf.“</i>' },
          { who: 'lumi', text: 'Ich habe Modelle von beiden Augen gebaut. Findet die passende Brille! Das Auge stellt dabei selbst so gut scharf, wie es kann.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Drei Augen im Vergleich', gate: true, render(el, api) {
        let nf = false, nn = false;
        T.learn(el, api, {
          intro: '<p>LUMI hat drei Augenmodelle gebaut: ein <b>normalsichtiges</b>, ein <b>kurzsichtiges</b> und ein <b>weitsichtiges</b> Auge. Die Augen stellen selbst so gut scharf, wie sie können. Vergleicht!</p>',
          sim: (e, cb) => B.eye(e, { mode: 'auto', type: 'normal', object: 'far', types: true, onChange: cb }),
          items: [
            { t: '<b>Normalsichtiges</b> Auge: Prüft Baum <b>und</b> Buch.', check: (st) => { if (st.type === 'normal' && st.sharp) { if (st.object === 'far') nf = true; else nn = true; } return nf && nn; }, fb: 'Ein gesundes Auge sieht nah und fern scharf – die Linse passt sich an.' },
            { t: '<b>Kurzsichtiges</b> Auge: Schaut den <b>Baum</b> an. Wo läge das scharfe Bild?', check: (st) => st.type === 'kurz' && st.object === 'far' && !st.sharp, fb: 'Unscharf – das Bild liegt <b>vor</b> der Netzhaut, weil der Augapfel zu lang ist.' },
            { t: '<b>Kurzsichtiges</b> Auge: Schaut das <b>Buch</b> an.', check: (st) => st.type === 'kurz' && st.object === 'near' && st.sharp, fb: 'Scharf! Kurzsichtige sehen in der Nähe gut – daher der Name.' },
            { t: '<b>Weitsichtiges</b> Auge: Schaut das <b>Buch</b> an.', check: (st) => st.type === 'weit' && st.object === 'near' && !st.sharp, fb: 'Unscharf – das Bild läge <b>hinter</b> der Netzhaut.' },
          ],
          summary: '<b>Kurzsichtig:</b> In der Ferne unscharf, das Bild liegt vor der Netzhaut. <b>Weitsichtig:</b> In der Nähe unscharf, das Bild liegt hinter der Netzhaut.',
        });
      } },
      { kind: 'exp', title: 'Jonas ist kurzsichtig', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p><b>Auftrag:</b> Schaut euch an, wie Jonas den <b>Baum</b> und das <b>Buch</b> sieht. Wählt dann mit dem Regler eine Brille, mit der Jonas den <b>Baum</b> scharf sieht.</p>',
          sim: (e, cb) => B.eye(e, { mode: 'auto', type: 'kurz', object: 'far', glasses: true, onChange: cb }),
          check: (st) => st.sharp && st.object === 'far' && st.P < 0,
          success: '<b>Jonas sieht den Baum scharf!</b>',
          questions: [
            { q: 'Wo entstand das Bild des Baumes <b>ohne</b> Brille?', options: [
              { t: 'Vor der Netzhaut', ok: true, fb: 'Der Augapfel ist zu lang – die Strahlen treffen sich zu früh.' },
              { t: 'Hinter der Netzhaut', fb: 'Stellt die Brille auf 0 und lest die Anzeige unter dem Bild.' },
            ] },
            { q: 'Welche Linse hilft bei Kurzsichtigkeit?', options: [
              { t: 'Zerstreuungslinse (minus)', ok: true, fb: 'Sie lässt die Strahlen etwas auseinanderlaufen. Dadurch treffen sie sich später – genau auf der Netzhaut.' },
              { t: 'Sammellinse (plus)', fb: 'Probiert es aus: Mit einer Sammellinse wird es noch schlimmer.' },
            ] },
          ],
        });
      } },
      { kind: 'exp', title: 'Oma Erika ist weitsichtig', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p><b>Auftrag:</b> Oma Erika möchte das <b>Buch</b> lesen. Sucht eine Brille, mit der sie es scharf sieht.</p>',
          sim: (e, cb) => B.eye(e, { mode: 'auto', type: 'weit', object: 'near', glasses: true, onChange: cb }),
          check: (st) => st.sharp && st.object === 'near' && st.P > 0,
          success: '<b>Oma Erika kann wieder lesen!</b>',
          questions: [
            { q: 'Wo entstand das Bild des Buches <b>ohne</b> Brille?', options: [
              { t: 'Hinter der Netzhaut', ok: true, fb: 'Das Auge ist zu kurz bzw. die Linse kann sich nicht stark genug wölben.' },
              { t: 'Vor der Netzhaut', fb: 'Stellt die Brille auf 0 und lest die Anzeige unter dem Bild.' },
            ] },
            { q: 'Welche Linse hilft bei Weitsichtigkeit?', options: [
              { t: 'Sammellinse (plus)', ok: true, fb: 'Sie hilft der Augenlinse beim Sammeln – die Strahlen treffen sich früher, auf der Netzhaut.' },
              { t: 'Zerstreuungslinse (minus)', fb: 'Probiert es aus: Damit rückt das Bild noch weiter nach hinten.' },
            ] },
          ],
        });
        el.append(box('info', 'Altersweitsichtigkeit', 'Ab etwa 45 Jahren wird die Augenlinse steifer und kann sich nicht mehr stark wölben. Deshalb brauchen viele ältere Menschen eine <b>Lesebrille</b> mit Sammellinsen.'));
      } },
      { kind: 'task', title: 'Dioptrien', gate: true, render(el, api) {
        el.append(P('<p>Auf jedem Brillenpass steht die Stärke der Gläser in <b>Dioptrien (dpt)</b>:</p><ul><li><b>Plus</b> (+) bedeutet Sammellinse, <b>Minus</b> (−) Zerstreuungslinse.</li><li>Je größer die Zahl, desto stärker die Linse.</li><li>Berechnung: <b>D = 1 / f</b> (Brennweite in Metern). Beispiel: f = 0,5 m → D = 1 / 0,5 = 2 dpt.</li></ul>'));
        const need = api.need(2);
        T.numeric(el, { q: 'Eine Sammellinse hat die Brennweite f = 25 cm = 0,25 m. Wie viele Dioptrien hat sie?', answer: 4, tol: 0.01, unit: 'dpt', solved: api.solved, onSolved: need,
          hint: 'Rechnet 1 : 0,25. Wie oft passt 0,25 in 1?', fbOk: 'Die Linse hat +4 dpt.' });
        T.mc(el, { q: 'Auf Jonas’ Brillenpass steht <b>−2,5 dpt</b>. Was bedeutet das?', solved: api.solved, onSolved: need, options: [
          { t: 'Zerstreuungslinse – Jonas ist kurzsichtig.', ok: true },
          { t: 'Sammellinse – Jonas ist weitsichtig.', fb: 'Achtet auf das Vorzeichen!' },
          { t: 'Jonas braucht keine Brille.', fb: 'Dann stünde dort 0 dpt.' },
        ] });
      } },
    ],
  });

  /* ---------- I4 Lupe ---------- */
  S.push({
    id: 'i4', part: 2, nr: 4, title: 'Die Lupe', short: 'Lupe', color: '#ffd34d',
    merksatz: 'Eine <b>Lupe</b> ist eine Sammellinse. Liegt der Gegenstand <b>innerhalb der Brennweite</b> (g < f), laufen die Strahlen hinter der Lupe auseinander. Das Auge verlängert sie rückwärts und sieht ein <b>vergrößertes, aufrechtes, scheinbares (virtuelles) Bild</b>. Ein scheinbares Bild kann man nicht auf einem Schirm auffangen.',
    steps: [
      { kind: 'story', title: 'Gast 4: Mia und die Ameise', render(el) {
        el.append(D([
          { who: 'prof', text: 'Mia ist sechs Jahre alt und hat eine Ameise in einem Glas mitgebracht. Sie möchte sie <b>riesig</b> sehen!' },
          { who: 'lumi', text: 'Dafür nehmen wir eine Lupe – eine Sammellinse mit f = 16 cm. Erinnert ihr euch an die Kerze ganz nah an der Linse? Da gab es kein Bild auf dem Schirm. Aber vielleicht im Auge …' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Was macht die Lupe?', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Zieht die <b>Ameise</b> an ihrem Griff oder benutzt den Regler. Oben links seht ihr, was Mias Auge sieht. Die Lupe hat die Brennweite f = 16 cm.</p>',
          sim: (e, cb) => B.magnifier(e, { g: 240, onChange: cb }),
          items: [
            { t: 'Lasst die Ameise <b>weiter weg</b> als 16 cm. Wo treffen sich die Strahlen?', check: (st) => st.g > 16.3, fb: 'Hinter der Lupe treffen sich die Strahlen: Es entsteht ein <b>umgekehrtes</b> Bild – zum Vergrößern ungeeignet.' },
            { t: 'Schiebt die Ameise <b>ganz nah</b> an die Lupe (unter 5 cm).', check: (st) => st.g < 5, fb: 'Die Ameise erscheint nur ein wenig größer – aber aufrecht.' },
            { t: 'Schiebt die Ameise <b>knapp innerhalb der Brennweite</b> (zwischen 12 und 16 cm).', check: (st) => st.virtual && st.g >= 12, fb: 'Jetzt ist die Vergrößerung riesig! Die gestrichelten Linien treffen sich weit links.' },
            { t: 'Folgt den <b>gestrichelten Linien</b>: Wo „sieht“ das Auge die Ameise?', fb: 'Dort, wo sich die Rückverlängerungen treffen – ein großes, aufrechtes, <b>scheinbares</b> Bild.' },
          ],
          summary: 'Liegt der Gegenstand <b>innerhalb der Brennweite</b>, laufen die Strahlen hinter der Lupe auseinander. Das Auge sieht ein <b>vergrößertes, aufrechtes, scheinbares</b> Bild – je näher am Brennpunkt, desto größer.',
        });
      } },
      { kind: 'exp', title: 'Die Ameise vergrößern', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p><b>Auftrag:</b> Verschiebt die Ameise, bis Mia sie <b>mindestens 3-mal so groß</b> und aufrecht sieht. Gestrichelt: die Rückverlängerungen der Strahlen.</p>',
          sim: (e, cb) => B.magnifier(e, { g: 240, onChange: cb }),
          check: (st) => st.virtual && st.M >= 3,
          success: '<b>Riesen-Ameise!</b> Schaut, wo die Ameise jetzt liegt und wo sich die gestrichelten Linien treffen.',
          questions: [{ q: 'Wo muss die Ameise liegen, damit die Lupe vergrößert?', options: [
            { t: 'Innerhalb der Brennweite – zwischen Lupe und Brennpunkt F', ok: true },
            { t: 'Genau im Brennpunkt', fb: 'Dann laufen die Strahlen parallel – das Bild liegt „unendlich“ weit weg.' },
            { t: 'Weiter weg als der Brennpunkt', fb: 'Dann entsteht ein umgekehrtes, reelles Bild hinter der Lupe – wie bei der Kerze.' },
          ] }],
        });
      } },
      { kind: 'task', title: 'Das scheinbare Bild', gate: true, render(el, api) {
        el.append(P('<p>Hinter der Lupe laufen die Strahlen <b>auseinander</b>. Das Auge „denkt“ aber, Licht laufe immer geradeaus. Es verlängert die Strahlen rückwärts und sieht die Ameise dort, wo sich die Verlängerungen treffen: als großes, <b>scheinbares (virtuelles) Bild</b>.</p>'));
        const need = api.need(2);
        T.mc(el, { q: 'Wie ist das Bild einer Lupe?', solved: api.solved, onSolved: need, options: [
          { t: 'vergrößert, aufrecht, scheinbar (virtuell)', ok: true },
          { t: 'vergrößert, umgekehrt, reell', fb: 'Das trifft auf den Projektor zu.' },
          { t: 'verkleinert, umgekehrt, reell', fb: 'Das trifft auf die Kamera zu.' },
        ] });
        T.mc(el, { q: 'Kann man das Bild einer Lupe auf einem Schirm auffangen?', solved: api.solved, onSolved: need, options: [
          { t: 'Nein – dort treffen sich nur die gedachten Rückverlängerungen, kein echtes Licht.', ok: true },
          { t: 'Ja, wenn man den Schirm hinter die Lupe stellt.', fb: 'Hinter der Lupe laufen die Strahlen auseinander und treffen sich nie.' },
        ] });
      } },
    ],
  });

  /* ---------- I5 Fernrohr ---------- */
  S.push({
    id: 'i5', part: 2, nr: 5, title: 'Fernrohre aus zwei Linsen', short: 'Fernrohr', color: '#6c7bff',
    merksatz: 'Ein <b>Linsenfernrohr</b> hat zwei Linsen: Das <b>Objektiv</b> (große Brennweite f₁) erzeugt in seinem Brennpunkt ein Zwischenbild. Das <b>Okular</b> (kleine Brennweite f₂) betrachtet es wie eine Lupe. Abstand der Linsen: <b>f₁ + f₂</b>. <b>Vergrößerung = f₁ : f₂</b>.<br><b>Kepler-Fernrohr</b> (Okular: Sammellinse): Bild steht Kopf. <b>Galilei-Fernrohr</b> (Okular: Zerstreuungslinse, Abstand f₁ − f₂): Bild aufrecht, kürzer.',
    steps: [
      { kind: 'story', title: 'Gast 5: Der Segler', render(el) {
        el.append(D([
          { who: 'prof', text: 'Herr Okonkwo vom Segelclub möchte vom Ufer aus einen weit entfernten Leuchtturm genau sehen.' },
          { who: 'lumi', text: 'Unser Aurelia-Fernrohr hatte nur <b>eine</b> Linse. Das Bild war scharf, aber klein. Mit einer <b>zweiten</b> Linse als Lupe dahinter können wir es vergrößern!' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Zwei Linsen hintereinander', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Vorne sitzt das <b>Objektiv</b> (f₁ = 40 cm), dahinter das <b>Okular</b> (f₂ = 10 cm). Verschiebt das Okular und beobachtet den Turm im Okular.</p>',
          sim: (e, cb) => B.twoLensScope(e, { f1: 400, f2: 100, d: 300, types: true, onChange: cb }),
          items: [
            { t: 'Verschiebt das Okular <b>weiter weg</b> vom Objektiv (über 40 cm).', check: (st) => st.d > 40, fb: 'Das Bild wird mal schärfer, mal unschärfer – nur ein bestimmter Abstand passt.' },
            { t: 'Findet den Abstand, bei dem der Turm <b>scharf</b> ist. Achtet auf F₁ und F₂.', check: (st) => st.sharp && st.f2 > 0, fb: 'Scharf, wenn die Brennpunkte <b>F₁ und F₂ zusammenfallen</b>. Der Turm erscheint größer – aber auf dem Kopf.' },
            { t: 'Wechselt zum <b>Galilei-Okular</b> (Zerstreuungslinse) und stellt wieder scharf.', check: (st) => st.sharp && st.f2 < 0, fb: 'Auch scharf – das Bild steht jetzt <b>aufrecht</b> und das Fernrohr ist kürzer.' },
          ],
          summary: 'Ein Fernrohr aus zwei Linsen ist scharf, wenn die <b>Brennpunkte von Objektiv und Okular zusammenfallen</b>. Das Okular wirkt dabei wie eine Lupe für das Zwischenbild des Objektivs.',
        });
      } },
      { kind: 'exp', title: 'Das Kepler-Fernrohr', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p><b>Auftrag:</b> Objektiv: f₁ = 40 cm. Okular: f₂ = 10 cm. Verschiebt das Okular, bis der Turm im Okular <b>scharf</b> ist.</p>',
          sim: (e, cb) => B.twoLensScope(e, { f1: 400, f2: 100, d: 300, onChange: cb }),
          check: (st) => st.sharp,
          success: '<b>Scharf!</b> Lest den Abstand der Linsen und die Vergrößerung ab.',
          questions: [
            { q: 'Wie groß ist der Abstand zwischen Objektiv und Okular?', options: [
              { t: '50 cm = f₁ + f₂', ok: true, fb: 'Der Brennpunkt des Objektivs und der des Okulars fallen zusammen.' },
              { t: '40 cm = f₁', fb: 'Lest den Abstand noch einmal ab.' },
              { t: '30 cm = f₁ − f₂', fb: 'Das gilt für das Galilei-Fernrohr.' },
            ] },
            { q: 'Wie steht der Turm im Bild?', options: [
              { t: 'Auf dem Kopf', ok: true, fb: 'Das Zwischenbild des Objektivs ist umgekehrt – und die Lupe dreht es nicht zurück.' },
              { t: 'Aufrecht', fb: 'Schaut genau auf das Bild oben links.' },
            ] },
          ],
        });
      } },
      { kind: 'exp', title: 'Das Galilei-Fernrohr', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p>Für ein Schiff ist ein Bild auf dem Kopf ungünstig. <b>Galileo Galilei</b> nahm als Okular eine <b>Zerstreuungslinse</b>.</p><p><b>Auftrag:</b> Wechselt zum Galilei-Okular (f₂ = −10 cm) und stellt wieder scharf.</p>',
          sim: (e, cb) => B.twoLensScope(e, { f1: 400, f2: 100, d: 500, types: true, onChange: cb }),
          check: (st) => st.sharp && st.upright,
          success: '<b>Aufrecht und scharf!</b> Vergleicht den Abstand mit dem Kepler-Fernrohr.',
          questions: [{ q: 'Was ist beim Galilei-Fernrohr anders?', options: [
            { t: 'Das Bild ist aufrecht und das Fernrohr ist kürzer (f₁ − f₂ = 30 cm).', ok: true, fb: 'Darum sind Operngläser Galilei-Fernrohre.' },
            { t: 'Es vergrößert viel stärker.', fb: 'Vergleicht die angezeigte Vergrößerung: Sie ist gleich.' },
            { t: 'Es braucht gar kein Objektiv.', fb: 'Das Objektiv ist dasselbe geblieben.' },
          ] }],
        });
      } },
      { kind: 'task', title: 'Vergrößerung berechnen', gate: true, render(el, api) {
        el.append(box('info', 'Vergrößerung eines Fernrohrs', '<b>Vergrößerung = f₁ : f₂</b> (Brennweite Objektiv geteilt durch Brennweite Okular).<br>Beispiel: f₁ = 40 cm, f₂ = 10 cm → 40 : 10 = <b>4-fach</b>.'));
        const need = api.need(2);
        T.numeric(el, { q: 'Ein Fernrohr hat ein Objektiv mit f₁ = 60 cm und ein Okular mit f₂ = 2 cm. Wie stark vergrößert es?', answer: 30, tol: 0.01, unit: '-fach', solved: api.solved, onSolved: need, hint: 'Teilt 60 durch 2.' });
        T.numeric(el, { q: 'Wie weit müssen die beiden Linsen dieses Kepler-Fernrohrs voneinander entfernt sein?', answer: 62, tol: 0.01, unit: 'cm', solved: api.solved, onSolved: need, hint: 'Abstand = f₁ + f₂.' });
      } },
    ],
  });

  /* ---------- I6 Mikroskop ---------- */
  S.push({
    id: 'i6', part: 2, nr: 6, title: 'Das Mikroskop', short: 'Mikroskop', color: '#b47cff',
    merksatz: 'Ein <b>Mikroskop</b> hat zwei Sammellinsen: Das <b>Objektiv</b> hat eine sehr kurze Brennweite. Das Objekt liegt <b>knapp außerhalb</b> seiner Brennweite. So entsteht ein <b>vergrößertes, umgekehrtes, reelles Zwischenbild</b>. Das <b>Okular</b> wirkt wie eine Lupe und vergrößert das Zwischenbild noch einmal. <b>Gesamtvergrößerung = Vergrößerung Objektiv × Vergrößerung Okular</b>.',
    steps: [
      { kind: 'story', title: 'Gast 6: Die Biologin', render(el) {
        el.append(D([
          { who: 'prof', text: 'Frau Dr. Sommer, Biologin, möchte den Gästen die winzigen <b>Zellen einer Zwiebelhaut</b> zeigen.' },
          { who: 'lumi', text: 'Beim Fernrohr ist der Gegenstand sehr weit weg. Beim Mikroskop liegt er ganz nah vor dem Objektiv. Deshalb ist das Objektiv hier eine sehr starke Linse mit kurzer Brennweite.' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Objekt und Zwischenbild', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Dreht am <b>Triebrad</b> (Regler) und beobachtet, wo das <b>Zwischenbild</b> entsteht und wie die Zellen im Mikroskop aussehen.</p>',
          sim: (e, cb) => B.microscope(e, { g: 85, onChange: cb }),
          items: [
            { t: 'Dreht das Objekt <b>weiter weg</b> vom Objektiv (über 10 mm).', check: (st) => st.g > 100, fb: 'Das Zwischenbild wird kleiner und rückt näher an das Objektiv.' },
            { t: 'Dreht das Objekt <b>näher heran</b> (unter 6 mm).', check: (st) => st.g < 60, fb: 'Das Zwischenbild wird größer und wandert hinter das Okular – unscharf.' },
            { t: 'Findet die Stellung, bei der die Zellen <b>scharf</b> sind.', check: (st) => st.sharp, fb: 'Scharf ist es, wenn das Zwischenbild knapp vor dem Okular liegt – dort wirkt das Okular wie eine Lupe.' },
          ],
          summary: 'Das <b>Objektiv</b> erzeugt ein vergrößertes, umgekehrtes <b>Zwischenbild</b>. Das <b>Okular</b> vergrößert es wie eine Lupe noch einmal – dafür muss das Zwischenbild knapp innerhalb seiner Brennweite liegen.',
        });
      } },
      { kind: 'exp', title: 'Scharfstellen', gate: true, render(el, api) {
        goal(el, api, {
          text: '<p><b>Auftrag:</b> Dreht am Triebrad, bis die Zellen im Mikroskop <b>scharf</b> zu sehen sind. Beobachtet dabei das <b>Zwischenbild</b>.</p>',
          sim: (e, cb) => B.microscope(e, { g: 95, onChange: cb }),
          check: (st) => st.sharp,
          success: '<b>Scharf!</b> Schaut euch an, wo das Objekt und das Zwischenbild liegen.',
          questions: [
            { q: 'Wo liegt das Objekt?', options: [
              { t: 'Knapp außerhalb der Brennweite des Objektivs', ok: true, fb: 'Wie beim Projektor (f < g < 2f) entsteht ein vergrößertes, reelles Zwischenbild.' },
              { t: 'Innerhalb der Brennweite des Objektivs', fb: 'Dann gäbe es kein reelles Zwischenbild.' },
              { t: 'Sehr weit vom Objektiv entfernt', fb: 'Das wäre ein Fernrohr.' },
            ] },
            { q: 'Wie ist das Zwischenbild?', options: [
              { t: 'vergrößert, umgekehrt, reell', ok: true },
              { t: 'verkleinert, aufrecht, scheinbar', fb: 'Schaut euch den Pfeil „Zwischenbild“ an.' },
            ] },
          ],
        });
      } },
      { kind: 'task', title: 'Das Okular und die Vergrößerung', gate: true, render(el, api) {
        const need = api.need(2);
        T.mc(el, { q: 'Welche Aufgabe hat das Okular im Mikroskop?', solved: api.solved, onSolved: need, options: [
          { t: 'Es wirkt wie eine Lupe und vergrößert das Zwischenbild noch einmal.', ok: true },
          { t: 'Es dreht das Bild wieder richtig herum.', fb: 'Das Bild im Mikroskop steht tatsächlich Kopf!' },
          { t: 'Es sammelt das Licht der Lampe.', fb: 'Das macht der Kondensor unter dem Objekttisch.' },
        ] });
        el.append(box('info', 'Gesamtvergrößerung', 'Auf Objektiv und Okular steht, wie stark sie vergrößern, z. B. „10×“. Die Gesamtvergrößerung ist das <b>Produkt</b>: Objektiv 10× und Okular 10× ergibt 100-fach.'));
        T.numeric(el, { q: 'Das Objektiv vergrößert 40-fach, das Okular 10-fach. Wie stark vergrößert das Mikroskop insgesamt?', answer: 400, tol: 0.01, unit: '-fach', solved: api.solved, onSolved: need, hint: 'Multipliziert die beiden Zahlen.' });
      } },
      { kind: 'task', title: 'Fernrohr und Mikroskop im Vergleich', gate: true, render(el, api) {
        T.cloze(el, { title: 'Ergänzt', solved: api.solved, onSolved: api.done, parts: [
          'Beim Fernrohr hat das Objektiv eine ', { opts: ['große', 'sehr kleine'], a: 'große' }, ' Brennweite, beim Mikroskop eine ', { opts: ['große', 'sehr kleine'], a: 'sehr kleine' }, '. ',
          'In beiden Instrumenten erzeugt das Objektiv zuerst ein ', { opts: ['Zwischenbild', 'Spiegelbild'], a: 'Zwischenbild' }, '. ',
          'Das Okular wirkt dann wie eine ', { opts: ['Lupe', 'Brille', 'Kamera'], a: 'Lupe' }, '.',
        ] });
      } },
    ],
  });

  /* ---------- I7 Spiegel und Prismen ---------- */
  S.push({
    id: 'i7', part: 2, nr: 7, title: 'Spiegelteleskop und Fernglas', short: 'Spiegel', color: '#ff6fcf',
    merksatz: 'Auch Spiegel sammeln Licht: Ein <b>Hohlspiegel</b> bündelt paralleles Licht im Brennpunkt. Die größten Teleskope sind <b>Spiegelteleskope</b>, weil sich riesige Spiegel leichter bauen und abstützen lassen als riesige Linsen. Im <b>Fernglas</b> lenken <b>Umlenkprismen</b> das Licht durch <b>Totalreflexion</b> um: Das Bild steht wieder aufrecht und das Gerät wird kürzer.',
    steps: [
      { kind: 'story', title: 'Gast 7: Die Vogelbeobachterin', render(el) {
        el.append(D([
          { who: 'prof', text: 'Wusstet ihr, dass die größten Teleskope der Welt gar keine große Linse haben? Ihr Herz ist ein <b>Spiegel</b> mit bis zu 39 m Durchmesser!' },
          { who: 'lumi', text: 'Und Frau Berger vom Vogelschutzverein hat ein Fernglas dabei. Sie fragt: <i>„Warum ist mein Fernglas so kurz und das Bild trotzdem aufrecht?“</i>' },
        ]));
      } },
      { kind: 'learn', title: 'Erkunden: Spiegel und Prismen', gate: true, render(el, api) {
        T.learn(el, api, {
          intro: '<p>Schaltet zwischen den drei Bauteilen um und verfolgt die Lichtstrahlen.</p>',
          sim: (e, cb) => B.mirrors(e, { mode: 'hohl', onChange: cb }),
          items: [
            { t: '<b>Hohlspiegel:</b> Wo treffen sich die zurückgeworfenen Strahlen?', check: (st) => st.mode === 'hohl', fb: 'In einem Punkt: dem Brennpunkt F des Spiegels.' },
            { t: '<b>Spiegelteleskop:</b> Wie kommt das Licht zum Okular?', check: (st) => st.mode === 'newton', fb: 'Ein kleiner, schräger Spiegel lenkt das gesammelte Licht zur Seite aus dem Rohr.' },
            { t: '<b>Umlenkprisma:</b> Wo kommt der rote Strahl wieder heraus?', check: (st) => st.mode === 'porro', fb: 'Unten! Oben und unten werden vertauscht – das Licht läuft zurück.' },
          ],
          summary: 'Ein <b>Hohlspiegel</b> sammelt Licht wie eine Sammellinse. Ein <b>Umlenkprisma</b> lenkt Licht durch Totalreflexion um und vertauscht oben und unten.',
        });
      } },
      { kind: 'exp', title: 'Der Hohlspiegel', gate: true, render(el, api) {
        el.append(P('<p><b>Auftrag:</b> Beobachtet, was der gewölbte Spiegel mit parallelem Licht macht.</p>'));
        B.mirrors(el, { mode: 'hohl', modes: ['hohl'] });
        T.mc(el, { q: 'Was macht ein Hohlspiegel mit parallelem Licht?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Er wirft es zurück und sammelt es im Brennpunkt.', ok: true, fb: 'Ein Hohlspiegel wirkt wie eine Sammellinse – nur dass das Licht reflektiert statt gebrochen wird.' },
          { t: 'Er wirft es parallel zurück.', fb: 'Das macht ein ebener Spiegel. Schaut, wo sich die Strahlen treffen.' },
          { t: 'Er lässt es durch.', fb: 'Ein Spiegel ist nicht durchsichtig.' },
        ] });
      } },
      { kind: 'exp', title: 'Das Spiegelteleskop', gate: true, render(el, api) {
        el.append(P('<p>Der Brennpunkt des Hohlspiegels liegt mitten im Rohr – dort, wo das Licht hereinkommt. <b>Isaac Newton</b> hatte die Idee, das Licht mit einem kleinen, schrägen Spiegel zur Seite zu lenken.</p>'));
        B.mirrors(el, { mode: 'newton', modes: ['newton'] });
        T.mc(el, { q: 'Warum sind die größten Teleskope Spiegelteleskope?', solved: api.solved, onSolved: api.done, options: [
          { t: 'Riesige Spiegel lassen sich leichter bauen und abstützen als riesige Linsen; das Licht muss nicht durch dickes Glas.', ok: true, fb: 'Eine Linse kann man nur am Rand halten – bei mehreren Metern Durchmesser würde sie durchhängen. Einen Spiegel kann man von hinten stützen.' },
          { t: 'Spiegel vergrößern immer stärker als Linsen.', fb: 'Die Vergrößerung hängt von den Brennweiten ab, nicht davon, ob es ein Spiegel ist.' },
          { t: 'Spiegel brechen das Licht stärker.', fb: 'Spiegel brechen das Licht gar nicht – sie reflektieren es.' },
        ] });
      } },
      { kind: 'exp', title: 'Das Umlenkprisma im Fernglas', gate: true, render(el, api) {
        el.append(P('<p>Ein Fernglas besteht aus zwei Kepler-Fernrohren. Damit das Bild nicht Kopf steht, sitzen darin <b>Umlenkprismen</b>. Beobachtet den roten (oberen) und den blauen (unteren) Strahl.</p>'));
        B.mirrors(el, { mode: 'porro', modes: ['porro'] });
        const need = api.need(2);
        T.mc(el, { q: 'Wodurch wird das Licht im Prisma umgelenkt?', solved: api.solved, onSolved: need, options: [
          { t: 'Durch Totalreflexion an den schrägen Flächen', ok: true, fb: 'Das Licht trifft unter 45° auf – mehr als der Grenzwinkel von etwa 42°. Erinnert ihr euch an Station 4 aus Teil 1?' },
          { t: 'Durch eine Spiegelschicht', fb: 'Es geht ganz ohne Spiegelschicht – Glas allein reicht.' },
          { t: 'Durch Brechung zum Lot hin', fb: 'Beim Eintritt trifft das Licht senkrecht auf. Die Umlenkung passiert an den schrägen Flächen.' },
        ] });
        T.mc(el, { q: 'Wozu dienen die Prismen im Fernglas?', solved: api.solved, onSolved: need, options: [
          { t: 'Sie drehen das Bild wieder richtig herum und falten den langen Lichtweg – das Fernglas wird kürzer.', ok: true },
          { t: 'Sie vergrößern das Bild.', fb: 'Die Vergrößerung kommt von Objektiv und Okular.' },
          { t: 'Sie färben das Bild bunt.', fb: 'Hier geht es nicht um Farben.' },
        ] });
      } },
    ],
  });

  /* ---------- I8 Finale ---------- */
  S.push({
    id: 'i8', part: 2, nr: 8, title: 'Finale: Die Ausstellung', short: 'Finale', color: '#ff5a5a',
    merksatz: 'Optische Instrumente kombinieren Linsen, Spiegel und Prismen: <b>Lupe</b> (eine Sammellinse, g < f), <b>Fotoapparat</b> und <b>Projektor</b> (eine Sammellinse, reelles Bild), <b>Fernrohr</b> und <b>Mikroskop</b> (Objektiv + Okular), <b>Spiegelteleskop</b> (Hohlspiegel), <b>Fernglas</b> (Fernrohr + Umlenkprismen), <b>Brille</b> (korrigiert das Auge).',
    steps: [
      { kind: 'story', title: 'Der letzte Bauplan', render(el) {
        el.append(D([
          { who: 'prof', text: 'Heute Abend ist die Lange Nacht der Optik! Ein Ausstellungsstück fehlt noch: ein <b>Fernrohr-Baukasten</b>, mit dem die Gäste selbst ein Fernrohr bauen können.' },
          { who: 'lumi', text: 'Im Baukasten liegen drei Objektive und vier Okulare. Baut ein Fernrohr, das den Bauauftrag erfüllt – dann ist die Ausstellung komplett!' },
        ]));
      } },
      { kind: 'exp', title: 'Fernrohr-Baukasten', gate: true, render(el, api) {
        el.append(box('tip', 'Bauauftrag', '• mindestens <b>10-fache</b> Vergrößerung<br>• höchstens <b>70 cm</b> Abstand zwischen den Linsen<br>• <b>scharfes</b> Bild'));
        const fb = h('div', { class: 'fb-slot' });
        let done = false;
        B.twoLensScope(el, { kit: true, X1: 30, f1: 400, f2: 100, d: 300, onChange: (st) => {
          if (done || !st.sharp) return;
          if (st.mag >= 9.95 && st.d <= 70) {
            done = true;
            fb.append(UI.feedback('ok', `<b>Bauauftrag erfüllt!</b> ${UI.fmt(st.mag, 0)}-fache Vergrößerung bei ${UI.fmt(st.d, 1)} cm Länge${st.upright ? ' – und das Bild steht sogar aufrecht (Galilei)!' : '.'}`));
            api.done();
          }
        } });
        el.append(fb);
        el.append(P('<p class="dim">Tipp: Vergrößerung = f₁ : f₂, Abstand = f₁ + f₂ (Kepler) bzw. f₁ − f₂ (Galilei).</p>'));
      } },
      { kind: 'task', title: 'Wer braucht was?', gate: true, render(el, api) {
        const O = ['Lupe', 'Mikroskop', 'Fernglas', 'Spiegelteleskop', 'Brille mit Zerstreuungslinse', 'Brille mit Sammellinse', 'Fotoapparat'];
        T.cloze(el, { title: 'Ordnet jedem Gast das passende Instrument zu', solved: api.solved, onSolved: api.done, parts: [
          'Mia will eine Ameise groß sehen → ', { opts: O, a: 'Lupe' }, { br: true },
          'Frau Dr. Sommer will Zellen untersuchen → ', { opts: O, a: 'Mikroskop' }, { br: true },
          'Frau Berger will Vögel im Wald beobachten → ', { opts: O, a: 'Fernglas' }, { br: true },
          'Ein Forschungsteam will ferne Galaxien beobachten → ', { opts: O, a: 'Spiegelteleskop' }, { br: true },
          'Jonas (kurzsichtig) will die Tafel lesen → ', { opts: O, a: 'Brille mit Zerstreuungslinse' }, { br: true },
          'Oma Erika will die Zeitung lesen → ', { opts: O, a: 'Brille mit Sammellinse' }, { br: true },
          'Herr Kaya will den Sternenhimmel fotografieren → ', { opts: O, a: 'Fotoapparat' },
        ] });
      } },
      { kind: 'story', title: 'Die Lange Nacht der Optik', render(el, api) {
        el.append(h('div', { class: 'scene-wrap', html: SCENE_HALL }));
        el.append(D([
          { who: 'prof', text: `Die Ausstellung ist eröffnet – und die Gäste sind begeistert! <b>${api.teamHtml}</b>, ohne eure Baupläne hätten wir das nie geschafft.` },
          { who: 'lumi', text: 'Lupe, Kamera, Auge, Brille, Fernrohr, Mikroskop, Spiegelteleskop, Fernglas – alles gebaut! Piep-piep-hurra!' },
          { who: 'prof', text: 'Ihr seid jetzt offiziell <b>Instrumentenbauerinnen und Instrumentenbauer</b> der Sternwarte Lichtberg. Eure zweite Urkunde liegt bereit.' },
        ]));
      } },
    ],
  });

  CONTENT.STATIONS.push(...S);
})();
