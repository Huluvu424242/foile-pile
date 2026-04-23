# Stories zur Implementierung der Portal-Webseite

## Zielbild
Als Nutzer möchte ich in einem Webportal Präsentationen finden, ansehen und als `.sld` herunterladen können, ohne dass für Entwicklung oder Deployment eine Node.js-Umgebung erforderlich ist.

## Rahmenbedingungen (Definition of Done übergreifend)
- Das Portal ist als statische Webseite betreibbar (z. B. GitHub Pages/Nginx/S3 Static Hosting).
- Suche und Filter laufen vollständig im Browser.
- `.sld`-Download wird im Browser als ZIP des Präsentationsordners gebaut.
- Keine Node.js-Abhängigkeit in Build/Runtime (lokale Helferskripte dürfen z. B. Python/Bash sein).

---

## Epic A — Informationsarchitektur & Datenmodell

### Story A1 — Repository-Struktur für Präsentationen standardisieren
**Als** Maintainer  
**möchte ich** alle Präsentationen in einer konsistenten Verzeichnisstruktur ablegen  
**damit** Suche, Viewer und Download automatisiert darauf zugreifen können.

**Akzeptanzkriterien**
- Einheitliches Schema dokumentiert (z. B. `/<bereich>/<thema>/<praesentation>/...`).
- Für jede Präsentation existieren Pflichtmetadaten (Titel, Sprache, Tags, Beschreibung, Pfad).
- Bestehende Inhalte sind validierbar (Script/Check meldet Verstöße verständlich).

**Technische Tasks**
- Strukturkonvention in `README` oder `docs/` dokumentieren.
- Metadatenformat festlegen (`manifest.json` je Präsentation oder zentraler Index).
- Validierungs-Skript (Python/Bash) erstellen.

### Story A2 — Zentralen Suchindex erzeugen
**Als** Portal  
**möchte ich** einen zentralen, statisch auslieferbaren Index (`index.json`) haben  
**damit** die Suche vollständig clientseitig funktioniert.

**Akzeptanzkriterien**
- `index.json` enthält alle notwendigen Suchfelder und Dateireferenzen.
- Index-Erzeugung ist reproduzierbar ohne Node.js.
- Neue Präsentationen erscheinen nach Index-Neugenerierung automatisch.

**Technische Tasks**
- Generator-Skript (Python) schreiben.
- CI/Local-Check zur Aktualität von `index.json` ergänzen.
- Feldschema versionieren (`schemaVersion`).

---

## Epic B — Webportal & Suchfunktion

### Story B1 — Portal-Startseite mit Ergebnisliste
**Als** Nutzer  
**möchte ich** eine Übersicht aller verfügbaren Präsentationen sehen  
**damit** ich schnell in relevante Inhalte einsteigen kann.

**Akzeptanzkriterien**
- Liste zeigt Titel, Kurzbeschreibung, Tags, Bereich/Kategorie.
- Sortierung nach Relevanz/Alphabet ist möglich.
- Leerer Zustand und Fehlermeldungen sind benutzerfreundlich.

### Story B2 — Volltextsuche im Browser
**Als** Nutzer  
**möchte ich** per Suchfeld Präsentationen nach Stichwörtern finden  
**damit** ich passende Inhalte schnell entdecke.

**Akzeptanzkriterien**
- Suche reagiert bei Eingabe in < 200 ms für typisches Datenvolumen.
- Suchtreffer markieren relevante Felder (Titel/Tags/Beschreibung).
- Suche funktioniert vollständig offline nach initialem Laden der Assets.

**Technische Tasks**
- Clientseitiger Suchindex laden (`fetch index.json`).
- Tokenisierung/Normalisierung (Kleinschreibung, Umlaute, ggf. Stemming) definieren.
- Debounce für Eingabe & Ergebnis-Caching umsetzen.

### Story B3 — Filter und Facetten
**Als** Nutzer  
**möchte ich** Ergebnisse nach Tags, Sprache und Bereich filtern  
**damit** ich die Trefferliste präzisieren kann.

