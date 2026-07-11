#!/usr/bin/env python3
"""Assemble Treasora Academy site: unify nav, footer, assets across all HTML pages."""

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAV_ITEMS = [
    ("index.html", "Home", None),
    ("learn.html", "Learn", None),
    ("ask-dominar.html", "Ask Dominar", None),
    ("dashboard.html", "Dashboard", None),
    ("passport.html", "Passport", None),
    ("join-pro.html", "Join Pro", "pro"),
    ("sign-in.html", "Sign In", "signin"),
    ("contact.html", "Contact", None),
]

FOOTER_HTML = """<footer>
  <div class="container">
    <p><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Service</a> · <a href="contact.html">Contact</a><br>
    © 2026 Treasora Academy. Education before speculation. Wealth through knowledge.</p>
  </div>
</footer>"""

DOMINAR_IMG_STYLE = (
    'width:100%;height:100%;object-fit:cover;object-position:center 30%;'
    'border-radius:inherit;display:block'
)

PAGE_CURRENT = {
    "index.html": "index.html",
    "learn.html": "learn.html",
    "ask-dominar.html": "ask-dominar.html",
    "dashboard.html": "dashboard.html",
    "passport.html": "passport.html",
    "join-pro.html": "join-pro.html",
    "contact.html": "contact.html",
    "program-complete.html": "learn.html",
}

LESSON_RE = re.compile(r"lesson-\d+\.html$")


def current_for_page(filename: str) -> str | None:
    if LESSON_RE.match(filename):
        return "learn.html"
    return PAGE_CURRENT.get(filename)


def build_nav(current_href: str | None) -> str:
    lines = ['<nav aria-label="Main navigation">']
    for href, label, extra_class in NAV_ITEMS:
        classes = []
        if extra_class:
            classes.append(extra_class)
        if current_href == href:
            classes.append("current")
        class_attr = f' class="{" ".join(classes)}"' if classes else ""
        lines.append(f'      <a href="{href}"{class_attr}>{label}</a>')
    lines.append("    </nav>")
    return "\n".join(lines)


def replace_base64_logos(text: str) -> str:
    text = re.sub(
        r'(<a class="logo"[^>]*>\s*<img\s+)src="data:image/[^"]+"([^>]*>)',
        r'\1src="assets/treasora-logo.png" alt="Treasora Academy"\2',
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r'(<img\s+)src="data:image/png;base64,[A-Za-z0-9+/=]+"',
        r'\1src="assets/dominar-icon.png" alt="Dominar"',
        text,
    )
    while re.search(r'alt="[^"]*"\s+alt="', text):
        text = re.sub(r'(alt="[^"]*")\s+alt="[^"]*"', r"\1", text)
    return text


def replace_dominar_refs(text: str) -> str:
    text = text.replace("assets/dominar-icon.jpg", "assets/dominar-icon.png")
    text = text.replace("assets/dominar-avatar.jpg", "assets/dominar-icon.png")
    text = text.replace("assets/dominar-icon-v5.png", "assets/dominar-icon.png")
    text = text.replace("object-position:center;", "object-position:center 30%;")
    text = text.replace(
        "object-fit:cover;object-position:center;border-radius:inherit;display:block",
        DOMINAR_IMG_STYLE,
    )
    return text


def replace_nav(text: str, filename: str) -> str:
    current = current_for_page(filename)
    new_nav = build_nav(current)
    return re.sub(r"<nav[^>]*>.*?</nav>", new_nav, text, count=1, flags=re.DOTALL)


def replace_footer(text: str) -> str:
    if re.search(r"<footer>", text):
        return re.sub(r"<footer>.*?</footer>", FOOTER_HTML, text, count=1, flags=re.DOTALL)
    return re.sub(r"</body>", FOOTER_HTML + "\n</body>", text, count=1)


def add_site_css_link(text: str) -> str:
    if "css/site.css" in text:
        return text
    return re.sub(
        r"(<meta name=\"viewport\"[^>]*>\n)",
        r'\1<link rel="stylesheet" href="css/site.css">\n',
        text,
        count=1,
    )


def fix_ctas(text: str, filename: str) -> str:
    if filename == "index.html":
        text = text.replace('href="contact.html">Subscribe Free', 'href="signup.html">Subscribe Free')
    if filename == "passport.html":
        text = re.sub(
            r'href="contact\.html">Register',
            'href="signup.html">Register',
            text,
        )
        text = re.sub(
            r'href="contact\.html">Create',
            'href="signup.html">Create',
            text,
        )
    return text


def process_file(path: Path) -> None:
    filename = path.name
    text = path.read_text(encoding="utf-8")
    text = add_site_css_link(text)
    text = replace_base64_logos(text)
    text = replace_dominar_refs(text)
    text = replace_nav(text, filename)
    text = replace_footer(text)
    text = fix_ctas(text, filename)
    path.write_text(text, encoding="utf-8")
    size_kb = path.stat().st_size // 1024
    print(f"  {filename}: {size_kb} KB")


def main() -> None:
    html_files = sorted(ROOT.glob("*.html"))
    print(f"Assembling {len(html_files)} pages...")
    for path in html_files:
        process_file(path)
    print("Done.")


if __name__ == "__main__":
    main()
