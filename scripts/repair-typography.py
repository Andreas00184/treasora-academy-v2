#!/usr/bin/env python3
"""Apply typography capitalization fixes across Treasora Academy HTML pages."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Global replacements (all HTML files)
GLOBAL_REPLACEMENTS = [
    ("Learn with Dominar", "Learn With Dominar"),
    (">Try again<", ">Try Again<"),
    ("What Dominar<br>remembers.", "What Dominar<br>Remembers."),
    ("In progress", "In Progress"),
    ("Not started", "Not Started"),
    ("Coming soon", "Coming Soon"),
]

# Per-file replacements
FILE_REPLACEMENTS = {
    "index.html": [
        ("Personalized AI financial education", "Personalized AI Financial Education"),
        ("One AI mentor.", "One AI Mentor."),
        ("One clear path.", "One Clear Path."),
        ("Dominar does the work.", "Dominar Does the Work."),
        ("Simple, focused, guided.", "Simple. Focused. Guided."),
        ("How Treasora works.", "How Treasora Works."),
        ("Your goal builds your curriculum.", "Your Goal Builds Your Curriculum."),
        ("What Dominar remembers.", "What Dominar Remembers."),
        ("Free forever. Unlimited when you're ready.", "Free Forever. Unlimited When You're Ready."),
        ("<h3>Your goal</h3>", "<h3>Your Goals</h3>"),
        ("<h3>Your progress</h3>", "<h3>Your Progress</h3>"),
        ("<h3>Your roadmap</h3>", "<h3>Your Roadmap</h3>"),
        ("<h3>Your personality</h3>", "<h3>Your Personality</h3>"),
        ("Create account →", "Create Account →"),
        ("Register to ask →", "Register to Ask →"),
        ("Register to unlock →", "Register to Unlock →"),
    ],
    "join-pro.html": [
        ("What Pro unlocks", "What Pro Unlocks"),
        ("Best value", "Best Value"),
    ],
    "passport.html": [
        ("What Dominar<br>remembers.", "What Dominar<br>Remembers."),
        ("Portfolio interests", "Portfolio Interests"),
        ("Favorite investments (optional)", "Favorite Investments (Optional)"),
        ("Where would you like to start?", "Where Would You Like to Start?"),
    ],
    "contact.html": [
        ("We'd love to <span class=\"gold\">hear from you.</span>", "We'd Love to <span class=\"gold\">Hear From You.</span>"),
        ("What's this about?", "What Is This About?"),
        ("General question", "General Question"),
        ("Account or billing", "Account or Billing"),
        ("Report a bug", "Report a Bug"),
        ("Partnership or press", "Partnership or Press"),
        ("Something else", "Something Else"),
    ],
    "sign-in.html": [
        ("Sign In To<br><span class=\"gold\">Continue.</span>", "Sign In.<br><span class=\"gold\">Continue.</span>"),
        ("Sign up free", "Sign Up Free"),
    ],
    "thank-you.html": [
        ("Message <span class=\"gold\">sent.</span>", "Message <span class=\"gold\">Sent.</span>"),
        ("While you wait", "While You Wait"),
    ],
    "program-complete.html": [
        ("Congratulations. <span class=\"gold\">You did it.</span>", "Congratulations. <span class=\"gold\">You Did It.</span>"),
        ("A message from Dominar", "A Message From Dominar"),
        ("Your foundation is built.<br>Now let's go further.", "Your Foundation Is Built.<br>Now Let's Go Further."),
        ("Not now, take me to my Dashboard", "Not Now — Take Me to My Dashboard"),
    ],
    "reset-password.html": [
        ("Check your inbox", "Check Your Inbox"),
        ("Sign in", "Sign In"),
    ],
    "privacy.html": [
        ("Information we collect", "Information We Collect"),
        ("How we use your information", "How We Use Your Information"),
        ("Data sharing", "Data Sharing"),
        ("Your rights", "Your Rights"),
    ],
    "terms.html": [
        ("Educational purpose only", "Educational Purpose Only"),
        ("Free and Pro plans", "Free and Pro Plans"),
        ("Acceptable use", "Acceptable Use"),
        ("Intellectual property", "Intellectual Property"),
        ("Disclaimer of warranties", "Disclaimer of Warranties"),
        ("Limitation of liability", "Limitation of Liability"),
    ],
    "dashboard.html": [
        ("Continue where you left off", "Continue Where You Left Off"),
        ("In progress", "In Progress"),
        ("Not started", "Not Started"),
    ],
    "settings.html": [
        ('data-i18n="footer.contact data-i18n="nav.contact"', 'data-i18n="nav.contact"'),
    ],
}

# Lesson completion headings: Lesson N complete -> Lesson N Complete
import re


def fix_lesson_complete(content: str) -> str:
    content = re.sub(
        r"(<h2>Lesson \d+) complete (🎉</h2>)",
        r"\1 Complete \2",
        content,
    )
    return content


def main() -> None:
    html_files = list(ROOT.glob("*.html"))
    changed = []

    for path in html_files:
        text = path.read_text(encoding="utf-8")
        original = text

        for old, new in GLOBAL_REPLACEMENTS:
            text = text.replace(old, new)

        rel = path.name
        if rel in FILE_REPLACEMENTS:
            for old, new in FILE_REPLACEMENTS[rel]:
                text = text.replace(old, new)

        if rel.startswith("lesson-"):
            text = fix_lesson_complete(text)

        if text != original:
            path.write_text(text, encoding="utf-8")
            changed.append(rel)

    print(f"Updated {len(changed)} files:")
    for name in sorted(changed):
        print(f"  - {name}")


if __name__ == "__main__":
    main()
