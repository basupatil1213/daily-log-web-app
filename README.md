# Chronicle — Daily Time Tracker

A full-stack web application to log every hour of your day, understand your time patterns, and build better habits.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-database-green?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- **24-hour daily grid** — click any hour slot to assign a category and optional note
- **10 default categories** — Sleep, Work, Exercise, Meals, Learning, Leisure, Social, Commute, Personal Care, Other
- **Dashboard** — donut chart of today's time distribution, bar chart of the last 7 days, quick stats (sleep, work, exercise hours)
- **Day navigation** — browse any past date, see patterns over time
- **Auth** — email/password sign-up and sign-in via Supabase Auth
- **Per-user data** — Row Level Security ensures users only access their own logs
- **Responsive** — works on mobile and desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database + Auth | Supabase |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Language | TypeScript |
| Fonts | Syne, DM Sans, IBM Plex Mono |

## Project Structure

```
daily-log/
├── app/
│   ├── auth/page.tsx          # Sign in / sign up
│   ├── dashboard/
│   │   ├── layout.tsx         # Shell with sidebar
│   │   └── page.tsx           # Overview: stats, charts, week
│   └── log/[date]/page.tsx    # 24-hour daily log view
├── components/
│   ├── Sidebar.tsx            # Navigation sidebar
│   ├── HourGrid.tsx           # Interactive 24-slot grid
│   ├── HourSlot.tsx           # Individual hour row
│   ├── CategoryPicker.tsx     # Modal to assign category + note
│   ├── DayChart.tsx           # Donut chart (Recharts)
│   └── WeekChart.tsx          # Bar chart (Recharts)
├── lib/supabase/
│   ├── client.ts              # Browser Supabase client
│   └── server.ts              # Server component client
├── middleware.ts              # Auth guard + route protection
├── types/index.ts             # TypeScript types
└── supabase/schema.sql        # Database schema + RLS policies
```

## Getting Started

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the database schema

In your Supabase project, open the **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).

This creates:
- `profiles` — user profiles (auto-created on signup)
- `categories` — time categories with color + icon
- `time_logs` — hourly log entries
- Row Level Security policies on all tables
- A trigger that seeds 10 default categories for every new user

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials from **Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to sign in.

## Database Schema

### `profiles`
| Column | Type | Description |
|---|---|---|
| `id` | UUID | References `auth.users` |
| `email` | TEXT | User email |
| `full_name` | TEXT | Display name |
| `created_at` | TIMESTAMPTZ | Signup timestamp |

### `categories`
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `name` | TEXT | Category name |
| `color` | TEXT | Hex color code |
| `icon` | TEXT | Emoji icon |
| `is_default` | BOOLEAN | System category flag |

### `time_logs`
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `date` | DATE | Log date (YYYY-MM-DD) |
| `hour` | SMALLINT | Hour of day (0–23) |
| `category_id` | UUID | References `categories` |
| `note` | TEXT | Optional note for the hour |
| `duration_minutes` | SMALLINT | Duration (default 60) |

## License

MIT
