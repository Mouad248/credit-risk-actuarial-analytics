# Reinsight — Reinsurance Portfolio Profitability Dashboard

[Short case study](CASE_STUDY.md) · [Populated dashboard gallery](screenshots/README.md) ·
[Implementation evidence](../portfolio-guide/BI_IMPLEMENTATION.md) · [Portfolio](../README.md)

![Existing application running with bundled demo data](screenshots/profitability-overview.png)

The gallery shows the local profitability page and Cédante 001 analysis after API
data and charts loaded. These are captures of this React/FastAPI application.
The separate browser-demo reference below is retained from the existing checkout;
no deployment is part of this documentation update.

**[Explore the live interactive demo →](https://reinsight-analytics-mouade.appreciativebow.chatgpt.site)**

The public browser adaptation includes portfolio filters, annual and regional
comparisons, cedant analysis and CSV export. It uses aggregates from the anonymised
demo dataset and demonstrates a focused subset of this React/FastAPI application.
Its technical margin includes commissions and charges; definitions are shown in the demo.

An analytics web app that turns reinsurance underwriting data into clear profitability indicators: loss ratio (S/P), technical ratio, profitability by region, line of business and cedant. Personal project.

**Stack:** FastAPI · pandas · React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts

> **Data:** the app ships with a fully **anonymised demo dataset** (about 62,000 rows, 2016–2024): cedants, insureds, contract numbers and profit centres are replaced by generic identifiers and amounts are distorted. It reflects no real portfolio. See [data/README.md](data/README.md) (in French).

*Résumé (FR) : application d'analyse de la rentabilité d'un portefeuille de réassurance (ratio S/P, ratio technique, rentabilité par région, ligne d'affaires et cédante). Les notions métier et formules sont documentées en français dans [docs/NOTIONS_ET_FORMULES_REASSURANCE.md](docs/NOTIONS_ET_FORMULES_REASSURANCE.md).*

---

## What it does

| Area | Details |
|---|---|
| **Profitability dashboard** | KPIs (premiums, S/P, technical ratio, profitability), annual trend, regional comparison; filters by region, product (life / non-life), business type (treaty / facultative) and line of business. |
| **Cedant analysis** | Fuzzy search (RapidFuzz), multi-select, top / bottom cedants ranked by S/P, annual trends, contract mix, risk countries, branch-level detail. |
| **Interactive map** | Profitability by region with zoom, pan, filterable legend and keyboard accessibility. |
| **Typed REST API** | FastAPI with Pydantic models, vectorised pandas calculations and in-memory caching; Swagger docs at `/docs`. |

**Status:** the profitability dashboard and cedant pages are working. Investments, solvency / IFRS 17 modules, authentication, a database layer and CI are on the roadmap (see the About page). The home page charts are sample values.

## Key metrics

```
Loss ratio (S/P)   = (Claims + Reserves) / Earned premium × 100
Technical ratio    = (Claims + Reserves + Commission + Brokerage + Other charges + Overrider) / Earned premium × 100
Profitability      = (Earned premium − Claims − Reserves) / Earned premium × 100
```

Definitions, conventions and every formula are documented in [docs/NOTIONS_ET_FORMULES_REASSURANCE.md](docs/NOTIONS_ET_FORMULES_REASSURANCE.md) (French).

## Project structure

```
subscription_backend.py   FastAPI app: data loading, KPI calculations, endpoints
requirements.txt          Python dependencies
data/                     Anonymised demo dataset + notes
scripts/                  make_demo_dataset.py (anonymiser), generate_map_image.py
src/
  pages/                  Subscription (profitability), Cedantes, About, ...
  components/             charts, cedant tables / quadrants, interactive map, layout
  services/               API client
  hooks/                  data hooks (branches, map coordinates)
docs/                     Domain notes, map changelog, map image guide
```

## Run locally

**1. API** (Python 3.10+)

```bash
python -m venv venv
venv\Scripts\activate          # Windows  (source venv/bin/activate on macOS / Linux)
pip install -r requirements.txt
uvicorn subscription_backend:app --reload
```

The API runs on `http://localhost:8000` (docs at `/docs`) and loads `data/demo_dataset.csv.gz` by default.

**2. Frontend** (Node 18+)

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

The frontend reads the API address from `VITE_API_URL` (default `http://localhost:8000`, see `.env.example`). The API allows the origins listed in `ALLOWED_ORIGINS` (comma-separated; default: the local dev ports).

## Deploy a live demo (free tiers)

**1. API on Render** (New → Web Service, connect the repository)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn subscription_backend:app --host 0.0.0.0 --port $PORT`
- Environment variable: `ALLOWED_ORIGINS` = the URL of your frontend (set it after step 2)
- The anonymised demo dataset in `data/` is loaded by default. The free tier sleeps when idle, so the first request can take about a minute.

**2. Frontend on Vercel or Netlify** (import the repository)
- Build command: `npm run build`, output directory: `dist`
- Environment variable: `VITE_API_URL` = the URL of your Render service (no trailing slash)
- `vercel.json` rewrites every route to `index.html`, so client-side routes work on refresh. On Netlify, add a `/*  /index.html  200` rule in `public/_redirects`.

Then put the live link and 2–3 screenshots at the top of this README.

## Using your own data

Never commit real data. Point the API at a local file (sheet `data` in `.xlsx`, or `.csv` / `.csv.gz`):

```powershell
$env:DATA_FILE = "path\to\your_file.xlsx"
uvicorn subscription_backend:app
```

Expected columns are listed in [data/README.md](data/README.md). To build a new anonymised demo file from a real one:

```bash
python scripts/make_demo_dataset.py --source path/to/real_file.xlsx --out data/demo_dataset.csv.gz
```

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/subscription-data` | KPIs and aggregates, with optional `region`, `product_type`, `business_type`, `line_of_business` filters |
| `GET /api/cedants/suggest` | Fuzzy cedant search |
| `GET /api/cedants/by-region` | Cedants for a region |
| `GET /api/cedant-details/{id}` | Cedant detail |
| `GET /api/cedants/{id}/analytics` | Cedant trends and mix |
| `GET /api/cedants/{id}/branches` | Branch-level breakdown |
| `GET /api/regions/stats` | Regional statistics |

## Limitations

- Demo data only; amounts are distorted, so conclusions are illustrative.
- Data is read from a file at start-up (no database, no scheduled refresh).
- No authentication.
- Frontend test files exist for the map, branch table and hooks, but no test runner script is configured yet.
