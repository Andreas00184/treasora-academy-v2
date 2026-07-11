#!/usr/bin/env python3
"""Phase B: wire shared Supabase JS into HTML pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SUPABASE_CDN = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
CORE_SCRIPTS = """
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script src="js/auth.js"></script>""".strip()

CONFIG_BLOCK = re.compile(
    r"<!-- ============================================================\s*"
    r"SUPABASE CONFIG.*?============================================================ -->"
    r"\s*<script src=\"https://unpkg.com/@supabase/supabase-js@2\"></script>\s*"
    r"<script>.*?</script>\s*",
    re.DOTALL,
)

CONFIG_BLOCK_MINIMAL = re.compile(
    r"<script src=\"https://unpkg.com/@supabase/supabase-js@2\"></script>\s*"
    r"<script>\s*const SUPABASE_URL.*?</script>\s*",
    re.DOTALL,
)

FINISH_QUIZ_HOOK = """
    document.dispatchEvent(new CustomEvent('treasora:lesson-complete', {{
      detail: {{ lesson: {n}, quizScore: correctCount, quizTotal: questions.length }}
    }}));"""


def replace_config_block(text: str, replacement: str) -> str:
    if CONFIG_BLOCK.search(text):
        return CONFIG_BLOCK.sub(replacement + "\n", text, count=1)
    return CONFIG_BLOCK_MINIMAL.sub(replacement + "\n", text, count=1)


def patch_sign_in(text: str) -> str:
    text = replace_config_block(text, CORE_SCRIPTS + '\n<script src="js/sign-in.js"></script>')
    return text


def patch_signup(text: str) -> str:
    text = replace_config_block(text, CORE_SCRIPTS + '\n<script src="js/signup.js"></script>')
    return text


def patch_reset_password(text: str) -> str:
    reset_scripts = CORE_SCRIPTS + """
<script>
(function(){
  var form = document.getElementById('reset-form');
  var success = document.getElementById('success-state');
  var btn = form.querySelector('.btn');

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var email = document.getElementById('email').value.trim();

    if (!window.SUPABASE_CONFIGURED) {
      alert("Supabase isn't configured yet. Edit js/config.js with your project keys.");
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    var redirectTo = window.location.origin + window.location.pathname.replace(/reset-password\\.html$/, 'update-password.html');
    var result = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });

    btn.disabled = false;
    btn.textContent = 'Send Reset Link';

    if (result.error) {
      alert(result.error.message);
      return;
    }

    form.style.display = 'none';
    success.style.display = 'block';
  });
})();
</script>"""
    text = re.sub(
        r"<script>\s*document\.getElementById\('reset-form'\).*?</script>",
        reset_scripts,
        text,
        count=1,
        flags=re.DOTALL,
    )
    if SUPABASE_CDN not in text:
        text = text.replace("</footer>", "</footer>\n" + reset_scripts if "reset-form" not in text else text)
    return text


def patch_passport(text: str) -> str:
    text = replace_config_block(text, CORE_SCRIPTS + '\n<script src="js/passport.js"></script>')
    text = re.sub(
        r"<script>\s*document\.querySelectorAll\('\.chip'\).*?</script>\s*",
        "",
        text,
        count=1,
        flags=re.DOTALL,
    )
    return text


def patch_join_pro(text: str) -> str:
    return replace_config_block(text, CORE_SCRIPTS + '\n<script src="js/join-pro.js"></script>')


def patch_ask_dominar(text: str) -> str:
    text = replace_config_block(text, CORE_SCRIPTS)
    text = text.replace(
        "Free plan: <strong id=\"quota-left\">7</strong> of 10 questions left today",
        'Free plan: <strong id="quota-left">5</strong> of 5 questions left today',
    )
    text = text.replace(
        "      return data.reply;\n    } catch (err) {",
        "      if (typeof data.remaining === 'number') {\n"
        "        quotaLeft = data.remaining;\n"
        "        quotaLeftEl.textContent = quotaLeft;\n"
        "      }\n"
        "      if (data.isPro && document.querySelector('.quota-text')) {\n"
        "        document.querySelector('.quota-text').innerHTML = 'Pro plan: <strong>unlimited</strong> questions';\n"
        "        quotaLeft = 9999;\n"
        "      }\n"
        "      if (data.code === 'LIMIT_REACHED') {\n"
        "        quotaLeft = 0;\n"
        "        quotaLeftEl.textContent = '0';\n"
        "      }\n"
        "      return data.reply;\n"
        "    } catch (err) {",
    )
    text = text.replace(
        "    quotaLeft -= 1;\n    quotaLeftEl.textContent = Math.max(quotaLeft, 0);\n\n    showTyping();",
        "    showTyping();",
    )
    if "async function loadQuota()" not in text:
        quota_loader = """
  async function loadQuota(){
    if (!SUPABASE_CONFIGURED || !supabaseClient) return;
    var session = await TreasoraAuth.getSession();
    if (!session) return;
    var profile = await TreasoraAuth.getProfile();
    if (profile && profile.is_pro) {
      document.querySelector('.quota-text').innerHTML = 'Pro plan: <strong>unlimited</strong> questions';
      quotaLeft = 9999;
      return;
    }
    var today = new Date().toISOString().slice(0, 10);
    var res = await supabaseClient.from('dominar_daily_usage').select('question_count').eq('usage_date', today).maybeSingle();
    var used = (res.data && res.data.question_count) || 0;
    quotaLeft = Math.max(0, 5 - used);
    quotaLeftEl.textContent = quotaLeft;
  }
  loadQuota();
