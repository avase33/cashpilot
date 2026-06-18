<div align="center">

```
  ██████╗ █████╗ ███████╗██╗  ██╗██████╗ ██╗██╗      ██████╗ ████████╗
 ██╔════╝██╔══██╗██╔════╝██║  ██║██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝
 ██║     ███████║███████╗███████║██████╔╝██║██║     ██║   ██║   ██║
 ██║     ██╔══██║╚════██║██╔══██║██╔═══╝ ██║██║     ██║   ██║   ██║
 ╚██████╗██║  ██║███████║██║  ██║██║     ██║███████╗╚██████╔╝   ██║
  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝
```

### **Startup Cash Flow Intelligence**

*Know your runway. Collect faster. Never miss a bill.*

<br/>

[![CI](https://github.com/avase33/cashpilot/actions/workflows/ci.yml/badge.svg)](https://github.com/avase33/cashpilot/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

<br/>

> **CashPilot** is a production-ready FinTech platform built for startups that need real command over their finances: live cash flow visibility, automated invoice and bill management, 90-day runway forecasting, and smart alerts that catch problems before they become crises.

<br/>

</div>

---

## Why CashPilot?

Most startups die not from bad ideas, but from running out of cash without seeing it coming.

CashPilot gives founders and finance teams a **single source of truth** for their money -- across every bank account, every invoice sent, every bill owed -- and turns that data into a clear picture of where you stand today and how long your runway lasts.

```
+-------------------------------------------------------------------+
|                                                                   |
|  💰 Real-time balances  -->  📊 Live charts  -->  🔮 Forecast     |
|                                                                   |
|  📄 Invoice lifecycle   -->  🧾 Bill scheduler  -->  🔔 Alerts    |
|                                                                   |
|  👥 Multi-org teams     -->  🔒 Role-based access                 |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## 🚀 Feature Highlights

### 💳 Account and Transaction Management

- **7 account types:** checking, savings, credit, investment, cash, crypto, other
- **Real-time balance reconciliation:** every transaction instantly updates account balances
- **21 categories** spanning income (revenue, consulting, investments) and expenses (payroll, rent, SaaS, marketing)
- Searchable, filterable transaction ledger with type icons and category tags

---

### 📄 Invoice Lifecycle Engine

```
draft --> sent --> viewed --> paid
                          |-> partial
                          |-> overdue   (auto-detected on due date)
                          \-> cancelled
```

- Auto-incremented invoice numbers (`INV-0001`, `INV-0002`, ...)
- Client portal-ready with slug-based public links
- Line items with per-item tax rates; subtotal and total auto-calculated
- One-click mark-paid, partial payment tracking, overdue auto-detection

---

### 🧾 Bills and Recurring Payments

- Schedule one-off or recurring bills (weekly / biweekly / monthly / quarterly / yearly)
- **Auto-reschedule:** paying a recurring bill automatically creates the next occurrence
- Overdue detection with dashboard warnings
- Vendor and category tagging for report grouping

---

### 🔮 Cash Flow Forecasting

```
Today --------------------------------------------> +90 days
  |                                                     |
  |-- Current balance                                   |-- Projected balance
  |-- Avg monthly income  (from history)                |-- Runway: X days
  |-- Avg monthly expense (from history)                \-- Risk flag if < 30d
  |-- Upcoming bills      (mapped to weeks)
  \-- Expected invoices   (mapped to weeks)
```

- Weekly projection buckets for the next 30, 60, or 90 days
- **Runway calculation:** days until balance hits zero at current burn rate
- Visual AreaChart with projected balance, expected income, and scheduled expenses
- Detailed weekly breakdown table

---

### 🔔 Smart Alerts (auto-checked every 6 hours)

| Alert Type | Trigger |
|---|---|
| Low Balance | Account drops below org threshold |
| Overdue Invoice | Invoice past due date, unpaid |
| Bill Due Soon | Bill due within 7 days |
| Runway Warning | Projected runway below configurable days |

---

### 📊 Reports and Analytics

- **Dashboard:** 4 KPI cards + Cash Flow AreaChart + Expense BarChart
- **Cash Flow Report:** monthly income vs expense, by-category breakdown
- **Balance Summary:** assets by account type with utilization bars
- **Custom date range:** last 3M / 6M / 12M / YTD or any custom range

---

### 👥 Multi-Tenant Teams

| Role | Permissions |
|---|---|
| **Owner** | Full access, delete org, team management |
| **Admin** | Full financial access and team management |
| **Accountant** | Full financial access, no team management |
| **Viewer** | Read-only dashboard and reports |

---

## 🏗️ Architecture

```
+--------------------------------------------------------------+
|                      CLIENT (Browser)                        |
|  React 18 - TypeScript - Vite - Tailwind CSS (dark theme)   |
|  Zustand (auth state) - TanStack React Query (server state)  |
|  Recharts (AreaChart, BarChart) - Axios (auto token refresh) |
+------------------------+-------------------------------------+
                         |
                         |  REST  +  Bearer JWT  +  x-org-id header
                         |
+------------------------v-------------------------------------+
|                    BACKEND (Node.js 20)                      |
|  Express 4 - ES Modules - Helmet - CORS - Rate Limiting      |
|                                                              |
|  +----------+  +----------+  +-----------+  +----------+    |
|  |   Auth   |  | Financial|  |  Forecast |  |  Alerts  |    |
|  | Middleware|  |  Routes  |  |  Service  |  |  Service |    |
|  +----------+  +----------+  +-----------+  +-----+----+    |
|                                             node-cron (6h)  |
+------------------------+-------------------------------------+
                         |
                         |  Mongoose ODM
                         |
+------------------------v-------------------------------------+
|                      MongoDB 7                               |
|  Users - Organizations - Accounts - Transactions            |
|  Invoices - Bills - Alerts                                  |
+--------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20, ES Modules | Backend server |
| **Framework** | Express 4 | REST API routing |
| **Database** | MongoDB 7, Mongoose | Data persistence and ODM |
| **Auth** | JWT (access + refresh pair) | Stateless authentication |
| **Frontend** | React 18, TypeScript, Vite | UI application |
| **Styling** | Tailwind CSS | Dark-theme component design |
| **Server State** | TanStack React Query | Caching, refetch, optimistic updates |
| **Client State** | Zustand | Auth store |
| **Charts** | Recharts | AreaChart and BarChart visualizations |
| **HTTP Client** | Axios | Auto token-refresh interceptor |
| **Containers** | Docker, Docker Compose | Multi-service orchestration |
| **CI** | GitHub Actions | Lint, type-check, build on every push |

---

## ⚡ Quick Start

### Option A: Docker (recommended)

```bash
# 1. Clone
git clone https://github.com/avase33/cashpilot.git
cd cashpilot

# 2. Configure secrets
cp .env.example backend/.env
# Edit backend/.env -- set JWT_SECRET and JWT_REFRESH_SECRET

# 3. Start all services
docker compose up -d
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:5000/api |
| Health | http://localhost:5000/health |

---

### Option B: Local Development

**Backend**

```bash
cd backend
npm install
cp ../.env.example .env      # fill in MONGO_URI and JWT secrets
npm run dev                  # starts on http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                  # starts on http://localhost:5173
```

> Requires MongoDB running locally, or set `MONGO_URI` to a MongoDB Atlas connection string.

---

## 📁 Project Structure

```
cashpilot/
|
+-- backend/
|   \-- src/
|       +-- config/            # App config: env, JWT, CORS, rate limits
|       +-- middleware/        # requireAuth | requireOrgAccess | requireRole
|       +-- models/
|       |   +-- User.js        # bcrypt hashing, initials virtual
|       |   +-- Organization.js# members[], roles, alert thresholds
|       |   +-- Account.js     # 7 types, running balance, color
|       |   +-- Transaction.js # 21 categories, balance reconciliation
|       |   +-- Invoice.js     # lifecycle hook, line items, auto-totals
|       |   +-- Bill.js        # recurring schedule, auto-next-date
|       |   \-- Alert.js       # severity, type, linked entity
|       +-- routes/            # auth | accounts | transactions | invoices
|       |                      # bills | forecast | alerts | reports | team
|       \-- services/
|           +-- forecastService.js   # 90-day weekly projection engine
|           +-- alertService.js      # automated health checks (cron)
|           +-- reportService.js     # cash flow + balance aggregations
|           \-- tokenService.js      # JWT sign and verify
|
+-- frontend/
|   \-- src/
|       +-- components/
|       |   \-- Layout.tsx     # sidebar nav, alerts badge, user menu
|       +-- lib/
|       |   \-- api.ts         # Axios client and all API modules
|       +-- pages/             # Dashboard | Accounts | Transactions
|       |                      # Invoices | Bills | Forecast | Reports
|       |                      # Alerts | Team
|       +-- store/
|       |   \-- auth.ts        # Zustand auth store
|       \-- types/
|           \-- index.ts       # Full TypeScript interface library
|
+-- .github/
|   \-- workflows/
|       \-- ci.yml             # Lint + type-check + Docker build
|
+-- docker-compose.yml         # mongo + backend + frontend services
+-- .env.example               # Environment variable template
\-- LICENSE                    # Proprietary (c) 2026 Akhil Vase
```

---

## 🔌 API Reference

All endpoints are prefixed `/api`. Authentication: `Authorization: Bearer <token>`. Org-scoped routes require the `x-org-id` header.

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | POST | `/auth/register` | Create account and default org |
| | POST | `/auth/login` | Get access and refresh tokens |
| | POST | `/auth/refresh` | Rotate access token |
| | GET | `/auth/me` | Current user profile |
| **Accounts** | GET | `/accounts` | List with total balance |
| | POST | `/accounts` | Create account |
| | DELETE | `/accounts/:id` | Soft delete |
| **Transactions** | GET | `/transactions` | Paginated, filterable ledger |
| | POST | `/transactions` | Create and reconcile balance |
| | DELETE | `/transactions/:id` | Delete and reverse balance |
| **Invoices** | GET | `/invoices` | List and stats (outstanding, overdue) |
| | POST | `/invoices` | Create with auto-number |
| | POST | `/invoices/:id/mark-paid` | Mark paid in full |
| **Bills** | GET | `/bills` | List and upcoming stats |
| | POST | `/bills/:id/pay` | Pay and auto-schedule next |
| **Forecast** | GET | `/forecast?days=90` | Weekly projection and runway |
| **Reports** | GET | `/reports/dashboard` | Full dashboard data bundle |
| | GET | `/reports/cashflow` | Date-range cash flow breakdown |
| | GET | `/reports/balance-summary` | Balance by account type |
| **Alerts** | GET | `/alerts` | List with unread count |
| | POST | `/alerts/run-checks` | Trigger immediate health scan |
| | PATCH | `/alerts/:id/read` | Mark as read |
| | PATCH | `/alerts/read-all` | Mark all read |
| | PATCH | `/alerts/:id/resolve` | Resolve alert |
| **Team** | GET | `/team` | Members and org details |
| | POST | `/team/invite` | Invite by email |
| | PATCH | `/team/:userId/role` | Update member role |
| | DELETE | `/team/:userId` | Remove member |

---

## 🗺️ Roadmap

- [ ] Stripe integration -- accept invoice payments online
- [ ] Plaid bank sync -- auto-import real transactions
- [ ] AI categorization -- GPT-4o auto-classifies imported transactions
- [ ] PDF invoice generation and email delivery via SendGrid
- [ ] Multi-currency support with live FX rates
- [ ] Budget vs actuals -- per-category monthly budgets with alerts
- [ ] QuickBooks / Xero export in IIF and CSV formats
- [ ] Mobile PWA with offline support
- [ ] Immutable audit log for all financial mutations
- [ ] Custom report builder with drag-and-drop and XLSX export

---

## 📜 License

```
Copyright (c) 2026 Akhil Vase. All rights reserved.

This source code is the proprietary property of Akhil Vase.
Unauthorized copying, distribution, or modification is strictly prohibited.
```

---

<div align="center">

**Built with precision for startups that take their finances seriously.**

*CashPilot -- Know your runway. Collect faster. Never miss a bill.*

</div>