**Akzeptanzkriterien**
- Mehrfachauswahl von Filtern möglich.
- Aktive Filter sind sichtbar und einzeln entfernbar.
- Trefferanzahl aktualisiert sich sofort.

---

## Epic C — Wiedergabe im `sld-slideshow-viewer`

### Story C1 — Präsentation aus Ergebnisliste im Viewer öffnen
**Als** Nutzer  
**möchte ich** eine gefundene Präsentation direkt im `sld-slideshow-viewer` starten  
**damit** ich vor dem Download prüfen kann, ob sie die richtige ist.

**Akzeptanzkriterien**
- Jede Ergebnis-Karte hat eine Aktion „Ansehen“.
- Viewer erhält die nötigen Daten (Pfad/Manifest/Dateiliste) korrekt.
- Fehlerfälle (fehlende Dateien, ungültiges Manifest) werden angezeigt.

**Technische Tasks**
- Integrationsvertrag mit `sld-slideshow-viewer` definieren.
- Router/Navigationsfluss (Liste → Detail/Viewer) umsetzen.
- Smoke-Test mit mindestens 3 realen Präsentationen.

---

## Epic D — `.sld`-Download im Browser

### Story D1 — ZIP-Erstellung im Browser
**Als** Nutzer  
**möchte ich** eine Präsentation als `.sld` herunterladen  
**damit** ich sie lokal oder in anderen Tools nutzen kann.

**Akzeptanzkriterien**
- Download-Button erzeugt clientseitig ein ZIP des Präsentationsordners.
- Dateiname folgt Konvention (z. B. `<slug>.sld`).
- ZIP enthält die gleiche Struktur wie im Repository.

**Technische Tasks**
- Dateiliste aus Manifest/Index ermitteln.
- Dateien per `fetch` laden und in ZIP packen.
- MIME/Download-Handling für `.sld` testen (Desktop + Mobile Browser).

### Story D2 — Integritätsprüfung vor Download
**Als** Nutzer  
**möchte ich** eine klare Rückmeldung bei unvollständigen Präsentationen  
**damit** ich keine defekten `.sld`-Dateien herunterlade.

**Akzeptanzkriterien**
- Fehlende Dateien werden erkannt und verständlich gemeldet.
- Download wird bei kritischen Fehlern verhindert.
- Optional: Prüfsumme im Manifest wird validiert.

---

## Epic E — Betrieb ohne Node.js

### Story E1 — Entwickler-Workflow ohne Node dokumentieren
**Als** Entwickler  
**möchte ich** einen einfachen Setup- und Release-Workflow ohne Node.js  
**damit** der Betrieb unabhängig von npm-Tooling bleibt.

**Akzeptanzkriterien**
- Dokumentation enthält lokale Schritte mit Python/Bash.
- „Quickstart“ funktioniert auf sauberem System.
- Keine npm/node-Kommandos in offizieller Doku.

### Story E2 — Deployment als statische Seite
**Als** Betreiber  
**möchte ich** das Portal per Static Hosting deployen  
**damit** der Betrieb robust und kostengünstig ist.

**Akzeptanzkriterien**
- Build-Artefakte sind statische Dateien.
- Deployment-Anleitung für mindestens ein Zielsystem vorhanden.
- Cache-Strategie für `index.json` und Assets dokumentiert.

---

## Priorisierungsvorschlag (MVP)
1. **A1 + A2** (Struktur und Index)
2. **B1 + B2** (Liste und Suche)
3. **C1** (Viewer-Öffnen)
4. **D1** (`.sld`-Download)
5. **B3 + D2** (Filter und Robustheit)
6. **E1 + E2** (Doku und Deployment)

## Risiko-/Abhängigkeits-Notizen
- Sehr große Präsentationen können clientseitiges ZIP-Bauen verlangsamen → progress indicator + Web Worker einplanen.
- CORS/Path-Probleme bei nicht standardisiertem Hosting vermeiden (nur relative Pfade, keine absoluten host-spezifischen URLs).
- Frühzeitiger Vertragstest mit `sld-slideshow-viewer` reduziert Integrationsrisiko.
