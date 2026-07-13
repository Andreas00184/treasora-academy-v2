#!/usr/bin/env python3
"""Inject standard.css as the last stylesheet on every HTML page."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK = '<link rel="stylesheet" href="css/standard.css">\n'
MARKER = "css/standard.css"


def main() -> None:
    updated = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if MARKER in text:
            continue
        if "</head>" not in text:
            continue
        text = text.replace("</head>", LINK + "</head>", 1)
        path.write_text(text, encoding="utf-8")
        updated.append(path.name)
    print(f"Updated {len(updated)} files:")
    for name in updated:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
