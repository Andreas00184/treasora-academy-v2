#!/usr/bin/env python3
"""Remove duplicate Supabase/auth/billing/nav script tags introduced by simplify-nav.py."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCRIPT_TAGS = [
    r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"></script>',
    r'<script src="js/config\.js"></script>',
    r'<script src="js/supabase-client\.js"></script>',
    r'<script src="js/auth\.js"></script>',
    r'<script src="js/billing\.js"></script>',
    r'<script src="js/nav\.js"></script>',
]


def dedupe_scripts(text: str) -> str:
    for pattern in SCRIPT_TAGS:
        regex = re.compile(pattern)
        matches = list(regex.finditer(text))
        if len(matches) <= 1:
            continue
        # Keep the first occurrence; remove later duplicates.
        for match in reversed(matches[1:]):
            start = match.start()
            end = match.end()
            # Remove trailing newline when present.
            if end < len(text) and text[end] == "\n":
                end += 1
            text = text[:start] + text[end:]
    return text


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        original = path.read_text(encoding="utf-8")
        updated = dedupe_scripts(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"deduped {path.name}")


if __name__ == "__main__":
    main()
