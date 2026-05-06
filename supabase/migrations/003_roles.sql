-- Roles table for RBAC
create table public.roles (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  permissions jsonb not null default '{}',
  created_at timestamp with time zone default now()
);

alter table public.roles enable row level security;

create policy "Workspace owner can manage roles" on public.roles
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );
