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
python3 -m http.server 8080
```

Danach ist das Portal lokal verfügbar unter:

- <http://localhost:8080/>

## Lokale Entwicklung

1. Änderungen an Präsentationen, Metadaten oder Portal-Dateien durchführen.
2. Struktur validieren:

   ```bash
   python3 scripts/validate_repository_structure.py
   ```

3. Suchindex neu erzeugen:

   ```bash
   python3 scripts/generate_search_index.py
   ```

4. Konsistenz prüfen:

   ```bash
   python3 scripts/check_search_index.py
   ```

5. Änderungen committen:

   ```bash
   git add .
   git commit -m "Beschreibe die Änderung"
   ```

## Release-Workflow (statische Auslieferung)

Der Release benötigt nur Git + Python und erzeugt ein statisch auslieferbares Repository.

```bash
# 1) Arbeitsstand aktualisieren
git checkout main
git pull --ff-only

# 2) Qualitätschecks
python3 scripts/validate_repository_structure.py
python3 scripts/generate_search_index.py
python3 scripts/check_search_index.py

# 3) Release committen (falls index.json aktualisiert wurde)
git add index.json
git commit -m "chore: update search index"

# 4) Veröffentlichen
git push origin main
```

## Troubleshooting

- `python3: command not found`  
  -> Python 3 installieren und erneut ausführen.

- `FEHLER: index.json ist nicht aktuell.`  
  -> `python3 scripts/generate_search_index.py` ausführen und Änderungen committen.
