-- Phase 5 project-to-company relationships with project-specific roles.
create table public.project_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  role text not null check (role in ('owner','general_contractor','subcontractor','architect','engineer','consultant','supplier','manufacturer','commissioning_agent','testing_agency','other')),
  trade_scope text,
  contract_number text,
  vendor_number text,
  primary_contact_id uuid references public.contacts(id) on delete set null,
  status text not null default 'active' check (status in ('active','removed')),
  notes text,
  started_on date,
  ended_on date,
  added_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  check (ended_on is null or started_on is null or started_on<=ended_on),
  unique(project_id,company_id)
);
create index project_companies_project_status_idx on public.project_companies(project_id,status);
create index project_companies_company_status_idx on public.project_companies(company_id,status);
create index project_companies_project_role_idx on public.project_companies(project_id,role);
create trigger project_companies_set_updated_at before update on public.project_companies for each row execute function public.set_updated_at();

create or replace function public.enforce_project_company_organization()
returns trigger language plpgsql security invoker set search_path='' as $$
declare project_org uuid; company_org uuid; contact_org uuid;
begin
  select organization_id into project_org from public.projects where id=new.project_id;
  select organization_id into company_org from public.companies where id=new.company_id;
  if new.primary_contact_id is not null then select organization_id into contact_org from public.contacts where id=new.primary_contact_id; end if;
  if project_org is null or company_org is null or project_org<>company_org or new.organization_id<>project_org or (new.primary_contact_id is not null and contact_org<>project_org) then raise exception 'project company parents must belong to the same organization' using errcode='23514'; end if;
  return new;
end; $$;
create trigger project_companies_same_org before insert or update on public.project_companies for each row execute function public.enforce_project_company_organization();

alter table public.project_companies enable row level security;
alter table public.project_companies force row level security;
create policy project_companies_select_accessible on public.project_companies for select to authenticated using (public.can_access_project(project_id));
revoke all on public.project_companies from public,anon,authenticated;
grant select on public.project_companies to authenticated;
grant all on public.project_companies to service_role;

create or replace function public.assign_project_company(target_project_id uuid,target_company_id uuid,relationship_data jsonb,request_id text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); project public.projects; company public.companies; relationship_id uuid; target_role text:=relationship_data->>'role';
begin
  select * into project from public.projects where id=target_project_id;
  select * into company from public.companies where id=target_company_id;
  if project.id is null or project.status='archived' or company.id is null or company.status<>'active' or project.organization_id<>company.organization_id or not public.project_permission(project.id,'project.manage_companies') then raise exception 'invalid project company assignment' using errcode='42501'; end if;
  if target_role not in ('owner','general_contractor','subcontractor','architect','engineer','consultant','supplier','manufacturer','commissioning_agent','testing_agency','other') then raise exception 'invalid company role' using errcode='22023'; end if;
  insert into public.project_companies(organization_id,project_id,company_id,role,trade_scope,contract_number,vendor_number,primary_contact_id,notes,started_on,added_by)
  values(project.organization_id,project.id,company.id,target_role,nullif(trim(relationship_data->>'trade_scope'),''),nullif(trim(relationship_data->>'contract_number'),''),nullif(trim(relationship_data->>'vendor_number'),''),nullif(relationship_data->>'primary_contact_id','')::uuid,nullif(relationship_data->>'notes',''),nullif(relationship_data->>'started_on','')::date,actor_id)
  on conflict(project_id,company_id) do update set role=excluded.role,trade_scope=excluded.trade_scope,contract_number=excluded.contract_number,vendor_number=excluded.vendor_number,primary_contact_id=excluded.primary_contact_id,notes=excluded.notes,started_on=excluded.started_on,status='active',ended_on=null,removed_at=null,added_by=actor_id
  returning id into relationship_id;
  perform public.write_audit_event('internal_user','project_company','project.company_added',coalesce(request_id,gen_random_uuid()::text),'web',project.organization_id,actor_id,project.id,relationship_id,null,null,null,null,null,jsonb_build_object('company_id',company.id,'role',target_role));
  return relationship_id;
end; $$;

create or replace function public.update_project_company(target_project_company_id uuid,relationship_data jsonb,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.project_companies; target_role text; changed_fields text[];
begin
  select * into prior from public.project_companies where id=target_project_company_id for update;
  if not found or prior.status<>'active' or not public.project_permission(prior.project_id,'project.manage_companies') or exists(select 1 from public.projects where id=prior.project_id and status='archived') then raise exception 'permission denied' using errcode='42501'; end if;
  if relationship_data - array['role','trade_scope','contract_number','vendor_number','primary_contact_id','notes','started_on'] <> '{}'::jsonb then raise exception 'unsupported relationship field' using errcode='22023'; end if;
  target_role:=case when relationship_data?'role' then relationship_data->>'role' else prior.role end;
  if target_role not in ('owner','general_contractor','subcontractor','architect','engineer','consultant','supplier','manufacturer','commissioning_agent','testing_agency','other') then raise exception 'invalid company role' using errcode='22023'; end if;
  select coalesce(array_agg(key order by key),'{}') into changed_fields from jsonb_object_keys(relationship_data) key;
  update public.project_companies set role=target_role,trade_scope=case when relationship_data?'trade_scope' then nullif(trim(relationship_data->>'trade_scope'),'') else trade_scope end,contract_number=case when relationship_data?'contract_number' then nullif(trim(relationship_data->>'contract_number'),'') else contract_number end,vendor_number=case when relationship_data?'vendor_number' then nullif(trim(relationship_data->>'vendor_number'),'') else vendor_number end,primary_contact_id=case when relationship_data?'primary_contact_id' then nullif(relationship_data->>'primary_contact_id','')::uuid else primary_contact_id end,notes=case when relationship_data?'notes' then nullif(relationship_data->>'notes','') else notes end,started_on=case when relationship_data?'started_on' then nullif(relationship_data->>'started_on','')::date else started_on end where id=prior.id;
  perform public.write_audit_event('internal_user','project_company','project.company_role_changed',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,prior.project_id,prior.id,jsonb_build_object('role',prior.role),jsonb_build_object('role',target_role),null,null,null,jsonb_build_object('company_id',prior.company_id,'from_role',prior.role,'to_role',target_role,'changed_fields',to_jsonb(changed_fields)));
end; $$;

create or replace function public.remove_project_company(target_project_company_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.project_companies;
begin select * into prior from public.project_companies where id=target_project_company_id for update;
  if not found or not public.project_permission(prior.project_id,'project.manage_companies') or exists(select 1 from public.projects where id=prior.project_id and status='archived') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='removed' then return; end if;
  update public.project_companies set status='removed',removed_at=now(),ended_on=coalesce(ended_on,current_date) where id=prior.id;
  perform public.write_audit_event('internal_user','project_company','project.company_removed',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,prior.project_id,prior.id,null,null,null,null,null,jsonb_build_object('company_id',prior.company_id));
end; $$;

do $$ declare signature text; begin foreach signature in array array['public.assign_project_company(uuid,uuid,jsonb,text)','public.update_project_company(uuid,jsonb,text)','public.remove_project_company(uuid,text)'] loop execute 'revoke all on function '||signature||' from public, anon'; execute 'grant execute on function '||signature||' to authenticated'; end loop; end $$;
