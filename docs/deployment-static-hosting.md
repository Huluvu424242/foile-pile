# Deployment als statische Seite

Diese Anleitung beschreibt den Betrieb des Portals **ohne Node.js** auf einem statischen Host.

## Ziel

Die Anwendung wird ausschließlich als statische Dateien ausgeliefert:

- `index.html`
- `portal.css`
- `portal.js`
- `index.json`
- Präsentationsordner unter `guides/`, `explainations/`, `evaluationen/`, `projects/`

Es ist **kein Build-System** notwendig. Der veröffentlichte Git-Stand ist direkt das Deployment-Artefakt.

## Beispiel-Zielsystem: GitHub Pages

1. Repository auf `main` aktuell halten.
2. Vor Veröffentlichung lokale Checks ausführen:

   ```bash
   python3 scripts/validate_repository_structure.py
   python3 scripts/generate_search_index.py
   python3 scripts/check_search_index.py
   ```

3. Änderungen committen und pushen:

   ```bash
   git add .
   git commit -m "chore: release static site"
   git push origin main
   ```

4. In GitHub unter **Settings → Pages** als Source `Deploy from a branch` wählen und Branch `main` / Folder `/ (root)` konfigurieren.

Danach wird das Portal als statische Seite ausgeliefert.

## Cache-Strategie

Damit Nutzer zeitnah neue Inhalte sehen und gleichzeitig gute Ladezeiten erhalten, werden zwei Klassen unterschieden.

### 1) `index.json` (häufige Inhaltsänderungen)

Empfohlene HTTP-Header:

- `Cache-Control: no-cache, must-revalidate`
- Optional: `ETag` oder `Last-Modified`

Wirkung:

- Browser dürfen cachen, müssen aber vor Wiederverwendung revalidieren.
- Aktualisierte Suchindizes werden schnell sichtbar.

### 2) Statische Assets (`portal.css`, `portal.js`, Bilder, Präsentationsdateien)

Empfohlene HTTP-Header:

- `Cache-Control: public, max-age=31536000, immutable`

Wirkung:

- Sehr lange Browser-Caches für selten geänderte Dateien.
- Geringere Ladezeiten und weniger Bandbreite.

### Versionierung bei Änderungen

Bei geänderten Assets sollte ein Versionsparameter oder Dateinamenswechsel verwendet werden, damit Clients neue Dateien laden.

Beispiel in `index.html`:

```html
<link rel="stylesheet" href="portal.css?v=2026-04-23">
<script src="portal.js?v=2026-04-23" defer></script>
```

Für `index.json` kann ebenfalls ein Versionsparameter gesetzt werden (z. B. `index.json?v=2026-04-23`), falls ein Host keine Header-Steuerung erlaubt.

## Verifikation nach Deployment

- Startseite lädt ohne JavaScript-Fehler.
- Präsentationsliste wird aus `index.json` angezeigt.
- Suche/Filter funktionieren im Browser.
- Viewer- und Download-Links funktionieren relativ (ohne host-spezifische absolute URLs).
