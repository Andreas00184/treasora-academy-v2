#!/usr/bin/env python3
"""Apply standard token sizing across all HTML pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LOGO_PATTERNS = [
    (r"width:235px", "width:var(--treasora-logo)"),
    (r"width:240px", "width:var(--treasora-logo)"),
    (r"max-width:76vw", "max-width:72vw"),
    (r"max-width:82vw", "max-width:72vw"),
]

# Strip signup/sign-in bloated mobile typography overrides (layout only)
SIGNUP_MOBILE_MINIMAL = """@media(max-width:560px){
.container{width:calc(100% - 34px)!important}
.actions{display:grid;grid-template-columns:1fr;gap:10px}
.btn{width:100%}
}"""

SIGNUP_MOBILE_RE = re.compile(
    r"@media\(max-width:560px\)\{.*?\}\s*\n(?=\s*</style>)",
    re.DOTALL,
)

DESKTOP_HERO_KILL = re.compile(
    r"/\* FINAL TYPOGRAPHY FIX:.*?\*/\s*"
    r"@media\(min-width:561px\)\{.*?\}\s*\n",
    re.DOTALL,
)

PASSPORT_H1_FIX = (
    "@media(min-width:760px){\n"
    "  .hero{padding:70px 0 64px}\n"
    "  h1{font-size:64px}\n"
    "  .lead{font-size:18px}\n"
    "  .passport-card{padding:32px}\n"
    "  .dominar-intro{padding:32px}\n"
    "  .memory-grid{grid-template-columns:repeat(2,1fr)}\n"
    "}",
    "@media(min-width:760px){\n"
    "  .hero{padding:48px 0 40px}\n"
    "  .passport-card{padding:24px}\n"
    "  .dominar-intro{padding:24px}\n"
    "  .memory-grid{grid-template-columns:repeat(2,1fr)}\n"
    "}",
)

STANDARD_LINK = '<link rel="stylesheet" href="css/standard.css?v=3">\n'


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    for old, new in LOGO_PATTERNS:
        text = text.replace(old, new)

    if path.name in ("signup.html", "sign-in.html"):
        text = DESKTOP_HERO_KILL.sub("", text)
        text = SIGNUP_MOBILE_RE.sub(SIGNUP_MOBILE_MINIMAL + "\n", text)

    if path.name == "passport.html":
        text = text.replace(PASSPORT_H1_FIX[0], PASSPORT_H1_FIX[1])
        text = text.replace("h1{font-size:40px;", "h1{font-size:var(--treasora-hero);")

    text = text.replace(
        '<link rel="stylesheet" href="css/standard.css">',
        STANDARD_LINK.strip(),
    )
    if "css/standard.css" not in text and "</head>" in text:
        text = text.replace("</head>", STANDARD_LINK + "</head>", 1)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = [p.name for p in sorted(ROOT.glob("*.html")) if fix_file(p)]
    print(f"Updated {len(changed)} files")
    for name in changed:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
