#!/usr/bin/env python3
"""Ensure footer language bar has visible static markup on every page."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FOOTER_LANG = """<div class="footer-lang-bar" id="footer-lang-bar">
  <span class="footer-lang-label" data-i18n="footer.language">Language</span>
  <div class="footer-lang-options">
    <button type="button" class="footer-lang-btn" data-locale="en">🇺🇸 English</button>
    <span class="footer-lang-sep" aria-hidden="true">|</span>
    <button type="button" class="footer-lang-btn" data-locale="es">🇪🇸 Español</button>
  </div>
</div>

"""

EMPTY_FOOTER_LANG = '<div class="footer-lang-bar" id="footer-lang-bar"></div>\n\n'


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        updated = text
        if EMPTY_FOOTER_LANG in text:
            updated = text.replace(EMPTY_FOOTER_LANG, FOOTER_LANG, 1)
        elif 'id="footer-lang-bar"></div>' in text and "footer-lang-options" not in text:
            updated = text.replace(
                '<div class="footer-lang-bar" id="footer-lang-bar"></div>\n\n',
                FOOTER_LANG,
                1,
            )
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            print(f"updated {path.name}")


if __name__ == "__main__":
    main()
