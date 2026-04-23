#!/usr/bin/env python3
"""Prüft, ob index.json dem aktuell generierten Suchindex entspricht."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

from generate_search_index import build_index, write_index


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    committed_index = repo_root / "index.json"

    if not committed_index.exists():
        print("FEHLER: index.json fehlt. Bitte zuerst generieren.")
        return 1

    expected_data = build_index(repo_root)

    with tempfile.TemporaryDirectory(prefix="foile-pile-index-check-") as tmpdir:
        generated_path = Path(tmpdir) / "index.json"
        write_index(expected_data, generated_path)

        committed = json.loads(committed_index.read_text(encoding="utf-8"))
        generated = json.loads(generated_path.read_text(encoding="utf-8"))

    if committed != generated:
        print("FEHLER: index.json ist nicht aktuell.")
        print("Bitte ausführen: python scripts/generate_search_index.py")
        return 1

    print("OK: index.json ist aktuell.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
