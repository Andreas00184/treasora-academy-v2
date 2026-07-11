#!/usr/bin/env python3
"""Phase A polish: unify icon, ask-dominar alignment, footer links."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAV_ASK_DOMINAR = """    <nav aria-label="Main navigation">
      <a href="index.html">Home</a>
      <a href="learn.html">Learn</a>
      <a href="ask-dominar.html" class="current">Ask Dominar</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="passport.html">Passport</a>
      <a href="join-pro.html" class="pro">Join Pro</a>
      <a href="sign-in.html" class="signin">Sign In</a>
      <a href="contact.html">Contact</a>
    </nav>"""

FOOTER = """<footer>
  <div class="container">
    <p><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Service</a> · <a href="contact.html">Contact</a><br>
    © 2026 Treasora Academy. Education before speculation. Wealth through knowledge.</p>
  </div>
</footer>"""


def unify_dominar_icon(text: str) -> str:
    return text.replace("assets/dominar-icon-v5.png", "assets/dominar-icon.png")


def patch_ask_dominar(text: str) -> str:
    text = re.sub(
        r'(<a class="logo"[^>]*>\s*<img\s+)src="data:image/[^"]+"',
        r'\1src="assets/treasora-logo.png" alt="Treasora Academy"',
        text,
        flags=re.DOTALL,
    )
    if "css/site.css" not in text:
        text = text.replace(
            '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<link rel="stylesheet" href="css/site.css">',
        )
    text = re.sub(r"<nav[^>]*>.*?</nav>", NAV_ASK_DOMINAR, text, count=1, flags=re.DOTALL)
    if "<footer>" not in text:
        text = text.replace("</body>", FOOTER + "\n</body>")
    else:
        text = re.sub(r"<footer>.*?</footer>", FOOTER, text, count=1, flags=re.DOTALL)
    return text


def patch_footer_links(text: str) -> str:
    text = re.sub(
        r"Privacy Policy · Terms of Service · <a href=\"contact\.html\">Contact</a>",
        '<a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Service</a> · <a href="contact.html">Contact</a>',
        text,
    )
    text = re.sub(
        r"Privacy Policy · Terms of Service · Contact",
        '<a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Service</a> · <a href="contact.html">Contact</a>',
        text,
    )
    # passport custom footer
    text = re.sub(
        r"Privacy Policy · Terms of Service · <a href=\"contact\.html\">Contact</a></div>",
        '<a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Service</a> · <a href="contact.html">Contact</a></div>',
        text,
    )
    return text


def patch_homepage_copy(text: str) -> str:
    return text.replace(
        "<p>Ask unlimited questions and receive personalized guidance.</p>",
        "<p>Ask Dominar for personalized guidance — free tier includes daily questions; Pro is unlimited.</p>",
    )


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        text = unify_dominar_icon(text)
        text = patch_footer_links(text)
        if path.name == "ask-dominar.html":
            text = patch_ask_dominar(text)
        if path.name == "index.html":
            text = patch_homepage_copy(text)
        path.write_text(text, encoding="utf-8")
        print(f"  {path.name}: {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    print("Phase A polish...")
    main()
    print("Done.")
