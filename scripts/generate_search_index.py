#!/usr/bin/env python3
"""Erzeugt den zentralen, statisch auslieferbaren Suchindex (index.json)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCHEMA_VERSION = "1.0.0"


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def discover_presentations(repo_root: Path) -> list[dict[str, object]]:
    presentations: list[dict[str, object]] = []

    for slides_path in sorted(repo_root.glob("**/slides.json")):
        presentation_dir = slides_path.parent
        manifest_path = presentation_dir / "manifest.json"

        if not manifest_path.exists():
            raise FileNotFoundError(f"{manifest_path} fehlt.")

        manifest = load_json(manifest_path)
        slides = load_json(slides_path)

        if not isinstance(manifest, dict):
            raise ValueError(f"{manifest_path} muss ein JSON-Objekt sein.")
        if not isinstance(slides, dict):
            raise ValueError(f"{slides_path} muss ein JSON-Objekt sein.")

        rel_path = presentation_dir.relative_to(repo_root).as_posix()
        slide_entries = slides.get("slides", [])
        slide_count = len(slide_entries) if isinstance(slide_entries, list) else 0

        files = {
            "manifest": manifest_path.relative_to(repo_root).as_posix(),
            "slides": slides_path.relative_to(repo_root).as_posix(),
            "viewer": f"{rel_path}/index.html",
            "tags": f"{rel_path}/0tags.txt",
            "fulltext": f"{rel_path}/0index.txt",
        }

        search_text = " ".join(
            str(value)
            for value in (
                manifest.get("title", ""),
                manifest.get("description", ""),
                " ".join(manifest.get("tags", [])) if isinstance(manifest.get("tags"), list) else "",
                manifest.get("language", ""),
            )
            if isinstance(value, str)
        ).strip()

        presentations.append(
            {
                "title": manifest.get("title", ""),
                "description": manifest.get("description", ""),
                "language": manifest.get("language", ""),
                "tags": manifest.get("tags", []),
                "path": rel_path,
                "slideCount": slide_count,
                "searchText": search_text,
                "files": files,
            }
        )

    return sorted(presentations, key=lambda item: str(item["path"]))


def build_index(repo_root: Path) -> dict[str, object]:
    presentations = discover_presentations(repo_root)
    return {
        "schemaVersion": SCHEMA_VERSION,
        "presentations": presentations,
    }


def write_index(index_data: dict[str, object], target: Path) -> None:
    target.write_text(
        json.dumps(index_data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Pfad zum Repository-Root.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Ausgabedatei (Standard: <repo-root>/index.json).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    output = args.output.resolve() if args.output else repo_root / "index.json"

    index_data = build_index(repo_root)
    write_index(index_data, output)

    print(f"OK: index.json erzeugt ({len(index_data['presentations'])} Präsentationen).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
