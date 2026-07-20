-- Phase 4 identity extensions and base helpers.
create extension if not exists citext with schema extensions;

create or replace function public.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid();
$$;

revoke all on function public.current_user_id() from public, anon;
grant execute on function public.current_user_id() to authenticated, service_role;

create or replace function public.slugify(value text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'),
    '-+', '-', 'g'
  ));
$$;

revoke all on function public.slugify(text) from public, anon;
grant execute on function public.slugify(text) to authenticated, service_role;
