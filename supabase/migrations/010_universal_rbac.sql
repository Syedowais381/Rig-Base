-- Universal RBAC: module & permission catalogs + role_module_permissions junction

create table if not exists public.erp_modules (
  key text primary key,
  label text not null,
  sort_order int not null default 0
);

create table if not exists public.erp_permissions (
  key text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into public.erp_modules (key, label, sort_order) values
  ('dashboard', 'Dashboard', 1),
  ('hr', 'Human Resources', 2),
  ('inventory', 'Inventory', 3),
  ('finance', 'Finance', 4),
  ('supply_chain', 'Supply Chain', 5),
  ('crm', 'CRM', 6),
  ('settings', 'Settings', 7)
on conflict (key) do nothing;

insert into public.erp_permissions (key, label, sort_order) values
  ('view', 'View', 1),
  ('create', 'Create', 2),
  ('edit', 'Edit', 3),
  ('delete', 'Delete', 4),
  ('approve', 'Approve', 5),
  ('import', 'Import', 6),
  ('export', 'Export', 7),
  ('print', 'Print', 8),
  ('manage', 'Manage', 9),
  ('view_reports', 'View Reports', 10)
on conflict (key) do nothing;

alter table public.roles add column if not exists is_system boolean not null default false;
alter table public.roles add column if not exists description text;

create table if not exists public.role_module_permissions (
  id uuid default gen_random_uuid() primary key,
  role_id uuid references public.roles(id) on delete cascade not null,
  module_key text references public.erp_modules(key) not null,
  permission_key text references public.erp_permissions(key) not null,
  unique(role_id, module_key, permission_key)
);

create index if not exists role_module_permissions_role_id_idx
  on public.role_module_permissions(role_id);

alter table public.role_module_permissions enable row level security;

create policy "Workspace owner can manage role permissions" on public.role_module_permissions
  for all using (
    role_id in (
      select r.id from public.roles r
      join public.workspaces w on w.id = r.workspace_id
      where w.user_id = auth.uid()
    )
  );

-- Catalog tables are readable by authenticated users
alter table public.erp_modules enable row level security;
alter table public.erp_permissions enable row level security;

create policy "Authenticated users can read erp modules" on public.erp_modules
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read erp permissions" on public.erp_permissions
  for select using (auth.role() = 'authenticated');
