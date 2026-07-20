-- Phase 4 tenant boundary.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  legal_name text,
  slug text not null unique check (slug = public.slugify(slug) and length(slug) > 0),
  logo_url text,
  primary_domain text,
  timezone text not null default 'America/New_York',
  default_locale text not null default 'en-US',
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived', 'pending_deletion')),
  requires_mfa boolean not null default false,
  onboarding_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  suspended_at timestamptz,
  deletion_requested_at timestamptz
);

create index organizations_status_idx on public.organizations(status);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organizations force row level security;

revoke all on public.organizations from public, anon, authenticated;
grant select on public.organizations to authenticated;
grant all on public.organizations to service_role;
