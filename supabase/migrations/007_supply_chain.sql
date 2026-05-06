-- Suppliers
create table public.suppliers (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now()
);

alter table public.suppliers enable row level security;

create policy "Workspace owner can manage suppliers" on public.suppliers
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

-- Purchase orders
create table public.purchase_orders (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  order_number text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric not null default 0,
  order_date date not null default current_date,
  expected_delivery date,
  items jsonb not null default '[]',
  created_at timestamp with time zone default now()
);

alter table public.purchase_orders enable row level security;

create policy "Workspace owner can manage purchase orders" on public.purchase_orders
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );
