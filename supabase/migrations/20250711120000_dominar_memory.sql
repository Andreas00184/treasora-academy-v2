-- Phase C: Dominar long-term memory fields

alter table public.financial_passports
  add column if not exists country text,
  add column if not exists portfolio_interests text,
  add column if not exists favorite_investments text,
  add column if not exists last_topic_discussed text;

comment on column public.financial_passports.country is 'User country for localized context';
comment on column public.financial_passports.portfolio_interests is 'Topics user cares about (ETFs, dividends, etc.)';
comment on column public.financial_passports.favorite_investments is 'User-stated favorite investments or tickers';
comment on column public.financial_passports.last_topic_discussed is 'Last topic from Dominar chat (updated server-side)';
