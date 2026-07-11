#!/usr/bin/env python3
"""Inject i18n scripts, Settings nav link, and footer keys across HTML pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

I18N_SCRIPTS = """
<script src="js/i18n/i18n.js"></script>
<script src="js/i18n-init.js"></script>"""

# Insert Settings before Sign In in standard 8-link nav
SETTINGS_LINK = '<a href="settings.html" data-i18n="nav.settings">Settings</a>'

NAV_I18N_MAP = [
    (r'(<a href="index\.html")([^>]*>)Home', r'\1 data-i18n="nav.home">Home'),
    (r'(<a href="learn\.html")([^>]*>)Learn', r'\1 data-i18n="nav.learn">Learn'),
    (r'(<a href="ask-dominar\.html")([^>]*>)Ask Dominar', r'\1 data-i18n="nav.askDominar">Ask Dominar'),
    (r'(<a href="dashboard\.html")([^>]*>)Dashboard', r'\1 data-i18n="nav.dashboard">Dashboard'),
    (r'(<a href="passport\.html")([^>]*>)Passport', r'\1 data-i18n="nav.passport">Financial Passport'),
    (r'(<a href="passport\.html")([^>]*>)Financial Passport', r'\1 data-i18n="nav.passport">Financial Passport'),
    (r'(<a href="join-pro\.html" class="pro")([^>]*>)Join Pro', r'\1 data-i18n="nav.joinPro">Join Pro'),
    (r'(<a href="settings\.html")([^>]*>)Settings', r'\1 data-i18n="nav.settings">Settings'),
    (r'(<a href="sign-in\.html" class="signin")([^>]*>)Sign In', r'\1 data-i18n="nav.signIn">Sign In'),
    (r'(<a href="sign-in\.html")([^>]*>)Sign In', r'\1 data-i18n="nav.signIn">Sign In'),
    (r'(<a href="contact\.html")([^>]*>)Contact', r'\1 data-i18n="nav.contact">Contact'),
    (r'aria-label="Main navigation"', 'data-i18n-aria="nav.mainNav" aria-label="Main navigation"'),
]


def add_settings_link(text: str) -> str:
    if "settings.html" in text:
        return text
    # Insert before Sign In link
    patterns = [
        (r'(<a href="join-pro\.html" class="pro"[^>]*>Join Pro</a>\s*)', r"\1" + SETTINGS_LINK + "\n      "),
        (r'(<a href="join-pro\.html" class="pro"[^>]*data-i18n="nav\.joinPro">Join Pro</a>\s*)', r"\1" + SETTINGS_LINK + "\n      "),
    ]
    for pat, repl in patterns:
        if re.search(pat, text):
            return re.sub(pat, repl, text, count=1)
    return text


def patch_footer(text: str) -> str:
    text = text.replace("Privacy Policy", '<span data-i18n="footer.privacy">Privacy Policy</span>', 1) if 'data-i18n="footer.privacy"' not in text else text
    if 'data-i18n="footer.terms"' not in text:
        text = re.sub(
            r"(<a href=\"terms\.html\">)Terms of Service(</a>)",
            r'\1<span data-i18n="footer.terms">Terms of Service</span>\2',
            text,
            count=1,
        )
        text = re.sub(
            r"Terms of Service · ",
            '<a href="terms.html"><span data-i18n="footer.terms">Terms of Service</span></a> · ',
            text,
            count=1,
        )
    if 'data-i18n="footer.contact"' not in text and 'href="contact.html"' in text:
        text = re.sub(
            r'(<a href="contact\.html">)Contact(</a>)',
            r'\1<span data-i18n="footer.contact">Contact</span>\2',
            text,
            count=1,
        )
    return text


def inject_i18n_scripts(text: str) -> str:
    if "js/i18n/i18n.js" in text:
        return text
    # Before </body>
    return text.replace("</body>", I18N_SCRIPTS + "\n</body>", 1)


def patch_nav_i18n(text: str) -> str:
    for pat, repl in NAV_I18N_MAP:
        text = re.sub(pat, repl, text)
    return text


def patch_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original
    updated = patch_nav_i18n(updated)
    updated = add_settings_link(updated)
    updated = patch_footer(updated)
    updated = inject_i18n_scripts(updated)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        if patch_file(path):
            print(f"patched {path.name}")


if __name__ == "__main__":
    main()
