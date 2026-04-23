# foile-pile

## Zielbild
Als Nutzer möchte ich in einem Webportal Präsentationen finden, ansehen und als `.sld` herunterladen können, ohne dass für Entwicklung oder Deployment eine Node.js-Umgebung erforderlich ist.

## Rahmenbedingungen (Definition of Done übergreifend)
- Das Portal ist als statische Webseite betreibbar (z. B. GitHub Pages/Nginx/S3 Static Hosting).
- Suche und Filter laufen vollständig im Browser.
- `.sld`-Download wird im Browser als ZIP des Präsentationsordners gebaut.
- Keine Node.js-Abhängigkeit in Build/Runtime (lokale Helferskripte dürfen z. B. Python/Bash sein).


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

## Repository-Konventionen
- Standardisierte Präsentationsstruktur: `docs/presentation-structure.md`
- Entwickler-Workflow ohne Node.js: `docs/developer-workflow.md`
- Validierungsskript: `python scripts/validate_repository_structure.py`

- Zentralen Suchindex erzeugen: `python scripts/generate_search_index.py`
- Suchindex auf Aktualität prüfen: `python scripts/check_search_index.py`

## Quickstart (ohne Node.js)

```bash
python3 scripts/validate_repository_structure.py
python3 scripts/generate_search_index.py
python3 scripts/check_search_index.py
python3 -m http.server 8080
```

Danach ist das Portal lokal unter <http://localhost:8080/> erreichbar.
