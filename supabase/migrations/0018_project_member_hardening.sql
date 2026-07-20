-- Phase 5 project-member ordering/hardening checkpoint.
-- project_members is intentionally created with projects in 0013 so create_project
-- can atomically create the project, creator assignment, and audit event.
do $$
begin
  if to_regclass('public.project_members') is null then
    raise exception 'project_members must exist before the Phase 5 relationship readers';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_members' and policyname='project_members_select_accessible'
  ) then
    raise exception 'project_members recursion-safe select policy is required';
  end if;
end $$;

comment on table public.project_members is
  'Internal authenticated project assignments. Separate from organization membership and external contacts.';
comment on column public.project_members.project_role is
  'Project responsibility and access role; never a replacement for the organization role.';
