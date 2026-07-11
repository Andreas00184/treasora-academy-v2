#!/usr/bin/env python3
"""Repair nav links broken by wire-i18n.py and ensure Settings nav link."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

HREF_FIXES = [
    (r'href="index\.html data-i18n', 'href="index.html" data-i18n'),
    (r'href="index\.html" class="current data-i18n', 'href="index.html" class="current" data-i18n'),
    (r'href="learn\.html data-i18n', 'href="learn.html" data-i18n'),
    (r'href="learn\.html" class="current data-i18n', 'href="learn.html" class="current" data-i18n'),
    (r'href="ask-dominar\.html data-i18n', 'href="ask-dominar.html" data-i18n'),
    (r'href="ask-dominar\.html" class="current data-i18n', 'href="ask-dominar.html" class="current" data-i18n'),
    (r'href="dashboard\.html" class="current data-i18n', 'href="dashboard.html" class="current" data-i18n'),
    (r'href="dashboard\.html data-i18n', 'href="dashboard.html" data-i18n'),
    (r'href="passport\.html" class="current data-i18n', 'href="passport.html" class="current" data-i18n'),
    (r'href="passport\.html data-i18n', 'href="passport.html" data-i18n'),
    (r'href="join-pro\.html" class="pro current"(?!")', 'href="join-pro.html" class="pro current"'),
    (r'href="join-pro\.html" class="pro data-i18n', 'href="join-pro.html" class="pro" data-i18n'),
    (r'href="join-pro\.html data-i18n', 'href="join-pro.html" data-i18n'),
    (r'href="settings\.html" class="current data-i18n', 'href="settings.html" class="current" data-i18n'),
    (r'href="settings\.html data-i18n', 'href="settings.html" data-i18n'),
    (r'href="sign-in\.html" class="signin data-i18n', 'href="sign-in.html" class="signin" data-i18n'),
    (r'href="sign-in\.html data-i18n', 'href="sign-in.html" data-i18n'),
    (r'href="contact\.html" class="current data-i18n', 'href="contact.html" class="current" data-i18n'),
    (r'href="contact\.html data-i18n', 'href="contact.html" data-i18n'),
]

SETTINGS_LINK = (
    '      <a href="settings.html" data-i18n="nav.settings">Settings</a>\n'
)


def repair(text: str) -> str:
    for pat, repl in HREF_FIXES:
        text = re.sub(pat, repl, text)

    # Join Pro on join-pro page: add i18n if missing
    text = re.sub(
        r'(<a href="join-pro\.html" class="pro current">)(Join Pro</a>)',
        r'\1<span data-i18n="nav.joinPro">Join Pro</span></a>',
        text,
    )

    # Add Settings link after Financial Passport if not present
    if "href=\"settings.html\"" not in text and 'data-i18n="nav.passport"' in text:
        text = text.replace(
            '      <a href="passport.html" class="current" data-i18n="nav.passport">Financial Passport</a>\n',
            '      <a href="passport.html" class="current" data-i18n="nav.passport">Financial Passport</a>\n'
            + SETTINGS_LINK,
        )
        text = text.replace(
            '      <a href="passport.html" data-i18n="nav.passport">Financial Passport</a>\n',
            '      <a href="passport.html" data-i18n="nav.passport">Financial Passport</a>\n'
            + SETTINGS_LINK,
        )

    return text


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        original = path.read_text(encoding="utf-8")
        updated = repair(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"repaired {path.name}")


if __name__ == "__main__":
    main()
