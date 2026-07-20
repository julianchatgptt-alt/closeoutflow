-- Phase 5 reusable company directory.
create or replace function public.normalize_website_domain(value text)
returns text language sql immutable set search_path = '' as $$
  select nullif(regexp_replace(lower(trim(coalesce(value,''))), '^(https?://)?(www\.)?|/.*$', '', 'g'), '');
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 160),
  legal_name text,
  dba text,
  website text,
  website_domain text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text not null default 'US' check (country ~ '^[A-Z]{2}$'),
  classifications text[] not null default '{}',
  trade text,
  license_number text,
  vendor_number text,
  status text not null default 'active' check (status in ('active','archived')),
  notes text,
  tags text[] not null default '{}',
  normalized_name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index companies_org_status_idx on public.companies (organization_id,status);
create index companies_name_trgm_idx on public.companies using gin (normalized_name extensions.gin_trgm_ops);
create index companies_domain_idx on public.companies (organization_id,website_domain) where website_domain is not null;
create index companies_classifications_idx on public.companies using gin (classifications);
create index companies_tags_idx on public.companies using gin (tags);
create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.companies force row level security;
create policy companies_select_member on public.companies for select to authenticated
using (public.has_org_permission(organization_id,'company.view'));
revoke all on public.companies from public,anon,authenticated;
grant select on public.companies to authenticated;
grant all on public.companies to service_role;

create or replace function public.create_company(target_organization_id uuid,company_data jsonb,request_id text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); company_id uuid; display_name text:=trim(company_data->>'display_name');
begin
  if actor_id is null or not public.has_org_permission(target_organization_id,'company.create') then raise exception 'permission denied' using errcode='42501'; end if;
  if char_length(coalesce(display_name,'')) not between 2 and 160 then raise exception 'company name must be between 2 and 160 characters' using errcode='22023'; end if;
  if company_data - array['display_name','legal_name','dba','website','email','phone','address_line1','address_line2','city','region','postal_code','country','classifications','trade','license_number','vendor_number','notes','tags'] <> '{}'::jsonb then raise exception 'unsupported company field' using errcode='22023'; end if;
  insert into public.companies(
    organization_id,display_name,legal_name,dba,website,website_domain,email,phone,address_line1,address_line2,city,region,postal_code,country,classifications,trade,license_number,vendor_number,notes,tags,normalized_name,created_by
  ) values(
    target_organization_id,display_name,nullif(trim(company_data->>'legal_name'),''),nullif(trim(company_data->>'dba'),''),nullif(trim(company_data->>'website'),''),public.normalize_website_domain(company_data->>'website'),nullif(trim(company_data->>'email'),''),nullif(trim(company_data->>'phone'),''),nullif(trim(company_data->>'address_line1'),''),nullif(trim(company_data->>'address_line2'),''),nullif(trim(company_data->>'city'),''),nullif(trim(company_data->>'region'),''),nullif(trim(company_data->>'postal_code'),''),coalesce(nullif(upper(company_data->>'country'),''),'US'),coalesce(array(select jsonb_array_elements_text(company_data->'classifications')),'{}'),nullif(trim(company_data->>'trade'),''),nullif(trim(company_data->>'license_number'),''),nullif(trim(company_data->>'vendor_number'),''),nullif(company_data->>'notes',''),coalesce(array(select jsonb_array_elements_text(company_data->'tags')),'{}'),public.normalize_directory_text(display_name),actor_id
  ) returning id into company_id;
  perform public.write_audit_event('internal_user','company','company.created',coalesce(request_id,gen_random_uuid()::text),'web',target_organization_id,actor_id,null,company_id,null,null,null,null,null,jsonb_build_object('display_name',display_name));
  return company_id;
end; $$;

