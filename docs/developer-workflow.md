# Entwickler-Workflow ohne Node.js

Diese Anleitung beschreibt den offiziellen Setup- und Release-Weg für dieses Repository ohne npm-Tooling.

## Voraussetzungen

- Git
- Bash (Linux/macOS oder Git Bash unter Windows)
- Python 3.10+
- `curl` (für den lokalen Smoke-Test)

## Quickstart (sauberes System)

```bash
git clone https://github.com/Huluvu424242/foile-pile.git
cd foile-pile
python3 --version
bash scripts/check_quickstart.sh
```

Ergebnis: Das Script startet lokal einen Webserver, prüft die Erreichbarkeit von `projects/foile-pile/index.html` und beendet sich danach wieder.

## Lokale Dokumentations- und Workflow-Checks

```bash
python3 scripts/validate_official_docs.py
bash scripts/check_quickstart.sh
```

## GitHub Actions Workflows

### 1) Docs & Quickstart
Datei: `.github/workflows/docs-and-quickstart.yml`

- Läuft bei Push und Pull Request.
- Prüft, dass die offizielle Doku keine Node-/npm-Kommandos enthält.
- Führt den Quickstart-Smoke-Test mit Python/Bash aus.

### 2) Release Static Site Bundle
Datei: `.github/workflows/release-static-site.yml`

- Läuft bei Tag-Push `v*` (z. B. `v1.0.0`).
- Erstellt ein statisches Tarball-Artefakt des Repositories.
- Veröffentlicht das Bundle als GitHub Release Asset.

## Release-Ablauf

```bash
# optional: lokale Checks
python3 scripts/validate_official_docs.py
bash scripts/check_quickstart.sh

# Release-Tag erstellen
git tag v1.0.0
git push origin v1.0.0
```

Nach dem Tag-Push erstellt GitHub Actions automatisch einen Release-Eintrag mit dem statischen Bundle.
