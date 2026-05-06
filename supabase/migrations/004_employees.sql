-- Employees table
create table public.employees (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  full_name text not null,
  email text not null,
  phone text,
  role_id uuid references public.roles(id),
  department text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'on_leave')),
  hire_date date not null default current_date,
  salary numeric,
  created_at timestamp with time zone default now()
);

alter table public.employees enable row level security;

create policy "Workspace owner can manage employees" on public.employees
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

-- Attendance
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  date date not null default current_date,
  check_in time,
  check_out time,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'half_day')),
  created_at timestamp with time zone default now()
);

alter table public.attendance enable row level security;

create policy "Workspace owner can manage attendance" on public.attendance
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

-- Leave requests
create table public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  type text not null check (type in ('annual', 'sick', 'personal', 'unpaid')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now()
);

alter table public.leave_requests enable row level security;

create policy "Workspace owner can manage leave requests" on public.leave_requests
  for all using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );
