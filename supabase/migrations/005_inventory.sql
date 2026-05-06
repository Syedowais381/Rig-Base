-- Products/Inventory table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  sku text not null,
  category text not null,
  quantity integer not null default 0,
  unit_price numeric not null default 0,
  cost_price numeric not null default 0,
  min_stock_level integer not null default 0,
  status text not null default 'in_stock' check (status in ('in_stock', 'low_stock', 'out_of_stock')),
  created_at timestamp with time zone default now()
);

alter table public.products enable row level security;

create policy "Workspace owner can manage products" on public.products
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );
