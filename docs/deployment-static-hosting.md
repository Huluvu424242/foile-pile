# Deployment als statische Seite

Diese Anleitung beschreibt den Betrieb des Portals **ohne Node.js** auf einem statischen Host.

## Ziel

Die Anwendung wird ausschließlich als statische Dateien ausgeliefert. Im Repository sind Quellen und Deployment-Artefakt getrennt:

- Portalquellen: `site/index.html`, `site/portal.css`, `site/portal.js`, `site/index.json`
- Präsentationsquellen: `foiles/`
- Hilfsskripte: `scripts/`

Das veröffentlichte Artefakt enthält den Inhalt von `site/` im Webroot und die Präsentationen als `foiles/` daneben.

## GitHub Pages

GitHub Pages wird über GitHub Actions veröffentlicht, nicht mehr über `Deploy from a branch`.

1. Repository auf `main` aktuell halten.
2. Vor Veröffentlichung lokale Checks ausführen:

   ```bash
   python3 scripts/validate_repository_structure.py
   python3 scripts/sync_manifests.py
   python3 scripts/check_search_index.py
   ```

3. Änderungen committen und pushen:

   ```bash
   git add .
   git commit -m "chore: release static site"
   git push origin main
   ```

4. In GitHub unter **Settings → Pages** als Source **GitHub Actions** auswählen.

Der Workflow `.github/workflows/pages.yml` erzeugt das Pages-Artefakt aus `site/` und `foiles/` und deployt es anschließend.

## Manuelles Artefakt für andere statische Hosts

Für andere Hosts kann das gleiche Artefakt lokal erzeugt werden:

```bash
python3 scripts/sync_manifests.py
rm -rf _site
mkdir -p _site
cp -a site/. _site/
cp -a foiles _site/foiles
```

Anschließend wird der Inhalt von `_site/` auf den statischen Host kopiert.

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

Beispiel in `site/index.html`:

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
