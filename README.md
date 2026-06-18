# CashPilot — Startup Cash Flow Intelligence

CashPilot is a production-ready FinTech platform that gives startups real-time visibility into their cash flow, automates invoice and bill management, forecasts runway, and fires smart alerts before problems become crises.

## Features

**Financial Operations**
- Multi-account management (checking, savings, credit, investment, crypto)
- Transaction tracking with 21 income and expense categories
- Real-time balance reconciliation on every transaction
- Invoice lifecycle management (draft → sent → viewed → paid/partial/overdue)
- Bill management with auto-scheduling for recurring payments

**Cash Flow Forecasting**
- 30/60/90-day runway projection using historical transaction patterns
- Weekly forecast buckets incorporating upcoming bills and expected invoice payments
- Runway warning with days-until-zero calculation

**Smart Alerts**
- Low balance threshold alerts
- Overdue invoice notifications
- Bills due within 7 days
- Runway warning when cash drops below configurable threshold
- Scheduled checks every 6 hours via cron job

**Reports & Analytics**
- Dashboard with live charts (cash flow area chart, expense breakdown bar chart)
- Monthly income vs expense comparison
- Expense breakdown by category with percentage share
- Balance summary by account type
- Custom date range reports

**Multi-Tenant Architecture**
- Organization-level data isolation
- Role-based access: owner / admin / accountant / viewer
- Team invite by email, role management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express 4, ES Modules |
| Database | MongoDB 7, Mongoose ODM |
| Auth | JWT (access + refresh token pair) |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS (dark theme) |
| State | Zustand (auth), TanStack React Query (server) |
| Charts | Recharts (AreaChart, BarChart) |
| Infra | Docker, Docker Compose, GitHub Actions CI |

## Getting Started

### With Docker (recommended)

```bash
# Clone and configure
git clone https://github.com/avase33/cashpilot.git
cd cashpilot
cp .env.example backend/.env
# Edit backend/.env with your JWT secrets

# Start all services
docker compose up -d

# App is live at http://localhost:3000
```

### Local Development

**Backend**
```bash
cd backend
npm install
cp ../.env.example .env   # fill in values
npm run dev               # starts on :5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev               # starts on :5173
```

Requires MongoDB running locally or update `MONGO_URI` to point to Atlas.

## API Overview

All routes are prefixed `/api`.

| Group | Base path |
|-------|-----------|
| Auth | `/api/auth` |
| Accounts | `/api/accounts` |
| Transactions | `/api/transactions` |
| Invoices | `/api/invoices` |
| Bills | `/api/bills` |
| Forecast | `/api/forecast` |
| Alerts | `/api/alerts` |
| Reports | `/api/reports` |
| Team | `/api/team` |

Auth uses Bearer tokens. Include `x-org-id` header for all org-scoped routes.

## Project Structure

```
cashpilot/
├── backend/
│   └── src/
│       ├── config/        # App configuration
│       ├── middleware/     # Auth, org access, role gates
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express route handlers
│       └── services/      # Business logic (forecast, alerts, reports)
├── frontend/
│   └── src/
│       ├── components/    # Layout, shared UI
│       ├── lib/           # Axios client + API modules
│       ├── pages/         # Route-level page components
│       ├── store/         # Zustand auth store
│       └── types/         # TypeScript interfaces
└── .github/workflows/     # GitHub Actions CI
```

## License

Copyright (c) 2026 Akhil Vase. All rights reserved.
This source code is the proprietary property of Akhil Vase.
Unauthorized copying, distribution, or modification is strictly prohibited.
