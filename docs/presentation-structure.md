# Repository-Struktur für Präsentationen

Dieses Repository verwendet ein einheitliches Schema, damit Suche, Viewer und Download automatisiert arbeiten können.

## Verzeichnis-Schema

Alle Präsentationen liegen nach folgendem Muster:

`/<bereich>/<thema>/<praesentation>/`

Im aktuellen Bestand werden dafür folgende Bereichsordner verwendet:

- `guides/`
- `explainations/`
- `evaluationen/`
- `projects/`

Eine Präsentation wird technisch darüber erkannt, dass im Präsentationsordner eine `slides.json` vorhanden ist.

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
  "path": "explainations/javascript/grundlagen"
}
```

## Validierung

Die Struktur und Pflichtmetadaten können mit folgendem Skript geprüft werden:

```bash
python scripts/validate_repository_structure.py
```

Bei Verstößen gibt das Skript verständliche Fehler inkl. Dateipfad aus und beendet sich mit Exit-Code `1`.
