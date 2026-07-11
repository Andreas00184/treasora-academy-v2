# Treasora Academy — Supabase Backend (Phase B)

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run the migration in `migrations/20250711000000_initial_schema.sql` (SQL Editor or `supabase db push`).
3. Copy `js/config.example.js` → `js/config.js` and paste your **Project URL** and **anon key**.
4. Deploy edge functions:
   - `dominar-chat`
   - `create-checkout-session`
   - `create-billing-portal-session`
   - `stripe-webhook`
5. Set secrets (see `.env.example` in repo root):
   - `OPENAI_API_KEY` — Dominar responses
   - `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
   - `SITE_URL` — your production domain (checkout redirects)

## Stripe subscription management

Run `migrations/20250711130000_stripe_subscriptions.sql` after the initial schema.

### Configure Stripe

1. Create a **Pro** recurring Price in Stripe Dashboard → copy Price ID to `STRIPE_PRO_PRICE_ID`.
2. Enable the **Customer Portal** (Settings → Billing → Customer portal) so users can cancel, update payment method, and view invoices.
3. Add webhook endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.finalized`

### Stored in Supabase

| Field / table | Purpose |
|---------------|---------|
| `profiles.stripe_customer_id` | Stripe Customer ID |
| `profiles.stripe_subscription_id` | Active subscription ID |
| `profiles.subscription_status` | Stripe status (`active`, `canceled`, etc.) |
| `profiles.current_plan` | `free` or `pro` |
| `profiles.renewal_date` | Current period end |
| `profiles.is_pro` | Synced from subscription (used by Dominar quota) |
| `billing_history` | Invoice records from webhooks |

Users upgrade via **Join Pro** checkout; **Manage Subscription** on the dashboard opens the Stripe Billing Portal. Webhooks automatically upgrade on payment and downgrade when a subscription is canceled or expires.

## Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration, add:

- Site URL: your domain
- Redirect URLs: `https://your-domain.com/update-password.html`

Password reset emails link to `update-password.html`.

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile, plan tier, Stripe IDs, renewal date |
| `financial_passports` | Onboarding questionnaire |
| `lesson_progress` | Lessons 1–20 completion |
| `dominar_daily_usage` | Free-tier daily question quota (5/day) |
| `dominar_messages` | Chat history |
| `billing_history` | Stripe invoice history |

## Phase C — Dominar Memory

Run `migrations/20250711120000_dominar_memory.sql` to add passport memory fields:
`country`, `portfolio_interests`, `favorite_investments`, `last_topic_discussed`.

The `dominar-chat` function now:
- Injects learner context (passport, progress, weak areas) into every reply
- Includes the last 10 messages for conversational continuity
- Supports `{ "welcome": true }` for personalized welcome messages (no quota cost)

Knowledge Score categories are computed client-side in `js/knowledge-score.js` and shown on the dashboard.

## Internationalization (i18n)

Run `migrations/20250711140000_ui_language.sql` to add `profiles.ui_language` (`en`, `it`, `es`).

- Locale files: `js/i18n/locales/{en,it,es}.json`
- Core: `js/i18n/i18n.js` + `js/i18n-init.js` on every page
- Users choose language at signup; change anytime in `settings.html`
- Dominar reads `profiles.ui_language` and responds in that language

**Brand names are never translated:** Treasora Academy, Dominar, Financial Passport.
