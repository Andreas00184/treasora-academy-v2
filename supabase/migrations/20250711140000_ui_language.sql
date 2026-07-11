-- UI language preference (i18n)

alter table public.profiles
  add column if not exists ui_language text not null default 'en'
    check (ui_language in ('en', 'it', 'es'));

comment on column public.profiles.ui_language is 'Interface language: en, it, es';

-- Set ui_language from signup metadata when profile is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lang text := coalesce(new.raw_user_meta_data->>'ui_language', 'en');
begin
  if lang not in ('en', 'it', 'es') then
    lang := 'en';
  end if;

  insert into public.profiles (id, full_name, ui_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    lang
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
