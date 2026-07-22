-- Return optimistic-concurrency conflicts through PostgREST without invoking
-- the transaction layer's automatic serialization-failure retry behavior.
do $migration$
declare
  target_function regprocedure;
  definition text;
begin
  foreach target_function in array array[
    'public.update_project(uuid,timestamptz,jsonb,text)'::regprocedure,
    'public.update_company(uuid,timestamptz,jsonb,text)'::regprocedure,
    'public.update_contact(uuid,timestamptz,jsonb,text)'::regprocedure
  ] loop
    select pg_get_functiondef(target_function) into definition;
    if definition not like '%''40001''%' then
      raise exception 'expected stale-conflict SQLSTATE is missing from %', target_function;
    end if;
    execute replace(definition, '''40001''', '''P0001''');
  end loop;
end;
$migration$;

comment on function public.update_project(uuid,timestamptz,jsonb,text) is
  'Updates an authorized project with optimistic concurrency; stale tokens raise P0001 for prompt PostgREST delivery.';
comment on function public.update_company(uuid,timestamptz,jsonb,text) is
  'Updates an authorized company with optimistic concurrency; stale tokens raise P0001 for prompt PostgREST delivery.';
comment on function public.update_contact(uuid,timestamptz,jsonb,text) is
  'Updates an authorized contact with optimistic concurrency; stale tokens raise P0001 for prompt PostgREST delivery.';
