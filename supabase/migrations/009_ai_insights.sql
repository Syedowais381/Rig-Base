-- Daily cached AI dashboard insights (one generation per workspace per day)
create table public.dashboard_ai_insights (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  insight_date date not null,
  time_period text not null default 'month',
  metrics_snapshot jsonb not null default '[]',
  summary text not null,
  suggestions jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  unique (workspace_id, insight_date)
);

alter table public.dashboard_ai_insights enable row level security;

create policy "Workspace owner can view AI insights" on public.dashboard_ai_insights
  for select using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

create policy "Workspace owner can insert AI insights" on public.dashboard_ai_insights
  for insert with check (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

create index dashboard_ai_insights_workspace_date_idx
  on public.dashboard_ai_insights (workspace_id, insight_date desc);
