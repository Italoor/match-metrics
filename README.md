# Match Metrics

A football statistics dashboard for analysing player performance across the top 5 European leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) from the 2017/18 to 2023/24 seasons.

## Features

- **Player Search** — filter players by name, team, position, and season
- **Performance Overview** — goals, assists, xG, progressive carries/passes, and more
- **Player Comparison** — side-by-side radar charts and stat breakdowns
- **Match Analysis** — per-match and per-90-minute metrics
- **Season Filtering** — slice data across seven seasons (2017/18–2023/24) and all five major European leagues

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Styling | CSS Modules / Vanilla CSS |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (schema in `supabase/schema.sql`)

### Installation

```bash
cd match-metrics
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

Run `supabase/schema.sql` against your Supabase project to create the required tables and Row Level Security policies.

Sample datasets (CSV) are in `match-metrics/datasets/` and can be imported via:

```bash
node scripts/import-csv.js
```

## Project Structure

```
match-metrics/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # UI components
│   │   └── match-metrics/  # Domain-specific components
│   ├── lib/              # Data fetching, Supabase client, utilities
│   └── types/            # TypeScript type definitions
├── datasets/             # Cleaned CSV season data
├── supabase/             # Database schema
└── scripts/              # Data import helpers
```

## License

MIT
