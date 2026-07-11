-- Stripe subscription management

alter table public.profiles
  add column if not exists subscription_status text,
  add column if not exists current_plan text not null default 'free'
    check (current_plan in ('free', 'pro')),
  add column if not exists renewal_date timestamptz;

comment on column public.profiles.subscription_status is 'Stripe subscription status: active, trialing, canceled, past_due, etc.';
comment on column public.profiles.current_plan is 'Treasora plan tier: free or pro';
comment on column public.profiles.renewal_date is 'Current billing period end (from Stripe)';

-- Backfill current_plan from is_pro for existing rows
update public.profiles
set current_plan = case when is_pro then 'pro' else 'free' end
where current_plan is distinct from case when is_pro then 'pro' else 'free' end;

-- Billing history (populated by Stripe webhooks)
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  amount_cents int not null default 0,
  currency text not null default 'usd',
  status text not null,
  description text,
  invoice_pdf_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists billing_history_user_idx on public.billing_history (user_id, created_at desc);

alter table public.billing_history enable row level security;

create policy "billing_history_select_own" on public.billing_history
  for select using (auth.uid() = user_id);

-- Users cannot insert/update billing rows — webhooks use service role
