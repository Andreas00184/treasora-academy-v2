# Treasora Academy — Public Access & Edit Guide

Share this file with Claude (or any editor) to access and modify the website.

---

## Public website (live)

**Homepage:** https://treasora-academy-v2-6ypw.vercel.app

| Page | URL |
|------|-----|
| Home | https://treasora-academy-v2-6ypw.vercel.app/index.html |
| Learn | https://treasora-academy-v2-6ypw.vercel.app/learn.html |
| Ask Dominar | https://treasora-academy-v2-6ypw.vercel.app/ask-dominar.html |
| Dashboard | https://treasora-academy-v2-6ypw.vercel.app/dashboard.html |
| Financial Passport | https://treasora-academy-v2-6ypw.vercel.app/passport.html |
| Join Pro | https://treasora-academy-v2-6ypw.vercel.app/join-pro.html |
| Sign up | https://treasora-academy-v2-6ypw.vercel.app/signup.html |
| Sign in | https://treasora-academy-v2-6ypw.vercel.app/sign-in.html |
| Contact | https://treasora-academy-v2-6ypw.vercel.app/contact.html |
| Settings | https://treasora-academy-v2-6ypw.vercel.app/settings.html |

Deploys automatically from the `main` branch on GitHub (Vercel).

---

## Source code (GitHub)

**Repository:** https://github.com/Andreas00184/treasora-academy-v2

**Default branch:** `main`

**Edit files on GitHub:** open any file → pencil icon → commit to `main` → site redeploys in ~1 minute.

---

## Download full HTML site (ZIP)

**Direct download:** https://github.com/Andreas00184/treasora-academy-v2/releases/download/html-website/treasora-academy-html.zip

**Release page:** https://github.com/Andreas00184/treasora-academy-v2/releases/tag/html-website

Unzip locally, then run `python3 -m http.server 8080` and open http://localhost:8080

---

## Key files to edit

| What to change | File(s) |
|----------------|---------|
| Homepage content & layout | `index.html` |
| Typography tokens (phone / laptop) | `css/tokens.css` |
| Scale application (all pages) | `css/refine-scale.css` (via `site.css`) |
| English UI text (nav, buttons, labels) | `js/i18n/locales/en.json` |
| Italian / Spanish UI text | `js/i18n/locales/it.json`, `js/i18n/locales/es.json` |
| Pricing / Join Pro page | `join-pro.html`, `js/join-pro.js` |
| Lessons (20 pages) | `lesson-1.html` … `lesson-20.html` |
| Learn page lesson list | `learn.html` |
| Auth pages | `signup.html`, `sign-in.html`, `reset-password.html` |
| Legal pages | `privacy.html`, `terms.html` |
| Supabase frontend config (local only) | `js/config.js` (copy from `js/config.example.js`) |
| Backend secrets (Stripe, OpenAI) | Supabase Edge Function secrets — see `.env.example` |

---

## Typography rules (site-wide)

- **Headings, card titles, buttons, nav:** Title Case  
  e.g. `Simple. Focused. Guided.`, `Create Account`, `Join Pro`
- **Body text & descriptions:** sentence case  
  e.g. `Dominar remembers your goals…`
- **Brand names (always):** Treasora Academy, Dominar, Financial Passport

---

## Backend config (not in public repo)

`js/config.js` is gitignored. For sign-in, Dominar, and Pro checkout to work in production, set real values in:

- **Frontend:** `js/config.js` on the server (or Vercel env if wired)
- **Backend:** Supabase Edge Function secrets — see `supabase/README.md` and `.env.example`

---

## Quick prompt for Claude

Copy and paste this to Claude:

```
Edit the Treasora Academy static website.

Public site: https://treasora-academy-v2-6ypw.vercel.app
GitHub repo: https://github.com/Andreas00184/treasora-academy-v2
Access guide: https://github.com/Andreas00184/treasora-academy-v2/blob/main/PROJECT-ACCESS.md

Stack: 36 HTML pages, css/site.css, js/, i18n in js/i18n/locales/.
Changes to main branch auto-deploy on Vercel.
```
