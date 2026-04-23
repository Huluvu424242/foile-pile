#!/usr/bin/env python3
"""Validate that official docs do not reference Node.js/npm commands."""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OFFICIAL_DOCS = [
    ROOT / "README.md",
    ROOT / "docs" / "developer-workflow.md",
]

# block standalone node/npm terms and typical command patterns
BLOCKED_PATTERNS = [
    re.compile(r"(?i)\\bnpm\\b"),
    re.compile(r"(?i)\\bnode(\\.js)?\\b"),
    re.compile(r"(?i)\\bnpx\\b"),
    re.compile(r"(?i)\\byarn\\b"),
    re.compile(r"(?i)\\bpnpm\\b"),
]


def main() -> int:
    failures: list[str] = []

    for doc_path in OFFICIAL_DOCS:
        if not doc_path.exists():
            failures.append(f"Missing required documentation file: {doc_path.relative_to(ROOT)}")
            continue

        text = doc_path.read_text(encoding="utf-8")
        for idx, line in enumerate(text.splitlines(), start=1):
            for pattern in BLOCKED_PATTERNS:
                if pattern.search(line):
                    failures.append(
                        f"{doc_path.relative_to(ROOT)}:{idx}: blocked token found -> {line.strip()}"
                    )
                    break

    if failures:
        print("Documentation validation failed:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print("Documentation validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
