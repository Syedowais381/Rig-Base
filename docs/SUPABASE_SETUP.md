# Supabase Setup Runbook (New Account)

This runbook initializes a fresh Supabase project for Rig Base and verifies that migrations, RLS, and onboarding dependencies are correct.

## 1) Create a New Supabase Project

1. Sign in to [Supabase](https://supabase.com).
2. Create a new project in your preferred region.
3. Wait for project provisioning to complete.

## 2) Collect Project Keys

In Supabase Dashboard -> `Settings` -> `API`, copy:

- `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret key` -> `SUPABASE_SERVICE_ROLE_KEY`

Set these in `.env.local` along with:

- `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey)

## 3) Configure Authentication

In Supabase Dashboard -> `Authentication`:

- Ensure Email auth is enabled.
- (Optional) Enable Google provider and set redirect URL to:
  - `http://localhost:3000/auth/callback`

## 4) Run SQL Migrations in Order

Open Supabase SQL Editor and execute these files one by one:

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_workspace.sql`
3. `supabase/migrations/003_roles.sql`
4. `supabase/migrations/004_employees.sql`
5. `supabase/migrations/005_inventory.sql`
6. `supabase/migrations/006_finance.sql`
7. `supabase/migrations/007_supply_chain.sql`
8. `supabase/migrations/008_crm.sql`

## 5) Verification SQL (Copy/Paste)

### 5.1 Tables exist

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'workspaces',
    'roles',
    'employees',
    'attendance',
    'leave_requests',
    'products',
    'transactions',
    'suppliers',
    'purchase_orders',
    'customers'
  )
order by table_name;
```

### 5.2 RLS enabled everywhere

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'workspaces',
    'roles',
    'employees',
    'attendance',
    'leave_requests',
    'products',
    'transactions',
    'suppliers',
    'purchase_orders',
    'customers'
  )
order by tablename;
```

`rowsecurity` should be `true` for all rows.

### 5.3 Policies exist

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'workspaces',
    'roles',
    'employees',
    'attendance',
    'leave_requests',
    'products',
    'transactions',
    'suppliers',
    'purchase_orders',
    'customers'
  )
order by tablename, policyname;
```

### 5.4 Signup trigger/function exist

```sql
select proname
from pg_proc
where proname = 'handle_new_user';
```

```sql
select trigger_name, event_object_table
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
```

## 6) Smoke Test Flow

1. Run the app with `npm run dev`.
2. Sign up a new user.
3. Complete onboarding and confirm redirect to `/dashboard`.
4. Verify one `workspaces` row exists for that user.
5. Re-run onboarding and confirm workspace updates without duplicate roles.
