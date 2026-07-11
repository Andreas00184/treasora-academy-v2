-- Treasora Academy — initial schema (Phase B)

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_pro boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Financial Passport
create table if not exists public.financial_passports (
  user_id uuid primary key references auth.users (id) on delete cascade,
  knowledge_level text not null,
  preferred_language text not null,
  learning_pace text not null,
  biggest_goal text not null,
  updated_at timestamptz not null default now()
);

-- Lesson progress (Foundation Program lessons 1–20)
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_number int not null check (lesson_number between 1 and 20),
  quiz_score int,
  quiz_total int,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_number)
);

create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id);

-- Dominar daily usage (free tier quota)
create table if not exists public.dominar_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (current_date),
  question_count int not null default 0,
  primary key (user_id, usage_date)
);

-- Dominar chat history
create table if not exists public.dominar_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists dominar_messages_user_idx on public.dominar_messages (user_id, created_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.financial_passports enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.dominar_daily_usage enable row level security;
alter table public.dominar_messages enable row level security;

-- Profiles: users read/update own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Financial passports
create policy "passport_select_own" on public.financial_passports for select using (auth.uid() = user_id);
create policy "passport_insert_own" on public.financial_passports for insert with check (auth.uid() = user_id);
create policy "passport_update_own" on public.financial_passports for update using (auth.uid() = user_id);

-- Lesson progress
create policy "lesson_progress_select_own" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "lesson_progress_insert_own" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "lesson_progress_update_own" on public.lesson_progress for update using (auth.uid() = user_id);

-- Dominar usage
create policy "dominar_usage_select_own" on public.dominar_daily_usage for select using (auth.uid() = user_id);
create policy "dominar_usage_insert_own" on public.dominar_daily_usage for insert with check (auth.uid() = user_id);
create policy "dominar_usage_update_own" on public.dominar_daily_usage for update using (auth.uid() = user_id);

-- Dominar messages
create policy "dominar_messages_select_own" on public.dominar_messages for select using (auth.uid() = user_id);
create policy "dominar_messages_insert_own" on public.dominar_messages for insert with check (auth.uid() = user_id);
