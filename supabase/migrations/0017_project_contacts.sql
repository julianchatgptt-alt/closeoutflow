-- Phase 5 project external-contact relationships.
create table public.project_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  project_company_id uuid references public.project_companies(id) on delete set null,
  project_title text,
  is_primary_contact boolean not null default false,
  is_closeout_contact boolean not null default false,
  is_document_recipient boolean not null default false,
  is_review_contact boolean not null default false,
  status text not null default 'active' check(status in ('active','removed')),
  notes text,
  started_on date,
  ended_on date,
  added_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  check(ended_on is null or started_on is null or started_on<=ended_on),
  unique(project_id,contact_id)
);
create index project_contacts_project_status_idx on public.project_contacts(project_id,status);
create index project_contacts_contact_status_idx on public.project_contacts(contact_id,status);
create trigger project_contacts_set_updated_at before update on public.project_contacts for each row execute function public.set_updated_at();

create or replace function public.enforce_project_contact_consistency()
returns trigger language plpgsql security invoker set search_path='' as $$
declare project_org uuid; contact_org uuid; related_project uuid; related_company uuid;
begin
  select organization_id into project_org from public.projects where id=new.project_id;
  select organization_id into contact_org from public.contacts where id=new.contact_id;
  if project_org is null or contact_org is null or project_org<>contact_org or new.organization_id<>project_org then raise exception 'project and contact must belong to the same organization' using errcode='23514'; end if;
  if new.project_company_id is not null then
    select project_id,company_id into related_project,related_company from public.project_companies where id=new.project_company_id and status='active';
    if related_project is null or related_project<>new.project_id or not exists(select 1 from public.company_contacts where company_id=related_company and contact_id=new.contact_id and status='active') then raise exception 'contact must have an active affiliation with the selected project company' using errcode='23514'; end if;
  end if;
  return new;
end; $$;
create trigger project_contacts_consistency before insert or update on public.project_contacts for each row execute function public.enforce_project_contact_consistency();

alter table public.project_contacts enable row level security;
alter table public.project_contacts force row level security;
create policy project_contacts_select_accessible on public.project_contacts for select to authenticated using(public.can_access_project(project_id));
revoke all on public.project_contacts from public,anon,authenticated;
grant select on public.project_contacts to authenticated;
grant all on public.project_contacts to service_role;

create or replace function public.assign_project_contact(target_project_id uuid,target_contact_id uuid,relationship_data jsonb default '{}'::jsonb,request_id text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); project public.projects; contact public.contacts; relationship_id uuid;
begin
  select * into project from public.projects where id=target_project_id;
  select * into contact from public.contacts where id=target_contact_id;
  if project.id is null or project.status='archived' or contact.id is null or contact.status<>'active' or project.organization_id<>contact.organization_id or not public.project_permission(project.id,'project.manage_contacts') then raise exception 'invalid project contact assignment' using errcode='42501'; end if;
  insert into public.project_contacts(organization_id,project_id,contact_id,project_company_id,project_title,is_primary_contact,is_closeout_contact,is_document_recipient,is_review_contact,notes,started_on,added_by)
  values(project.organization_id,project.id,contact.id,nullif(relationship_data->>'project_company_id','')::uuid,nullif(trim(relationship_data->>'project_title'),''),coalesce((relationship_data->>'is_primary_contact')::boolean,false),coalesce((relationship_data->>'is_closeout_contact')::boolean,false),coalesce((relationship_data->>'is_document_recipient')::boolean,false),coalesce((relationship_data->>'is_review_contact')::boolean,false),nullif(relationship_data->>'notes',''),nullif(relationship_data->>'started_on','')::date,actor_id)
  on conflict(project_id,contact_id) do update set project_company_id=excluded.project_company_id,project_title=excluded.project_title,is_primary_contact=excluded.is_primary_contact,is_closeout_contact=excluded.is_closeout_contact,is_document_recipient=excluded.is_document_recipient,is_review_contact=excluded.is_review_contact,notes=excluded.notes,started_on=excluded.started_on,status='active',ended_on=null,removed_at=null,added_by=actor_id
  returning id into relationship_id;
  perform public.write_audit_event('internal_user','project_contact','project.contact_added',coalesce(request_id,gen_random_uuid()::text),'web',project.organization_id,actor_id,project.id,relationship_id,null,null,null,null,null,jsonb_strip_nulls(jsonb_build_object('contact_id',contact.id,'project_title',nullif(trim(relationship_data->>'project_title'),''))));
  return relationship_id;
