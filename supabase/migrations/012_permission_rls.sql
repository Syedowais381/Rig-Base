-- Permission-aware RLS: enforce module permissions at the database layer

create or replace function public.current_user_can(
  ws_id uuid,
  module_key text,
  permission_key text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_permissions jsonb;
  v_modules jsonb;
  v_module_enabled boolean;
begin
  if v_uid is null then
    return false;
  end if;

  -- Workspace owners have full access
  if exists (
    select 1 from public.workspaces
    where id = ws_id and user_id = v_uid
  ) then
    return true;
  end if;

  select w.modules, r.permissions
  into v_modules, v_permissions
  from public.employees e
  join public.workspaces w on w.id = e.workspace_id
  join public.roles r on r.id = e.role_id
  where e.workspace_id = ws_id
    and e.user_id = v_uid
    and e.status in ('active', 'on_leave');

  if v_permissions is null then
    return false;
  end if;

  if module_key <> 'settings' then
    v_module_enabled := coalesce((v_modules ->> module_key)::boolean, false);
    if not v_module_enabled then
      return false;
    end if;
  end if;

  return coalesce((v_permissions -> module_key ->> permission_key)::boolean, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Employees (HR module permissions)
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view employees" on public.employees;
drop policy if exists "Owner can insert employees" on public.employees;
drop policy if exists "Owner can update employees" on public.employees;
drop policy if exists "Owner can delete employees" on public.employees;

create policy "HR view employees" on public.employees
  for select using (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'view')
  );

create policy "HR create employees" on public.employees
  for insert with check (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'create')
  );

create policy "HR edit employees" on public.employees
  for update using (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'edit')
  );

create policy "HR delete employees" on public.employees
  for delete using (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'delete')
  );

-- ---------------------------------------------------------------------------
-- Roles (manage permission)
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view roles" on public.roles;
drop policy if exists "Owner can insert roles" on public.roles;
drop policy if exists "Owner can update roles" on public.roles;
drop policy if exists "Owner can delete roles" on public.roles;

create policy "Members can view roles" on public.roles
  for select using (public.is_workspace_member(workspace_id));

create policy "Managers can insert roles" on public.roles
  for insert with check (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'manage')
    or public.current_user_can(workspace_id, 'settings', 'manage')
  );

create policy "Managers can update roles" on public.roles
  for update using (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'manage')
    or public.current_user_can(workspace_id, 'settings', 'manage')
  );

create policy "Managers can delete roles" on public.roles
  for delete using (
    public.is_workspace_owner(workspace_id)
    or public.current_user_can(workspace_id, 'hr', 'manage')
    or public.current_user_can(workspace_id, 'settings', 'manage')
  );

-- ---------------------------------------------------------------------------
-- Module data tables
-- ---------------------------------------------------------------------------

drop policy if exists "Members can manage attendance" on public.attendance;
create policy "HR view attendance" on public.attendance for select
  using (public.current_user_can(workspace_id, 'hr', 'view') or public.is_workspace_owner(workspace_id));
create policy "HR create attendance" on public.attendance for insert
  with check (public.current_user_can(workspace_id, 'hr', 'create') or public.is_workspace_owner(workspace_id));
create policy "HR edit attendance" on public.attendance for update
  using (public.current_user_can(workspace_id, 'hr', 'edit') or public.is_workspace_owner(workspace_id));
