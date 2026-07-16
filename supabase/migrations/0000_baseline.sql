-- Phase 2 infrastructure baseline. No tenant or business tables belong here.
create extension if not exists pgcrypto with schema extensions;

create schema if not exists audit;
revoke all on schema audit from public, anon, authenticated;
grant usage on schema audit to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Infrastructure trigger helper. Attach to future mutable tables; never to append-only audit records.';
