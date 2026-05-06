-- Financial transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type text not null check (type in ('revenue', 'expense')),
  category text not null,
  amount numeric not null,
  description text not null,
  date date not null default current_date,
  reference text,
  created_at timestamp with time zone default now()
);

alter table public.transactions enable row level security;

create policy "Workspace owner can manage transactions" on public.transactions
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );
