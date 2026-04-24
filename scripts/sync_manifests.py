#!/usr/bin/env python3
"""Erzeugt/aktualisiert manifest.json für alle Präsentationsordner mit slides.json."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

DEFAULT_LANGUAGE = "de"


def load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path}: JSON muss ein Objekt sein.")
    return data


def prettify_segment(segment: str) -> str:
    cleaned = re.sub(r"[-_]+", " ", segment).strip()
    words = [word[:1].upper() + word[1:] for word in cleaned.split() if word]
    return " ".join(words) if words else segment


def derive_title(slides_data: dict[str, Any], rel_parts: tuple[str, ...]) -> str:
    title = slides_data.get("title")
    if isinstance(title, str) and title.strip():
        return title.strip()
    return prettify_segment(rel_parts[-1])


def derive_description(slides_data: dict[str, Any], rel_parts: tuple[str, ...], title: str) -> str:
    description = slides_data.get("description")
    if isinstance(description, str) and description.strip():
        return description.strip()

    area = prettify_segment(rel_parts[0]) if len(rel_parts) >= 1 else "Unbekannt"
    topic_source = rel_parts[-2] if len(rel_parts) >= 3 else rel_parts[-1]
    topic = prettify_segment(topic_source) if rel_parts else title
    return f'Präsentation im Bereich "{area}" zum Thema "{topic}".'


def derive_language(slides_data: dict[str, Any], existing_manifest: dict[str, Any]) -> str:
    language = slides_data.get("language")
    if isinstance(language, str) and language.strip():
        return language.strip()

    existing = existing_manifest.get("language")
    if isinstance(existing, str) and existing.strip():
        return existing.strip()

    return DEFAULT_LANGUAGE


def derive_tags(slides_data: dict[str, Any], existing_manifest: dict[str, Any]) -> list[str]:
    tags = slides_data.get("tags")
    if isinstance(tags, list):
        cleaned = [tag.strip() for tag in tags if isinstance(tag, str) and tag.strip()]
        if cleaned:
            return cleaned

    existing_tags = existing_manifest.get("tags")
    if isinstance(existing_tags, list):
        cleaned = [tag.strip() for tag in existing_tags if isinstance(tag, str) and tag.strip()]
        if cleaned:
            return cleaned

    return []


def build_manifest(
    slides_data: dict[str, Any], existing_manifest: dict[str, Any], rel_path: str
) -> dict[str, Any]:
    rel_parts = tuple(part for part in rel_path.split("/") if part)
    title = derive_title(slides_data, rel_parts)

    manifest: dict[str, Any] = {
        "title": title,
        "language": derive_language(slides_data, existing_manifest),
        "tags": derive_tags(slides_data, existing_manifest),
        "description": derive_description(slides_data, rel_parts, title),
        "path": rel_path,
    }

    for key, value in existing_manifest.items():
        if key not in manifest:
            manifest[key] = value

    return manifest


def sync_manifest_for_slides(slides_path: Path, repo_root: Path) -> bool:
    presentation_dir = slides_path.parent
    manifest_path = presentation_dir / "manifest.json"

    slides_data = load_json(slides_path)
    existing_manifest = load_json(manifest_path) if manifest_path.exists() else {}

    rel_path = presentation_dir.relative_to(repo_root).as_posix()
    updated_manifest = build_manifest(slides_data, existing_manifest, rel_path)
    serialized = json.dumps(updated_manifest, ensure_ascii=False, indent=2) + "\n"

    previous = manifest_path.read_text(encoding="utf-8") if manifest_path.exists() else None
    if previous == serialized:
        return False

    manifest_path.write_text(serialized, encoding="utf-8")
    return True


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    changed = 0

    for slides_path in sorted(repo_root.glob("**/slides.json")):
        if sync_manifest_for_slides(slides_path, repo_root):
            print(f"Aktualisiert: {slides_path.parent.relative_to(repo_root).as_posix()}/manifest.json")
            changed += 1

    print(f"Fertig. Geänderte manifest.json: {changed}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        sys.exit(1)
