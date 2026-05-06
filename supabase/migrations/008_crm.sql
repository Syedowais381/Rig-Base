-- Customers
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  company text,
  status text not null default 'active' check (status in ('active', 'inactive', 'lead')),
  total_spent numeric not null default 0,
  last_interaction timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.customers enable row level security;

create policy "Workspace owner can manage customers" on public.customers
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );
