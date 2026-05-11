# Entwickler-Workflow ohne Node.js

Dieser Workflow beschreibt lokale Entwicklung, Qualitätschecks und einen einfachen Release-Ablauf **ohne npm/node**.

## Voraussetzungen

- Git
- Python 3.10+ (inkl. Standardbibliothek)
- Bash (Linux/macOS) oder Git Bash (Windows)

## Quickstart (sauberes System)

```bash
git clone https://github.com/Huluvu424242/foile-pile.git
cd foile-pile
python3 scripts/validate_repository_structure.py
python3 scripts/generate_search_index.py
python3 scripts/check_search_index.py
rm -rf _site
mkdir -p _site
cp -a site/. _site/
cp -a foiles _site/foiles
python3 -m http.server 8080 --directory _site
```

Danach ist das Portal lokal verfügbar unter:

- <http://localhost:8080/>

## Lokale Entwicklung

1. Änderungen an Präsentationen (`foiles/`), Metadaten oder Portal-Dateien (`site/`) durchführen.
2. Struktur validieren:

   ```bash
   python3 scripts/validate_repository_structure.py
   ```

3. Manifeste und Suchindex neu erzeugen:

   ```bash
   python3 scripts/sync_manifests.py
   ```

4. Konsistenz prüfen:

   ```bash
   python3 scripts/check_search_index.py
   ```

5. Optional lokales Deployment-Artefakt bauen und starten:

   ```bash
   rm -rf _site
   mkdir -p _site
   cp -a site/. _site/
   cp -a foiles _site/foiles
   python3 -m http.server 8080 --directory _site
   ```

6. Änderungen committen:

   ```bash
   git add .
   git commit -m "Beschreibe die Änderung"
   ```

## Release-Workflow

Der Release läuft über GitHub Actions. Nach einem Push auf `main` baut der Workflow `.github/workflows/pages.yml` ein Pages-Artefakt aus `site/` und `foiles/` und veröffentlicht es über GitHub Pages.

```bash
# 1) Arbeitsstand aktualisieren
git checkout main
git pull --ff-only

# 2) Qualitätschecks
python3 scripts/validate_repository_structure.py
python3 scripts/sync_manifests.py
python3 scripts/check_search_index.py

# 3) Release committen (falls manifest.json oder site/index.json aktualisiert wurden)
git add foiles site/index.json
git commit -m "chore: update generated manifests and site index"

# 4) Veröffentlichen
git push origin main
```

## Troubleshooting

- `python3: command not found`  
  -> Python 3 installieren und erneut ausführen.

- `FEHLER: index.json ist nicht aktuell.`  
  -> `python3 scripts/sync_manifests.py` oder `python3 scripts/generate_search_index.py` ausführen und Änderungen committen.
