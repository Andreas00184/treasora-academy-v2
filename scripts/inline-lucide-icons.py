#!/usr/bin/env python3
"""Replace emoji feature icons with inline Lucide SVG (HTML only — no CSS/JS changes)."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Lucide stroke icons — paths only; styling via existing .icon color + inline size
PATHS = {
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    "wallet-cards": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"/><path d="M3 11h4"/><path d="M17 11h4"/>',
    "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    "bitcoin": '<path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.293 21M11.767 19.089c-.868 4.924-6.025 6.14-6.894 1.216m6.894-1.216L13.241 17M6.873 4.911c-4.924-.868-6.14 6.025-1.216 6.894m1.216-6.894L8.347 3M6.873 4.911c.868-4.924 6.025-6.14 6.894 1.216m-6.894 1.216L5.399 7"/><path d="M9.5 8.5v7"/><path d="M14.5 8.5v7"/>',
    "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "map": '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
    "brain": '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/>',
    "newspaper": '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    "compass": '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
    "book-open": '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    "trophy": '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
}

CARD_STYLE = 'width:58%;height:58%'
CHIP_STYLE = 'width:1.1em;height:1.1em;vertical-align:-0.2em;margin-right:0.35em;display:inline-block'


def svg(name: str, style: str = CARD_STYLE) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
        f'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" '
        f'style="{style}" aria-hidden="true">{PATHS[name]}</svg>'
    )


REPLACEMENTS = [
    (r'<div class="icon">🎓</div>', f'<div class="icon">{svg("graduation-cap")}</div>'),
    (r'<div class="icon">📊</div>', f'<div class="icon">{svg("layout-dashboard")}</div>'),
    (r'<div class="icon">🛂</div>', f'<div class="icon">{svg("wallet-cards")}</div>'),
    (r'<div class="icon">🎯</div>', f'<div class="icon">{svg("target")}</div>'),
    (r'<div class="icon">🏖</div>', f'<div class="icon">{svg("sun")}</div>'),
    (r'<div class="icon">📈</div>', f'<div class="icon">{svg("trending-up")}</div>'),
    (r'<div class="icon">₿</div>', f'<div class="icon">{svg("bitcoin")}</div>'),
    (r'<div class="icon">✅</div>', f'<div class="icon">{svg("circle-check")}</div>'),
    (r'<div class="icon">🗺</div>', f'<div class="icon">{svg("map")}</div>'),
    (r'<div class="icon">🧠</div>', f'<div class="icon">{svg("brain")}</div>'),
    (r'<div class="feature-icon">🗺</div>', f'<div class="feature-icon">{svg("map")}</div>'),
    (r'<div class="feature-icon">🎓</div>', f'<div class="feature-icon">{svg("graduation-cap")}</div>'),
    (r'<div class="feature-icon">📊</div>', f'<div class="feature-icon">{svg("layout-dashboard")}</div>'),
    (r'<div class="feature-icon">📰</div>', f'<div class="feature-icon">{svg("newspaper")}</div>'),
    (r'<div class="feature-icon">🧠</div>', f'<div class="feature-icon">{svg("brain")}</div>'),
    (r'<div class="feature-icon">📈</div>', f'<div class="feature-icon">{svg("trending-up")}</div>'),
    (r'<div class="feature-icon">🎯</div>', f'<div class="feature-icon">{svg("target")}</div>'),
    (r'<span class="icon">🎯</span>', f'<span class="icon">{svg("target")}</span>'),
    (r'<span class="icon">📘</span>', f'<span class="icon">{svg("book-open")}</span>'),
    (r'<span class="icon">🧭</span>', f'<span class="icon">{svg("compass")}</span>'),
    (r'<span class="icon">🧠</span>', f'<span class="icon">{svg("brain")}</span>'),
    (r'<div class="trophy">🏆</div>', f'<div class="trophy">{svg("trophy")}</div>'),
    (
        r'>🎯 Financial Freedom</button>',
        f'>{svg("target", CHIP_STYLE)} Financial Freedom</button>',
    ),
    (
        r'>🏖 Retire Early</button>',
        f'>{svg("sun", CHIP_STYLE)} Retire Early</button>',
    ),
    (
        r'>📈 Become a Trader</button>',
        f'>{svg("trending-up", CHIP_STYLE)} Become a Trader</button>',
    ),
    (
        r'>₿ Understand Crypto</button>',
        f'>{svg("bitcoin", CHIP_STYLE)} Understand Crypto</button>',
    ),
]

TARGET_FILES = [
    "index.html",
    "join-pro.html",
    "passport.html",
    "program-complete.html",
]


def apply(text: str) -> str:
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    return text


def main() -> None:
    for name in TARGET_FILES:
        path = ROOT / name
        original = path.read_text(encoding="utf-8")
        updated = apply(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"updated {name}")


if __name__ == "__main__":
    main()
