# Rig Base

AI-personalized business management platform. Every business gets a completely unique ERP system built through an AI conversation during onboarding.

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd rig-base
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to **Settings > API** to find your URL and keys

### 3. Run database migrations

In the Supabase SQL Editor, run each file in `supabase/migrations/` **in order**:

1. `001_profiles.sql` — User profiles table with auth trigger
2. `002_workspace.sql` — AI-generated workspace configuration
3. `003_roles.sql` — Role-based access control
4. `004_employees.sql` — HR: employees, attendance, leave requests
5. `005_inventory.sql` — Products and stock tracking
6. `006_finance.sql` — Revenue and expense transactions
7. `007_supply_chain.sql` — Suppliers and purchase orders
8. `008_crm.sql` — Customer relationship management

For detailed setup + verification SQL, use the runbook at `docs/SUPABASE_SETUP.md`.

### 4. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key
- `GEMINI_API_KEY` — Free API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Free AI strategy (recommended)

- Start with Gemini free tier (`gemini-1.5-flash`) because it is already integrated in `src/lib/gemini.ts`.
- If you later need fallback providers, add an adapter layer for OpenRouter/Groq while keeping the onboarding JSON contract unchanged.

### 5. Enable Google OAuth (optional)

In Supabase dashboard: **Authentication > Providers > Google**

Add your Google OAuth credentials. Set the redirect URL to `http://localhost:3000/auth/callback`.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

- **Next.js 16** — App Router, API routes, server/client components
- **Supabase** — PostgreSQL, Auth (email + Google OAuth), RLS
- **Gemini 1.5 Flash** — AI onboarding agent
- **Framer Motion** — Animations
- **Recharts** — Data visualization
- **Zustand** — Client state
- **TanStack Query** — Server state and caching
- **Tailwind CSS** — Styling
- **Sonner** — Toast notifications
- **Lucide** — Icons

## How it works

1. User signs up with email/password or Google
2. AI onboarding agent conducts a conversation to understand the business
3. Agent generates a workspace configuration (modules, metrics, roles, departments)
4. Configuration is saved to Supabase and drives the entire UI
5. Dashboard renders metrics, sidebar shows only relevant modules
6. User adds real data — employees, products, transactions, customers

## Modules

| Module | Description |
|--------|-------------|
| Dashboard | AI-configured metrics, time period filter, setup checklist |
| HR | Employees, roles, permissions, departments |
| Inventory | Products, categories, stock levels |
| Finance | Revenue, expenses, net profit tracking |
| Supply Chain | Suppliers, purchase orders |
| CRM | Customers, leads, interaction tracking |

Each module starts completely empty. No dummy data anywhere.
