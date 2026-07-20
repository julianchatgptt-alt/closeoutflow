-- Phase 5 external contact directory and history-preserving company affiliations.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text not null check (char_length(trim(last_name)) between 1 and 80),
  preferred_name text,
  email extensions.citext,
  normalized_email extensions.citext,
  phone text,
  mobile_phone text,
  job_title text,
  department text,
  timezone text,
  locale text,
  status text not null default 'active' check (status in ('active','archived')),
  notes text,
  linked_user_id uuid,
  portal_status text not null default 'none' check (portal_status='none'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (linked_user_id is null)
);

create table public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  job_title text,
  department text,
  is_primary_contact boolean not null default false,
  preferred_email extensions.citext,
  preferred_phone text,
  status text not null default 'active' check (status in ('active','ended')),
  started_on date,
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_on is null or started_on is null or started_on <= ended_on),
  unique (company_id,contact_id)
);

create unique index company_contacts_primary_unique on public.company_contacts(company_id)
where is_primary_contact and status='active';
create index contacts_org_status_idx on public.contacts(organization_id,status);
create index contacts_name_trgm_idx on public.contacts using gin ((lower(first_name||' '||last_name)) extensions.gin_trgm_ops);
create index contacts_email_idx on public.contacts(organization_id,normalized_email) where normalized_email is not null;
create index company_contacts_company_status_idx on public.company_contacts(company_id,status);
create index company_contacts_contact_status_idx on public.company_contacts(contact_id,status);
create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger company_contacts_set_updated_at before update on public.company_contacts for each row execute function public.set_updated_at();

create or replace function public.enforce_company_contact_organization()
returns trigger language plpgsql security invoker set search_path='' as $$
declare company_org uuid; contact_org uuid;
begin
  select organization_id into company_org from public.companies where id=new.company_id;
  select organization_id into contact_org from public.contacts where id=new.contact_id;
  if company_org is null or contact_org is null or company_org<>contact_org or new.organization_id<>company_org then
    raise exception 'company and contact must belong to the same organization' using errcode='23514';
  end if;
  return new;
end; $$;
create trigger company_contacts_same_org before insert or update on public.company_contacts
for each row execute function public.enforce_company_contact_organization();

alter table public.contacts enable row level security;
alter table public.contacts force row level security;
alter table public.company_contacts enable row level security;
alter table public.company_contacts force row level security;
create policy contacts_select_member on public.contacts for select to authenticated using (public.has_org_permission(organization_id,'contact.view'));
create policy company_contacts_select_member on public.company_contacts for select to authenticated using (public.is_org_member(organization_id));
revoke all on public.contacts,public.company_contacts from public,anon,authenticated;
grant select on public.contacts,public.company_contacts to authenticated;
grant all on public.contacts,public.company_contacts to service_role;

create or replace function public.create_contact(target_organization_id uuid,contact_data jsonb,request_id text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); contact_id uuid; first_name text:=trim(contact_data->>'first_name'); last_name text:=trim(contact_data->>'last_name');
begin
  if actor_id is null or not public.has_org_permission(target_organization_id,'contact.create') then raise exception 'permission denied' using errcode='42501'; end if;
  if char_length(coalesce(first_name,''))<1 or char_length(coalesce(last_name,''))<1 then raise exception 'first and last name are required' using errcode='22023'; end if;
  if contact_data - array['first_name','last_name','preferred_name','email','phone','mobile_phone','job_title','department','timezone','locale','notes'] <> '{}'::jsonb then raise exception 'unsupported contact field' using errcode='22023'; end if;
  insert into public.contacts(organization_id,first_name,last_name,preferred_name,email,normalized_email,phone,mobile_phone,job_title,department,timezone,locale,notes,created_by)
  values(target_organization_id,first_name,last_name,nullif(trim(contact_data->>'preferred_name'),''),nullif(trim(contact_data->>'email'),'')::extensions.citext,nullif(lower(trim(contact_data->>'email')),'')::extensions.citext,nullif(trim(contact_data->>'phone'),''),nullif(trim(contact_data->>'mobile_phone'),''),nullif(trim(contact_data->>'job_title'),''),nullif(trim(contact_data->>'department'),''),nullif(trim(contact_data->>'timezone'),''),nullif(trim(contact_data->>'locale'),''),nullif(contact_data->>'notes',''),actor_id)
  returning id into contact_id;
  perform public.write_audit_event('internal_user','contact','contact.created',coalesce(request_id,gen_random_uuid()::text),'web',target_organization_id,actor_id,null,contact_id,null,null,null,null,null,jsonb_build_object('contact_name',first_name||' '||last_name));
  return contact_id;
end; $$;

