-- Employee membership: invites, workspace access for linked employees, RLS helpers

-- Invite fields on employees
alter table public.employees
  add column if not exists invite_token uuid default gen_random_uuid(),
  add column if not exists invited_at timestamptz,
  add column if not exists accepted_at timestamptz;

create unique index if not exists employees_invite_token_idx
  on public.employees (invite_token)
  where invite_token is not null;

create unique index if not exists employees_workspace_email_idx
  on public.employees (workspace_id, lower(email));

-- Extend status to include invited (pending login)
alter table public.employees drop constraint if exists employees_status_check;
alter table public.employees add constraint employees_status_check
  check (status in ('active', 'inactive', 'on_leave', 'invited'));

-- ---------------------------------------------------------------------------
-- Access helpers (security definer — used by RLS policies)
-- ---------------------------------------------------------------------------

create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_workspace_owner(ws_id)
  or exists (
    select 1 from public.employees
    where workspace_id = ws_id
      and user_id = auth.uid()
      and status in ('active', 'on_leave')
  );
$$;

-- ---------------------------------------------------------------------------
-- Invite RPCs
-- ---------------------------------------------------------------------------

create or replace function public.get_invite_by_token(p_token uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_employee public.employees%rowtype;
  v_workspace public.workspaces%rowtype;
  v_role_name text;
  v_business_name text;
begin
  select * into v_employee
  from public.employees
  where invite_token = p_token
    and status = 'invited';

  if not found then
    return null;
  end if;

  select * into v_workspace from public.workspaces where id = v_employee.workspace_id;

  select name into v_role_name from public.roles where id = v_employee.role_id;

  select business_name into v_business_name
  from public.profiles
  where id = v_workspace.user_id;

  return json_build_object(
    'employee_name', v_employee.full_name,
    'email', v_employee.email,
    'business_name', coalesce(v_business_name, v_workspace.business_type),
    'business_type', v_workspace.business_type,
    'role_name', coalesce(v_role_name, 'Staff')
  );
end;
$$;

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

  if exists (
    select 1 from public.employees
    where user_id = v_user_id
      and id <> v_employee.id
      and status in ('active', 'on_leave')
  ) then
    raise exception 'Already linked to a workspace';
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
  set onboarding_completed = true
  where id = v_user_id;

  return json_build_object(
    'workspace_id', v_employee.workspace_id,
    'employee_id', v_employee.id
  );
end;
$$;

grant execute on function public.get_invite_by_token(uuid) to anon, authenticated;
grant execute on function public.accept_employee_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Workspaces: members can view, only owners can mutate
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view own workspace" on public.workspaces;
create policy "Members can view workspace" on public.workspaces
  for select using (public.is_workspace_member(id));

-- ---------------------------------------------------------------------------
-- Roles: members read, owners write
-- ---------------------------------------------------------------------------

drop policy if exists "Workspace owner can manage roles" on public.roles;

create policy "Members can view roles" on public.roles
  for select using (public.is_workspace_member(workspace_id));

create policy "Owner can insert roles" on public.roles
  for insert with check (public.is_workspace_owner(workspace_id));

create policy "Owner can update roles" on public.roles
  for update using (public.is_workspace_owner(workspace_id));

create policy "Owner can delete roles" on public.roles
  for delete using (public.is_workspace_owner(workspace_id));

-- ---------------------------------------------------------------------------
-- role_module_permissions: members read, owners write
-- ---------------------------------------------------------------------------

drop policy if exists "Workspace owner can manage role permissions" on public.role_module_permissions;

create policy "Members can view role permissions" on public.role_module_permissions
  for select using (
    role_id in (
      select r.id from public.roles r
      where public.is_workspace_member(r.workspace_id)
    )
  );

create policy "Owner can manage role permissions" on public.role_module_permissions
  for all using (
    role_id in (
      select r.id from public.roles r
      where public.is_workspace_owner(r.workspace_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Employees: owners manage; members can view team list
-- ---------------------------------------------------------------------------

drop policy if exists "Workspace owner can manage employees" on public.employees;
drop policy if exists "Owner can manage employees" on public.employees;
drop policy if exists "Employee can view self" on public.employees;

create policy "Members can view employees" on public.employees
  for select using (public.is_workspace_member(workspace_id));

create policy "Owner can insert employees" on public.employees
  for insert with check (public.is_workspace_owner(workspace_id));

create policy "Owner can update employees" on public.employees
  for update using (public.is_workspace_owner(workspace_id));

create policy "Owner can delete employees" on public.employees
  for delete using (public.is_workspace_owner(workspace_id));

-- ---------------------------------------------------------------------------
-- Module tables: workspace members get full data access (UI enforces RBAC)
-- ---------------------------------------------------------------------------

drop policy if exists "Workspace owner can manage attendance" on public.attendance;
create policy "Members can manage attendance" on public.attendance
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can manage leave requests" on public.leave_requests;
create policy "Members can manage leave requests" on public.leave_requests
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can manage products" on public.products;
create policy "Members can manage products" on public.products
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can manage transactions" on public.transactions;
create policy "Members can manage transactions" on public.transactions
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can manage suppliers" on public.suppliers;
create policy "Members can manage suppliers" on public.suppliers
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can manage purchase orders" on public.purchase_orders;
create policy "Members can manage purchase orders" on public.purchase_orders
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can manage customers" on public.customers;
create policy "Members can manage customers" on public.customers
  for all using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owner can view ai insights" on public.dashboard_ai_insights;
drop policy if exists "Workspace owner can insert ai insights" on public.dashboard_ai_insights;

create policy "Members can view ai insights" on public.dashboard_ai_insights
  for select using (public.is_workspace_member(workspace_id));

create policy "Members can insert ai insights" on public.dashboard_ai_insights
  for insert with check (public.is_workspace_member(workspace_id));
