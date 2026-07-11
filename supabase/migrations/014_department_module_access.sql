-- Department-scoped module visibility in RLS (role still controls actions)

create or replace function public.department_allows_module(
  p_department text,
  p_module_key text,
  p_modules jsonb
)
returns boolean
language plpgsql
stable
as $$
declare
  v_department text := lower(trim(coalesce(p_department, '')));
  v_enabled boolean;
begin
  if p_module_key = 'settings' then
    return true;
  end if;

  if v_department = '' then
    return false;
  end if;

  v_enabled := coalesce((p_modules ->> p_module_key)::boolean, false);
  if not v_enabled then
    return false;
  end if;

  if v_department in ('management', 'operations', 'executive', 'general', 'administration') then
    return true;
  end if;

  if v_department = p_module_key or replace(v_department, ' ', '_') = p_module_key then
    return true;
  end if;

  if v_department in ('finance', 'billing', 'accounting', 'estimating') and p_module_key = 'finance' then
    return true;
  end if;

  if v_department in ('hr', 'human resources', 'clinical', 'safety') and p_module_key = 'hr' then
    return true;
  end if;

  if v_department in ('kitchen', 'warehouse', 'production', 'quality', 'pharmacy', 'inventory')
     and p_module_key = 'inventory' then
    return true;
  end if;

  if v_department in ('procurement', 'supply chain', 'fleet', 'dispatch', 'logistics')
     and p_module_key = 'supply_chain' then
    return true;
  end if;

  if v_department in ('sales', 'service', 'marketing', 'delivery', 'customer support', 'customer service', 'crm', 'front desk')
     and p_module_key = 'crm' then
    return true;
  end if;

  if v_department = 'admin' and p_module_key in ('hr', 'finance') then
    return true;
  end if;

  if strpos(v_department, 'finance') > 0 and p_module_key = 'finance' then return true; end if;
  if strpos(v_department, 'human') > 0 and p_module_key = 'hr' then return true; end if;
  if strpos(v_department, 'inventory') > 0 and p_module_key = 'inventory' then return true; end if;
  if strpos(v_department, 'warehouse') > 0 and p_module_key = 'inventory' then return true; end if;
  if strpos(v_department, 'procurement') > 0 and p_module_key = 'supply_chain' then return true; end if;
  if strpos(v_department, 'supply') > 0 and p_module_key = 'supply_chain' then return true; end if;
  if strpos(v_department, 'customer') > 0 and p_module_key = 'crm' then return true; end if;
  if strpos(v_department, 'sales') > 0 and p_module_key = 'crm' then return true; end if;

  return false;
end;
$$;

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
  v_role_name text;
  v_department text;
  v_has_permission boolean;
begin
  if v_uid is null then
    return false;
  end if;

  if exists (
    select 1 from public.workspaces
    where id = ws_id and user_id = v_uid
  ) then
    return true;
  end if;

  select w.modules, r.permissions, r.name, e.department
  into v_modules, v_permissions, v_role_name, v_department
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

  v_has_permission := coalesce((v_permissions -> module_key ->> permission_key)::boolean, false);
  if not v_has_permission then
    return false;
  end if;

  if v_role_name = 'Administrator' then
    return true;
  end if;

  return public.department_allows_module(v_department, module_key, v_modules);
end;
$$;