end; $$;

create or replace function public.update_project_contact(target_project_contact_id uuid,relationship_data jsonb,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.project_contacts; changed_fields text[];
begin
  select * into prior from public.project_contacts where id=target_project_contact_id for update;
  if not found or prior.status<>'active' or not public.project_permission(prior.project_id,'project.manage_contacts') or exists(select 1 from public.projects where id=prior.project_id and status='archived') then raise exception 'permission denied' using errcode='42501'; end if;
  if relationship_data - array['project_company_id','project_title','is_primary_contact','is_closeout_contact','is_document_recipient','is_review_contact','notes','started_on'] <> '{}'::jsonb then raise exception 'unsupported relationship field' using errcode='22023'; end if;
  select coalesce(array_agg(key order by key),'{}') into changed_fields from jsonb_object_keys(relationship_data) key;
  update public.project_contacts set project_company_id=case when relationship_data?'project_company_id' then nullif(relationship_data->>'project_company_id','')::uuid else project_company_id end,project_title=case when relationship_data?'project_title' then nullif(trim(relationship_data->>'project_title'),'') else project_title end,is_primary_contact=case when relationship_data?'is_primary_contact' then (relationship_data->>'is_primary_contact')::boolean else is_primary_contact end,is_closeout_contact=case when relationship_data?'is_closeout_contact' then (relationship_data->>'is_closeout_contact')::boolean else is_closeout_contact end,is_document_recipient=case when relationship_data?'is_document_recipient' then (relationship_data->>'is_document_recipient')::boolean else is_document_recipient end,is_review_contact=case when relationship_data?'is_review_contact' then (relationship_data->>'is_review_contact')::boolean else is_review_contact end,notes=case when relationship_data?'notes' then nullif(relationship_data->>'notes','') else notes end,started_on=case when relationship_data?'started_on' then nullif(relationship_data->>'started_on','')::date else started_on end where id=prior.id;
  perform public.write_audit_event('internal_user','project_contact','project.contact_responsibility_changed',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,prior.project_id,prior.id,null,null,null,null,null,jsonb_build_object('contact_id',prior.contact_id,'changed_fields',to_jsonb(changed_fields)));
end; $$;

create or replace function public.remove_project_contact(target_project_contact_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=auth.uid(); prior public.project_contacts;
begin select * into prior from public.project_contacts where id=target_project_contact_id for update;
  if not found or not public.project_permission(prior.project_id,'project.manage_contacts') or exists(select 1 from public.projects where id=prior.project_id and status='archived') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='removed' then return; end if;
  update public.project_contacts set status='removed',removed_at=now(),ended_on=coalesce(ended_on,current_date) where id=prior.id;
  perform public.write_audit_event('internal_user','project_contact','project.contact_removed',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,prior.project_id,prior.id,null,null,null,null,null,jsonb_build_object('contact_id',prior.contact_id));
end; $$;

do $$ declare signature text; begin foreach signature in array array['public.assign_project_contact(uuid,uuid,jsonb,text)','public.update_project_contact(uuid,jsonb,text)','public.remove_project_contact(uuid,text)'] loop execute 'revoke all on function '||signature||' from public, anon'; execute 'grant execute on function '||signature||' to authenticated'; end loop; end $$;
