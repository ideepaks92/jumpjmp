# JumpJMP

Web-native, collaborative statistical analysis platform for engineers. Upload CSV/XLSX/Numbers files, build interactive charts, run SPC and process capability analysis, then share a link with your team.

## Features

- **Data Table** — Virtual-scrolled spreadsheet with auto-detected column types, sorting, and filtering
- **Graph Builder** — Drag-and-drop scatter, line, bar, histogram, box, heatmap, and contour charts (Plotly.js)
- **Descriptive Statistics** — Mean, std, median, quartiles, skewness, kurtosis
- **Control Charts** — Individuals/MR and X-bar/R with UCL/LCL and out-of-control detection
- **Process Capability** — Cp, Cpk, Pp, Ppk with spec-limit histogram overlay
- **Distribution Fitting** — Normal, Weibull, Lognormal, Exponential (via Pyodide/scipy in-browser)
- **Linear Regression** — Slope, intercept, R², residual plots, p-value
- **Hypothesis Testing** — Welch's t-test, one-way ANOVA with group statistics
- **Dashboard** — Drag-and-resize grid layout for arranging multiple charts
- **Collaboration** — Shareable links (view/edit/fork), comments on charts
- **Auth** — Magic link + Google OAuth via Supabase

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5, React 19
- **Styling**: Tailwind CSS v4
- **Charting**: Plotly.js via react-plotly.js
- **Data Table**: TanStack Table + TanStack Virtual
- **State**: Zustand + Immer
- **Compute**: Pyodide (WASM) in Web Worker + native JS fast path
- **File Parsing**: Papa Parse (CSV), SheetJS (XLSX/Numbers)
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage)
- **Validation**: Zod

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/jumpjmp.git
cd jumpjmp
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Create a storage bucket called `datasets`
4. Enable Google OAuth in Authentication > Providers (optional)

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase project URL and anon key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/                    Next.js App Router pages and API routes
├── (app)/              Authenticated app shell
│   ├── dashboard/      Workspace list
│   ├── w/[id]/         Workspace editor (data, graph, analysis, dashboard tabs)
│   └── s/[id]/         Shared workspace viewer
├── api/                REST endpoints (workspace, dataset, analysis, share)
└── page.tsx            Landing page with auth

components/             React components
├── analysis/           Statistical analysis panels (6 tools)
├── collaboration/      Share dialog, comment threads
├── dashboard/          Grid layout, toolbar
├── data-table/         Virtual-scrolled data table
├── graph-builder/      Drag-and-drop chart builder
├── shell/              Sidebar, topbar
└── upload/             File drop zone, parser

lib/                    Business logic
├── compute/            Stats engine (native JS + Pyodide worker)
├── parsers/            CSV, XLSX, column inference
├── schemas/            Zod validation schemas
├── store/              Zustand workspace store
└── supabase/           Client, server, middleware
```

## License

MIT
