#!/usr/bin/env python3
"""Replace duplicated nav blocks with site-nav placeholder and wire shared nav.js."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAV_PATTERN = re.compile(
    r'<nav[^>]*data-i18n-aria="nav\.mainNav"[^>]*>.*?</nav>',
    re.DOTALL,
)
NAV_REPLACEMENT = (
    '<nav id="site-nav" class="site-nav" data-i18n-aria="nav.mainNav" '
    'aria-label="Main navigation"></nav>'
)

FOOTER_LANG = '<div class="footer-lang-bar" id="footer-lang-bar"></div>\n\n'

FULL_NAV_SCRIPTS = """<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script src="js/auth.js"></script>
<script src="js/billing.js"></script>
<script src="js/nav.js"></script>
"""

NAV_ONLY_SCRIPT = '<script src="js/nav.js"></script>\n'


def ensure_footer_lang(text: str) -> str:
    if 'id="footer-lang-bar"' in text:
        return text
    return text.replace("<footer", FOOTER_LANG + "<footer", 1)


def ensure_nav_scripts(text: str) -> str:
    if 'src="js/nav.js"' in text:
        return text

    marker = '<script src="js/i18n-init.js"></script>'
    bundle = NAV_ONLY_SCRIPT if 'src="js/supabase-client.js"' in text else FULL_NAV_SCRIPTS

    if marker in text:
        return text.replace(marker, marker + "\n" + bundle, 1)

    # Pages without i18n-init (shouldn't happen)
    body_close = "</body>"
    if body_close in text:
        return text.replace(body_close, bundle + body_close, 1)
    return text


def simplify_nav(text: str) -> str:
    text = NAV_PATTERN.sub(NAV_REPLACEMENT, text)
    text = ensure_footer_lang(text)
    text = ensure_nav_scripts(text)
    return text


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        original = path.read_text(encoding="utf-8")
        updated = simplify_nav(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"updated {path.name}")


if __name__ == "__main__":
    main()
