# Mission Aurelia – Lernpfad Lichtbrechung

Interaktiver Lernpfad zur Lichtbrechung für die Jahrgangsstufe 8 (Gymnasium NRW).
Die Schülerinnen und Schüler helfen dem Optik-Roboter LUMI, die zerbrochene Objektivlinse
der Sternwarte Lichtberg neu zu bauen – rechtzeitig, bevor der Komet Aurelia vorbeizieht.

**Stationen:** Prolog · 1 Der geknickte Lichtstrahl · 2 Fachbegriffe (Lot, α, β) ·
3 Messlabor Luft → Glas · 4 Glas → Luft (Umkehrbarkeit, Totalreflexion) · 5 Quader und Prisma ·
6 Aus Prismen wird eine Linse · 7 Drei besondere Strahlen · 8 Finale: Fernrohr scharf stellen

Informationen für Lehrkräfte (Stationsübersicht, Lösungen, Lehrkraft-Modus, Datenschutz):
[`lehrkraefte.html`](lehrkraefte.html)

## Technik

- Reines HTML/CSS/JavaScript, kein Build-Schritt, keine Abhängigkeiten, keine externen Ressourcen.
- Strahlengänge werden mit dem Brechungsgesetz berechnet (`js/optics.js`).
- Fortschritt wird nur im `localStorage` des Browsers gespeichert.
- Funktioniert direkt aus dem Ordner (Doppelklick auf `index.html`) und auf GitHub Pages.

| Datei | Inhalt |
|---|---|
| `js/optics.js` | 2D-Raytracing (Brechung, Fresnel-Teilreflexion, Totalreflexion, Brennpunkt) |
| `js/sims.js` | Simulationen: Zielschuss, optische Scheibe, Quader/Prisma, Linsen, besondere Strahlen, Fernrohr |
| `js/tasks.js` | Aufgabentypen: Multiple Choice, Lückentext, Zahl, Beschriften, Messtabelle, Vorhersage |
| `js/content.js` | Geschichte und alle Stationen mit ihren Schritten und Merksätzen |
| `js/app.js` | Navigation, Karte, Fortschritt, Logbuch, Urkunde |

## Lokal starten

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Veröffentlichen auf GitHub Pages

Repository-Einstellungen → *Pages* → *Deploy from a branch* → Branch `main`, Ordner `/ (root)`.
Nach Änderungen an JS/CSS die Versionsnummer `?v=…` in `index.html` erhöhen, damit Browser die neue Fassung laden.