"""
        text = text.replace("  var quotaLeft = parseInt(quotaLeftEl.textContent, 10);", "  var quotaLeft = parseInt(quotaLeftEl.textContent, 10);\n" + quota_loader)
    if "data.code === 'LIMIT_REACHED'" not in text.replace("data.error", ""):
        pass
    text = text.replace(
        'return data.error || "Dominar is having trouble responding right now. Please try again.";',
        'if (data.code === "LIMIT_REACHED") return data.error || "Daily limit reached.";\n'
        '        return data.error || "Dominar is having trouble responding right now. Please try again.";',
    )
    return text


def append_before_body_close(text: str, snippet: str) -> str:
    if snippet.strip() in text:
        return text
    return text.replace("</body>", snippet + "\n</body>")


def patch_dashboard(text: str) -> str:
    snippet = """
""" + CORE_SCRIPTS + """
<script src="js/lesson-progress.js"></script>
<script src="js/dashboard.js"></script>"""
    return append_before_body_close(text, snippet)


def patch_learn(text: str) -> str:
    snippet = """
""" + CORE_SCRIPTS + """
<script src="js/lesson-progress.js"></script>
<script src="js/learn.js"></script>"""
    return append_before_body_close(text, snippet)


def patch_lesson(text: str, path: Path) -> str:
    match = re.search(r"lesson-(\d+)\.html", path.name)
    if not match:
        return text
    n = int(match.group(1))
    hook = FINISH_QUIZ_HOOK.format(n=n)
    if "treasora:lesson-complete" not in text:
        text = text.replace(
            "    ctaSection.scrollIntoView({behavior:'smooth', block:'start'});\n    }, 300);\n  }",
            "    ctaSection.scrollIntoView({behavior:'smooth', block:'start'});\n    }, 300);" + hook + "\n  }",
            1,
        )
    snippet = f"""
{CORE_SCRIPTS}
<script src="js/lesson-progress.js"></script>
<script>TreasoraLessonProgress.initLessonPage({n});</script>"""
    return append_before_body_close(text, snippet)


def main() -> None:
    patches = {
        "sign-in.html": patch_sign_in,
        "signup.html": patch_signup,
        "reset-password.html": patch_reset_password,
        "passport.html": patch_passport,
        "join-pro.html": patch_join_pro,
        "ask-dominar.html": patch_ask_dominar,
        "dashboard.html": patch_dashboard,
        "learn.html": patch_learn,
    }

    for name, fn in patches.items():
        path = ROOT / name
        if not path.exists():
            continue
        original = path.read_text(encoding="utf-8")
        updated = fn(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"patched {name}")

    for path in sorted(ROOT.glob("lesson-*.html")):
        original = path.read_text(encoding="utf-8")
        updated = patch_lesson(original, path)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print(f"patched {path.name}")


if __name__ == "__main__":
    main()
