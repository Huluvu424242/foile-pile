#!/usr/bin/env python3
"""Validiert die standardisierte Präsentationsstruktur im Repository."""

from __future__ import annotations

import json
import sys
from pathlib import Path

PRESENTATIONS_DIR_NAME = "foiles"

REQUIRED_FIELDS = {
    "title": str,
    "language": str,
    "tags": list,
    "description": str,
    "path": str,
}


def is_non_empty_string(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_manifest(manifest_path: Path, repo_root: Path) -> list[str]:
    errors: list[str] = []

    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"{manifest_path}: Ungültiges JSON ({exc})"]

    if not isinstance(data, dict):
        return [f"{manifest_path}: manifest.json muss ein JSON-Objekt sein."]

    for field, expected_type in REQUIRED_FIELDS.items():
        if field not in data:
            errors.append(f"{manifest_path}: Pflichtfeld '{field}' fehlt.")
            continue

        value = data[field]
        if not isinstance(value, expected_type):
            errors.append(
                f"{manifest_path}: Feld '{field}' muss vom Typ "
                f"{expected_type.__name__} sein."
            )

    for field in ("title", "language", "description", "path"):
        if field in data and not is_non_empty_string(data[field]):
            errors.append(f"{manifest_path}: Feld '{field}' darf nicht leer sein.")

    if "tags" in data:
        tags = data["tags"]
        if not isinstance(tags, list) or not all(is_non_empty_string(tag) for tag in tags):
            errors.append(
                f"{manifest_path}: Feld 'tags' muss ein Array nicht-leerer Strings sein."
            )

    if "path" in data and isinstance(data["path"], str):
        actual_path = manifest_path.parent.relative_to(repo_root).as_posix()
        if data["path"] != actual_path:
            errors.append(
                f"{manifest_path}: Feld 'path' ist '{data['path']}', erwartet '{actual_path}'."
            )

    return errors


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    presentations_root = repo_root / PRESENTATIONS_DIR_NAME
    slide_files = sorted(presentations_root.glob("**/slides.json")) if presentations_root.exists() else []

    errors: list[str] = []

    if not slide_files:
        print("WARNUNG: Keine slides.json gefunden.")
        return 0

    for slides_file in slide_files:
        presentation_dir = slides_file.parent
        manifest_path = presentation_dir / "manifest.json"

        if not manifest_path.exists():
            errors.append(f"{presentation_dir}: manifest.json fehlt.")
            continue

        errors.extend(validate_manifest(manifest_path, repo_root))

    if errors:
        print("Strukturprüfung fehlgeschlagen:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"OK: {len(slide_files)} Präsentationen erfolgreich validiert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
