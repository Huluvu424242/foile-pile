# Repository-Struktur für Präsentationen

Dieses Repository trennt die Portal-Webseite von den Präsentationsquellen, damit Suche, Viewer und Download automatisiert arbeiten können.

## Verzeichnis-Schema

Alle Präsentationen liegen unter `foiles/` nach folgendem Muster:

`/foiles/<bereich>/<thema>/<praesentation>/`

Im aktuellen Bestand werden dafür folgende Bereichsordner verwendet:

- `foiles/guides/`
- `foiles/explainations/`
- `foiles/evaluationen/`
- `foiles/projects/`

Eine Präsentation wird technisch darüber erkannt, dass im Präsentationsordner eine `slides.json` vorhanden ist. Die Portalquellen liegen separat unter `site/`.

## Pflichtdateien pro Präsentation

Jeder Präsentationsordner muss mindestens enthalten:

- `slides.json`
- `manifest.json`

## Pflichtmetadaten (`manifest.json`)

`manifest.json` muss ein JSON-Objekt mit folgenden Feldern sein:

- `title` (String): Anzeigename der Präsentation
- `language` (String): Sprachkürzel, z. B. `de` oder `en`
- `tags` (Array[String]): Such- und Filterbegriffe
- `description` (String): Kurzbeschreibung der Präsentation
- `path` (String): Relativer Pfad des Präsentationsordners ab Repository-Root

Beispiel:

```json
{
  "title": "Grundlagen",
  "language": "de",
  "tags": ["javascript", "types"],
  "description": "Einführung in JavaScript-Grundlagen.",
  "path": "foiles/explainations/javascript/grundlagen"
}
```

Optional kann `manifest.json` zusätzlich Integritätsdaten enthalten:

- `checksums` (Objekt): Schlüssel = relativer Dateipfad, Wert = SHA-256-Hash (Hex oder `sha256:<hex>`)

Beispiel:

```json
{
  "checksums": {
    "slides.json": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "index.html": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  }
}
```

Beim `.sld`-Download im Portal werden diese Prüfsummen (falls vorhanden) validiert. Bei Abweichungen wird der Download mit einer verständlichen Fehlermeldung abgebrochen.

## Validierung

Die Struktur und Pflichtmetadaten können mit folgendem Skript geprüft werden:

```bash
python scripts/validate_repository_structure.py
```

Bei Verstößen gibt das Skript verständliche Fehler inkl. Dateipfad aus und beendet sich mit Exit-Code `1`.

## Zentraler Suchindex (`site/index.json`)

Unter `site/index.json` wird ein zentraler Suchindex mit versioniertem Schema gepflegt:

- Datei: `site/index.json`
- Feld `schemaVersion`: aktuelle Schema-Version des Indexformats
- Feld `presentations`: Liste aller Präsentationen inkl. Suchfelder und Dateireferenzen

Pro Eintrag werden u. a. diese Informationen bereitgestellt:

- `title`, `description`, `language`, `tags`, `path`
- `searchText` (voraggregierter Suchtext für clientseitige Suche)
- `slideCount`
- `files` mit Referenzen auf `manifest.json`, `slides.json`, Viewer-Pfad, Tags und Exportdateien

Erzeugung (reproduzierbar, ohne Node.js):

```bash
python scripts/generate_search_index.py
```

Aktualitätsprüfung (lokal/CI):

```bash
python scripts/check_search_index.py
```
