# Treasora Academy — Supabase Backend (Phase B)

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run the migration in `migrations/20250711000000_initial_schema.sql` (SQL Editor or `supabase db push`).
3. Copy `js/config.example.js` → `js/config.js` and paste your **Project URL** and **anon key**.
4. Deploy edge functions:
   - `dominar-chat`
   - `create-checkout-session`
   - `stripe-webhook`
5. Set secrets (see `.env.example` in repo root):
   - `OPENAI_API_KEY` — Dominar responses
   - `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
   - `SITE_URL` — your production domain (checkout redirects)

## Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration, add:

- Site URL: your domain
- Redirect URLs: `https://your-domain.com/update-password.html`

Password reset emails link to `update-password.html`.

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile + Pro status |
| `financial_passports` | Onboarding questionnaire |
| `lesson_progress` | Lessons 1–20 completion |
| `dominar_daily_usage` | Free-tier daily question quota (5/day) |
| `dominar_messages` | Chat history |
