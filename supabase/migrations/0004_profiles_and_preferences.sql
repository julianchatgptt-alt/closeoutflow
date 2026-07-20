-- Phase 4 user identity and persisted UI preferences.
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  first_name text,
  last_name text,
  preferred_name text,
  avatar_url text,
  phone text,
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deleted')),
  onboarding_status text not null default 'profile_pending'
    check (onboarding_status in ('profile_pending', 'org_pending', 'complete')),
  recovery_codes_hash text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  density text not null default 'comfortable'
    check (density in ('comfortable', 'compact')),
  timezone text,
  locale text not null default 'en-US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.ensure_profile()
returns public.user_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  profile public.user_profiles;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.user_profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select * into profile
  from public.user_profiles candidate
  where candidate.id = current_user_id;
  return profile;
end;
$$;

revoke all on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated, service_role;

alter table public.user_profiles enable row level security;
alter table public.user_profiles force row level security;
alter table public.user_preferences enable row level security;
alter table public.user_preferences force row level security;

create policy user_profiles_select_self
on public.user_profiles for select
to authenticated
using (id = auth.uid());

create policy user_profiles_update_self
on public.user_profiles for update
to authenticated
using (id = auth.uid() and account_status = 'active')
with check (id = auth.uid() and account_status = 'active');

create policy user_preferences_select_self
on public.user_preferences for select
to authenticated
using (user_id = auth.uid());

create policy user_preferences_update_self
on public.user_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on public.user_profiles, public.user_preferences from public, anon, authenticated;
grant select on public.user_profiles, public.user_preferences to authenticated;
grant update (
  display_name, first_name, last_name, preferred_name, avatar_url, phone
) on public.user_profiles to authenticated;
grant update (theme, density, timezone, locale)
on public.user_preferences to authenticated;
grant all on public.user_profiles, public.user_preferences to service_role;
