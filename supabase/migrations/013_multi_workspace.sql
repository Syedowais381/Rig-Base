-- Multi-organization: one user account, many workspace memberships

alter table public.profiles
  add column if not exists active_workspace_id uuid references public.workspaces(id) on delete set null;

create unique index if not exists employees_workspace_user_idx
  on public.employees (workspace_id, user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- List all workspaces a user can access (owned + employee memberships)
-- ---------------------------------------------------------------------------

create or replace function public.list_user_workspaces()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_id uuid;
  result json;
begin
  if v_user_id is null then
    return '[]'::json;
  end if;

  select active_workspace_id into v_active_id
  from public.profiles
  where id = v_user_id;

  select coalesce(json_agg(row order by sort_key), '[]'::json)
  into result
  from (
    select
      w.id as workspace_id,
      w.business_type,
      coalesce(p.business_name, w.business_type) as business_name,
      'owner'::text as membership_type,
      'Owner'::text as role_name,
      null::uuid as employee_id,
      (w.id = v_active_id) as is_active,
      0 as sort_key
    from public.workspaces w
    join public.profiles p on p.id = w.user_id
    where w.user_id = v_user_id

    union all

    select
      w.id as workspace_id,
      w.business_type,
      coalesce(op.business_name, w.business_type) as business_name,
      'employee'::text as membership_type,
      coalesce(r.name, 'Staff') as role_name,
      e.id as employee_id,
      (w.id = v_active_id) as is_active,
      1 as sort_key
    from public.employees e
    join public.workspaces w on w.id = e.workspace_id
    join public.profiles op on op.id = w.user_id
    left join public.roles r on r.id = e.role_id
    where e.user_id = v_user_id
      and e.status in ('active', 'on_leave')
  ) row;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Switch active workspace (validates membership)
-- ---------------------------------------------------------------------------

create or replace function public.set_active_workspace(p_workspace_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'You do not have access to this workspace';
  end if;

  update public.profiles
  set active_workspace_id = p_workspace_id
  where id = v_user_id;

  return json_build_object('workspace_id', p_workspace_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Accept invite: allow multi-org (remove single-workspace block)
-- ---------------------------------------------------------------------------

create or replace function public.accept_employee_invite(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_employee public.employees%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from public.profiles where id = v_user_id;

  select * into v_employee
  from public.employees
  where invite_token = p_token
    and status = 'invited'
    and lower(email) = lower(v_email)
  for update;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  -- Already a member of this specific workspace
  if public.is_workspace_owner(v_employee.workspace_id) then
    raise exception 'You already own this organization';
  end if;

  if exists (
    select 1 from public.employees
    where workspace_id = v_employee.workspace_id
      and user_id = v_user_id
      and status in ('active', 'on_leave')
      and id <> v_employee.id
  ) then
    raise exception 'You are already a member of this organization';
  end if;

  update public.employees
  set
    user_id = v_user_id,
    status = 'active',
    accepted_at = now(),
    invite_token = null,
    invited_at = coalesce(invited_at, now())
  where id = v_employee.id;

  update public.profiles
  set
    onboarding_completed = true,
    active_workspace_id = v_employee.workspace_id
  where id = v_user_id;

  return json_build_object(
    'workspace_id', v_employee.workspace_id,
    'employee_id', v_employee.id
  );
end;
$$;

grant execute on function public.list_user_workspaces() to authenticated;
grant execute on function public.set_active_workspace(uuid) to authenticated;