create or replace function public.update_contact(target_contact_id uuid,expected_updated_at timestamptz,contact_data jsonb,request_id text default null)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.contacts; next_updated_at timestamptz; changed_fields text[];
begin
  select * into prior from public.contacts where id=target_contact_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'contact.update') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='archived' then raise exception 'archived contacts are read only' using errcode='22023'; end if;
  if prior.updated_at<>expected_updated_at then raise exception 'contact was updated by another user' using errcode='40001'; end if;
  if contact_data - array['first_name','last_name','preferred_name','email','phone','mobile_phone','job_title','department','timezone','locale','notes'] <> '{}'::jsonb then raise exception 'unsupported contact field' using errcode='22023'; end if;
  if contact_data?'first_name' and char_length(trim(coalesce(contact_data->>'first_name','')))<1 then raise exception 'first name is required' using errcode='22023'; end if;
  if contact_data?'last_name' and char_length(trim(coalesce(contact_data->>'last_name','')))<1 then raise exception 'last name is required' using errcode='22023'; end if;
  select coalesce(array_agg(key order by key),'{}') into changed_fields from jsonb_object_keys(contact_data) key;
  update public.contacts set
    first_name=case when contact_data?'first_name' then trim(contact_data->>'first_name') else first_name end,
    last_name=case when contact_data?'last_name' then trim(contact_data->>'last_name') else last_name end,
    preferred_name=case when contact_data?'preferred_name' then nullif(trim(contact_data->>'preferred_name'),'') else preferred_name end,
    email=case when contact_data?'email' then nullif(trim(contact_data->>'email'),'')::extensions.citext else email end,
    normalized_email=case when contact_data?'email' then nullif(lower(trim(contact_data->>'email')),'')::extensions.citext else normalized_email end,
    phone=case when contact_data?'phone' then nullif(trim(contact_data->>'phone'),'') else phone end,
    mobile_phone=case when contact_data?'mobile_phone' then nullif(trim(contact_data->>'mobile_phone'),'') else mobile_phone end,
    job_title=case when contact_data?'job_title' then nullif(trim(contact_data->>'job_title'),'') else job_title end,
    department=case when contact_data?'department' then nullif(trim(contact_data->>'department'),'') else department end,
    timezone=case when contact_data?'timezone' then nullif(trim(contact_data->>'timezone'),'') else timezone end,
    locale=case when contact_data?'locale' then nullif(trim(contact_data->>'locale'),'') else locale end,
    notes=case when contact_data?'notes' then nullif(contact_data->>'notes','') else notes end
  where id=prior.id returning updated_at into next_updated_at;
  perform public.write_audit_event('internal_user','contact','contact.updated',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.id,null,null,null,null,null,jsonb_build_object('changed_fields',to_jsonb(changed_fields)));
  return next_updated_at;
end; $$;

create or replace function public.archive_contact(target_contact_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.contacts;
begin select * into prior from public.contacts where id=target_contact_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'contact.archive') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='archived' then return; end if;
  update public.contacts set status='archived',archived_at=now() where id=prior.id;
  perform public.write_audit_event('internal_user','contact','contact.archived',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.id);
end; $$;

create or replace function public.restore_contact(target_contact_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.contacts;
begin select * into prior from public.contacts where id=target_contact_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'contact.archive') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='active' then return; end if;
  update public.contacts set status='active',archived_at=null where id=prior.id;
  perform public.write_audit_event('internal_user','contact','contact.restored',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.id);
end; $$;

create or replace function public.link_company_contact(target_company_id uuid,target_contact_id uuid,affiliation_data jsonb default '{}'::jsonb,request_id text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); company public.companies; contact public.contacts; affiliation_id uuid;
begin
  select * into company from public.companies where id=target_company_id;
  select * into contact from public.contacts where id=target_contact_id;
  if company.id is null or contact.id is null or company.organization_id<>contact.organization_id or company.status<>'active' or contact.status<>'active' or not public.has_org_permission(company.organization_id,'contact.update') then raise exception 'invalid affiliation' using errcode='42501'; end if;
  insert into public.company_contacts(organization_id,company_id,contact_id,job_title,department,is_primary_contact,preferred_email,preferred_phone,started_on)
  values(company.organization_id,company.id,contact.id,nullif(trim(affiliation_data->>'job_title'),''),nullif(trim(affiliation_data->>'department'),''),coalesce((affiliation_data->>'is_primary_contact')::boolean,false),nullif(trim(affiliation_data->>'preferred_email'),'')::extensions.citext,nullif(trim(affiliation_data->>'preferred_phone'),''),nullif(affiliation_data->>'started_on','')::date)
  on conflict(company_id,contact_id) do update set status='active',ended_on=null,job_title=excluded.job_title,department=excluded.department,is_primary_contact=excluded.is_primary_contact,preferred_email=excluded.preferred_email,preferred_phone=excluded.preferred_phone,started_on=excluded.started_on
  returning id into affiliation_id;
  perform public.write_audit_event('internal_user','company','company.updated',coalesce(request_id,gen_random_uuid()::text),'web',company.organization_id,actor_id,null,company.id,null,null,null,null,null,jsonb_build_object('affiliation_change','linked','contact_id',contact.id));
  return affiliation_id;
end; $$;

create or replace function public.end_company_contact(target_company_contact_id uuid,p_ended_on date default current_date,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.company_contacts;
begin select * into prior from public.company_contacts where id=target_company_contact_id for update;
  if not found or not public.has_org_permission(prior.organization_id,'contact.update') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='ended' then return; end if;
  update public.company_contacts set status='ended',ended_on=coalesce(p_ended_on,current_date),is_primary_contact=false where id=prior.id;
  perform public.write_audit_event('internal_user','company','company.updated',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,null,prior.company_id,null,null,null,null,null,jsonb_build_object('affiliation_change','ended','contact_id',prior.contact_id));
end; $$;

do $$ declare signature text; begin foreach signature in array array[
  'public.create_contact(uuid,jsonb,text)','public.update_contact(uuid,timestamptz,jsonb,text)','public.archive_contact(uuid,text)','public.restore_contact(uuid,text)','public.link_company_contact(uuid,uuid,jsonb,text)','public.end_company_contact(uuid,date,text)'
] loop execute 'revoke all on function '||signature||' from public, anon'; execute 'grant execute on function '||signature||' to authenticated'; end loop; end $$;