create or replace function public.update_company(target_company_id uuid,expected_updated_at timestamptz,company_data jsonb,request_id text default null)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); prior public.companies; next_updated_at timestamptz; changed_fields text[];
begin
  select * into prior from public.companies where id=target_company_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'company.update') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='archived' then raise exception 'archived companies are read only' using errcode='22023'; end if;
  if prior.updated_at<>expected_updated_at then raise exception 'company was updated by another user' using errcode='40001'; end if;
  if company_data - array['display_name','legal_name','dba','website','email','phone','address_line1','address_line2','city','region','postal_code','country','classifications','trade','license_number','vendor_number','notes','tags'] <> '{}'::jsonb then raise exception 'unsupported company field' using errcode='22023'; end if;
  if company_data ? 'display_name' and char_length(trim(coalesce(company_data->>'display_name',''))) not between 2 and 160 then raise exception 'company name must be between 2 and 160 characters' using errcode='22023'; end if;
  select coalesce(array_agg(key order by key),'{}') into changed_fields from jsonb_object_keys(company_data) key;
  update public.companies set
    display_name=case when company_data?'display_name' then trim(company_data->>'display_name') else display_name end,
    normalized_name=case when company_data?'display_name' then public.normalize_directory_text(company_data->>'display_name') else normalized_name end,
    legal_name=case when company_data?'legal_name' then nullif(trim(company_data->>'legal_name'),'') else legal_name end,
    dba=case when company_data?'dba' then nullif(trim(company_data->>'dba'),'') else dba end,
    website=case when company_data?'website' then nullif(trim(company_data->>'website'),'') else website end,
    website_domain=case when company_data?'website' then public.normalize_website_domain(company_data->>'website') else website_domain end,
    email=case when company_data?'email' then nullif(trim(company_data->>'email'),'') else email end,
    phone=case when company_data?'phone' then nullif(trim(company_data->>'phone'),'') else phone end,
    address_line1=case when company_data?'address_line1' then nullif(trim(company_data->>'address_line1'),'') else address_line1 end,
    address_line2=case when company_data?'address_line2' then nullif(trim(company_data->>'address_line2'),'') else address_line2 end,
    city=case when company_data?'city' then nullif(trim(company_data->>'city'),'') else city end,
    region=case when company_data?'region' then nullif(trim(company_data->>'region'),'') else region end,
    postal_code=case when company_data?'postal_code' then nullif(trim(company_data->>'postal_code'),'') else postal_code end,
    country=case when company_data?'country' then upper(company_data->>'country') else country end,
    classifications=case when company_data?'classifications' then array(select jsonb_array_elements_text(company_data->'classifications')) else classifications end,
    trade=case when company_data?'trade' then nullif(trim(company_data->>'trade'),'') else trade end,
    license_number=case when company_data?'license_number' then nullif(trim(company_data->>'license_number'),'') else license_number end,
    vendor_number=case when company_data?'vendor_number' then nullif(trim(company_data->>'vendor_number'),'') else vendor_number end,
    notes=case when company_data?'notes' then nullif(company_data->>'notes','') else notes end,
    tags=case when company_data?'tags' then array(select jsonb_array_elements_text(company_data->'tags')) else tags end
  where id=target_company_id returning updated_at into next_updated_at;
  perform public.write_audit_event('internal_user','company','company.updated',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.id,null,null,null,null,null,jsonb_build_object('changed_fields',to_jsonb(changed_fields)));
  return next_updated_at;
end; $$;

create or replace function public.archive_company(target_company_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); prior public.companies;
begin select * into prior from public.companies where id=target_company_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'company.archive') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='archived' then return; end if;
  update public.companies set status='archived',archived_at=now() where id=prior.id;
  perform public.write_audit_event('internal_user','company','company.archived',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.id);
end; $$;

create or replace function public.restore_company(target_company_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); prior public.companies;
begin select * into prior from public.companies where id=target_company_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'company.archive') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='active' then return; end if;
  update public.companies set status='active',archived_at=null where id=prior.id;
  perform public.write_audit_event('internal_user','company','company.restored',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.id);
end; $$;

do $$ declare signature text; begin foreach signature in array array[
  'public.create_company(uuid,jsonb,text)','public.update_company(uuid,timestamptz,jsonb,text)','public.archive_company(uuid,text)','public.restore_company(uuid,text)'
] loop execute 'revoke all on function '||signature||' from public, anon'; execute 'grant execute on function '||signature||' to authenticated'; end loop; end $$;
