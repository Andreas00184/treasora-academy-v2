#!/usr/bin/env python3
"""Replace emoji card icons with data-treasora-icon Lucide placeholders."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Order matters: longer / unique patterns first
REPLACEMENTS = [
    (r'<div class="icon">🎓</div>', '<div class="icon" data-treasora-icon="graduation-cap"></div>'),
    (r'<div class="icon">📊</div>', '<div class="icon" data-treasora-icon="layout-dashboard"></div>'),
    (r'<div class="icon">🛂</div>', '<div class="icon" data-treasora-icon="wallet-cards"></div>'),
    (r'<div class="icon">🎯</div>', '<div class="icon" data-treasora-icon="target"></div>'),
    (r'<div class="icon">🏖</div>', '<div class="icon" data-treasora-icon="sun"></div>'),
    (r'<div class="icon">📈</div>', '<div class="icon" data-treasora-icon="trending-up"></div>'),
    (r'<div class="icon">₿</div>', '<div class="icon" data-treasora-icon="bitcoin"></div>'),
    (r'<div class="icon">✅</div>', '<div class="icon" data-treasora-icon="circle-check"></div>'),
    (r'<div class="icon">🗺</div>', '<div class="icon" data-treasora-icon="map"></div>'),
    (r'<div class="icon">🧠</div>', '<div class="icon" data-treasora-icon="brain"></div>'),
    (r'<div class="feature-icon">🗺</div>', '<div class="feature-icon" data-treasora-icon="map"></div>'),
    (r'<div class="feature-icon">🎓</div>', '<div class="feature-icon" data-treasora-icon="graduation-cap"></div>'),
    (r'<div class="feature-icon">📊</div>', '<div class="feature-icon" data-treasora-icon="layout-dashboard"></div>'),
    (r'<div class="feature-icon">📰</div>', '<div class="feature-icon" data-treasora-icon="newspaper"></div>'),
    (r'<div class="feature-icon">🧠</div>', '<div class="feature-icon" data-treasora-icon="brain"></div>'),
    (r'<div class="feature-icon">📈</div>', '<div class="feature-icon" data-treasora-icon="trending-up"></div>'),
    (r'<div class="feature-icon">🎯</div>', '<div class="feature-icon" data-treasora-icon="target"></div>'),
    (r'<span class="icon">🎯</span>', '<span class="icon" data-treasora-icon="target"></span>'),
    (r'<span class="icon">📘</span>', '<span class="icon" data-treasora-icon="book-open"></span>'),
    (r'<span class="icon">🧭</span>', '<span class="icon" data-treasora-icon="compass"></span>'),
    (r'<span class="icon">🧠</span>', '<span class="icon" data-treasora-icon="brain"></span>'),
    (r'<div class="trophy">🏆</div>', '<div class="trophy" data-treasora-icon="trophy"></div>'),
    (r'<div class="phase-icon">🔒</div>', '<div class="phase-icon" data-treasora-icon="lock"></div>'),
    (r'<div class="phase-icon">✓</div>', '<div class="phase-icon" data-treasora-icon="check"></div>'),
    (r'<div class="phase-icon">●</div>', '<div class="phase-icon" data-treasora-icon="circle"></div>'),
    (
        r'<button type="button" class="chip" data-goal="I want financial freedom through passive income and dividend investing\.">🎯 Financial Freedom</button>',
        '<button type="button" class="chip" data-goal="I want financial freedom through passive income and dividend investing."><span class="chip-icon" data-treasora-icon="target"></span>Financial Freedom</button>',
    ),
    (
        r'<button type="button" class="chip" data-goal="I want to retire early with a solid portfolio and tax plan\.">🏖 Retire Early</button>',
        '<button type="button" class="chip" data-goal="I want to retire early with a solid portfolio and tax plan."><span class="chip-icon" data-treasora-icon="sun"></span>Retire Early</button>',
    ),
    (
        r'<button type="button" class="chip" data-goal="I want to become a confident, disciplined trader\.">📈 Become a Trader</button>',
        '<button type="button" class="chip" data-goal="I want to become a confident, disciplined trader."><span class="chip-icon" data-treasora-icon="trending-up"></span>Become a Trader</button>',
    ),
    (
        r'<button type="button" class="chip" data-goal="I want to understand crypto: Bitcoin, Ethereum, and custody\.">₿ Understand Crypto</button>',
        '<button type="button" class="chip" data-goal="I want to understand crypto: Bitcoin, Ethereum, and custody."><span class="chip-icon" data-treasora-icon="bitcoin"></span>Understand Crypto</button>',
    ),
    (
        r'<div class="pv">🎯 Financial Freedom</div>',
        '<div class="pv"><span class="chip-icon" data-treasora-icon="target"></span>Financial Freedom</div>',
    ),
]

ICON_SCRIPT = '<script src="js/treasora-icons.js"></script>\n'


def ensure_icon_script(text: str) -> str:
    if 'src="js/treasora-icons.js"' in text:
        return text
    marker = '<script src="js/nav.js"></script>'
    if marker in text:
        return text.replace(marker, ICON_SCRIPT + marker, 1)
    return text


def replace_icons(text: str) -> str:
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    return ensure_icon_script(text)


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        original = path.read_text(encoding="utf-8")
        updated = replace_icons(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"updated {path.name}")


if __name__ == "__main__":
    main()