create policy "HR delete attendance" on public.attendance for delete
  using (public.current_user_can(workspace_id, 'hr', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can manage leave requests" on public.leave_requests;
create policy "HR view leave" on public.leave_requests for select
  using (public.current_user_can(workspace_id, 'hr', 'view') or public.is_workspace_owner(workspace_id));
create policy "HR create leave" on public.leave_requests for insert
  with check (public.current_user_can(workspace_id, 'hr', 'create') or public.is_workspace_owner(workspace_id));
create policy "HR edit leave" on public.leave_requests for update
  using (public.current_user_can(workspace_id, 'hr', 'edit') or public.is_workspace_owner(workspace_id));
create policy "HR delete leave" on public.leave_requests for delete
  using (public.current_user_can(workspace_id, 'hr', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can manage products" on public.products;
create policy "Inventory view products" on public.products for select
  using (public.current_user_can(workspace_id, 'inventory', 'view') or public.is_workspace_owner(workspace_id));
create policy "Inventory create products" on public.products for insert
  with check (public.current_user_can(workspace_id, 'inventory', 'create') or public.is_workspace_owner(workspace_id));
create policy "Inventory edit products" on public.products for update
  using (public.current_user_can(workspace_id, 'inventory', 'edit') or public.is_workspace_owner(workspace_id));
create policy "Inventory delete products" on public.products for delete
  using (public.current_user_can(workspace_id, 'inventory', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can manage transactions" on public.transactions;
create policy "Finance view transactions" on public.transactions for select
  using (public.current_user_can(workspace_id, 'finance', 'view') or public.is_workspace_owner(workspace_id));
create policy "Finance create transactions" on public.transactions for insert
  with check (public.current_user_can(workspace_id, 'finance', 'create') or public.is_workspace_owner(workspace_id));
create policy "Finance edit transactions" on public.transactions for update
  using (public.current_user_can(workspace_id, 'finance', 'edit') or public.is_workspace_owner(workspace_id));
create policy "Finance delete transactions" on public.transactions for delete
  using (public.current_user_can(workspace_id, 'finance', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can manage suppliers" on public.suppliers;
create policy "Supply view suppliers" on public.suppliers for select
  using (public.current_user_can(workspace_id, 'supply_chain', 'view') or public.is_workspace_owner(workspace_id));
create policy "Supply create suppliers" on public.suppliers for insert
  with check (public.current_user_can(workspace_id, 'supply_chain', 'create') or public.is_workspace_owner(workspace_id));
create policy "Supply edit suppliers" on public.suppliers for update
  using (public.current_user_can(workspace_id, 'supply_chain', 'edit') or public.is_workspace_owner(workspace_id));
create policy "Supply delete suppliers" on public.suppliers for delete
  using (public.current_user_can(workspace_id, 'supply_chain', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can manage purchase orders" on public.purchase_orders;
create policy "Supply view POs" on public.purchase_orders for select
  using (public.current_user_can(workspace_id, 'supply_chain', 'view') or public.is_workspace_owner(workspace_id));
create policy "Supply create POs" on public.purchase_orders for insert
  with check (public.current_user_can(workspace_id, 'supply_chain', 'create') or public.is_workspace_owner(workspace_id));
create policy "Supply edit POs" on public.purchase_orders for update
  using (public.current_user_can(workspace_id, 'supply_chain', 'edit') or public.is_workspace_owner(workspace_id));
create policy "Supply delete POs" on public.purchase_orders for delete
  using (public.current_user_can(workspace_id, 'supply_chain', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can manage customers" on public.customers;
create policy "CRM view customers" on public.customers for select
  using (public.current_user_can(workspace_id, 'crm', 'view') or public.is_workspace_owner(workspace_id));
create policy "CRM create customers" on public.customers for insert
  with check (public.current_user_can(workspace_id, 'crm', 'create') or public.is_workspace_owner(workspace_id));
create policy "CRM edit customers" on public.customers for update
  using (public.current_user_can(workspace_id, 'crm', 'edit') or public.is_workspace_owner(workspace_id));
create policy "CRM delete customers" on public.customers for delete
  using (public.current_user_can(workspace_id, 'crm', 'delete') or public.is_workspace_owner(workspace_id));

drop policy if exists "Members can view ai insights" on public.dashboard_ai_insights;
drop policy if exists "Members can insert ai insights" on public.dashboard_ai_insights;
create policy "Dashboard view insights" on public.dashboard_ai_insights for select
  using (public.current_user_can(workspace_id, 'dashboard', 'view') or public.is_workspace_owner(workspace_id));
create policy "Dashboard create insights" on public.dashboard_ai_insights for insert
  with check (public.current_user_can(workspace_id, 'dashboard', 'view_reports') or public.is_workspace_owner(workspace_id));

-- Workspaces: members read; only owners or settings managers update
drop policy if exists "Users can update own workspace" on public.workspaces;
create policy "Owners can update workspace" on public.workspaces
  for update using (
    auth.uid() = user_id
    or public.current_user_can(id, 'settings', 'manage')
  );
