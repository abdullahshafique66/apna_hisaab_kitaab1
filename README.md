# Apna Hisab Kitaab

**Har Kharchay Ka Apna Hisab.** — a mobile-first PWA for Pakistani household expense tracking.
Write your expense. We'll do the hisab.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production PWA build → dist/
npm run preview      # serve dist/ (service worker active)
npm run build:single # one self-contained HTML file → dist-single/ (hosted preview)
```

Demo login: any email + any password of 6+ characters, or **"Demo account se try karein"** on the login screen.

## Frontend + backend together

1. **Backend:** open `backend/` and double-click `run.bat` (Windows) — API on http://127.0.0.1:8000
   (details in `backend/README.md`).
2. **Frontend:** copy `.env.example` to `.env` (it contains `VITE_API_URL=/api/v1`), then `npm run dev -- --host`.
   Vite forwards `/api` to the backend, so the same setup works from your phone on the same Wi-Fi.
3. Log in with **ayesha@example.pk / demo1234** or create an account.

Without a `.env` file the frontend runs on built-in offline demo data, no backend needed.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts (lazy-loaded) · React Router · jsPDF (lazy-loaded) · lucide-react.
No AI API or API key is needed for anything — quick entry parsing, totals, analytics and reports all run on-device.

## Routes

| Route | Screen |
|---|---|
| `/` | Landing page (hero, features, how it works, live product preview, analytics, reports, FAQ, CTA) |
| `/login` `/signup` `/forgot-password` | Auth with validation states |
| `/dashboard` | Summary cards, today's auto-totalled list, budget ring, 14-day chart, category donut |
| `/expenses` | Search, category / date / amount filters, sort, pagination. Table on desktop, day-grouped cards on mobile |
| `/daily` | Date navigator + week strip, grouped by category, daily total |
| `/analytics` | 7d / 30d / 3m / custom; daily/weekly/monthly overview, donut, trend, top items, category table |
| `/reports` | This week / month / custom → PDF, Excel (.xlsx), CSV + live report preview |
| `/categories` | Add / edit / delete with icon & colour picker (expenses of a deleted category move to "Other") |
| `/budget` | Monthly budget, progress ring, per-day allowance, 85% warning |
| `/settings` | Profile (+ picture), preferences (theme, date format), budget, security, data (export, reset, clear, simulate error, delete account), PWA install |

Keyboard: `N` add expense · `/` or `Ctrl/⌘ K` global search.

## Project structure

```
src/
  types/            DB-mirroring types (User, Expense, Category, Budget) + query/response shapes
  data/mockData.ts  Realistic Pakistani household seed data (kept separate from UI)
  services/
    api.ts          THE service layer — every screen calls only these functions
    http.ts         fetch client for FastAPI (enabled by VITE_API_URL)
    calc.ts         Pure "automatic hisab" functions (totals, series, category breakdown, reports)
    exporters.ts    CSV / XLSX / PDF generation + download
  lib/
    quickEntry.ts   Rule-based parser: "Aloo 2kg 240" → { item, qty, unit, amount, category }
    xlsx.ts         Dependency-free .xlsx writer
  hooks/            useQuery (auto-refetch on any mutation), useCountUp, useThemeColors, useInstallPrompt…
  context/          App state: session, theme, categories, Add-Expense sheet, search palette
  components/       Logo, AppSidebar, MobileBottomNav, Header, ExpenseCard, ExpenseTable, AddExpenseForm,
                    ExpenseSummaryCard, CategoryCard, SpendingChart, CategoryChart, DateRangePicker,
                    ReportCard, BudgetProgress, EmptyState, LoadingSkeleton, ErrorState, ConfirmDialog, Toast
  pages/            Landing, auth, and app pages (app pages are code-split)
public/             manifest.webmanifest, sw.js (offline shell), icons (any + maskable)
```

## How totals stay automatic

Totals are never stored or typed — they are derived from expense rows in `services/calc.ts`.
Every mutation (`createExpense`, `updateExpense`, `deleteExpense`, category/budget changes) emits a change
event; every `useQuery` on screen refetches in the background. Change Aloo from Rs. 120 to Rs. 150 and the
dashboard, daily total, week/month totals, category totals, charts and report preview all update together.

## Connecting the FastAPI backend

The backend is in `backend/`. Set `VITE_API_URL` (see `.env.example`). `services/api.ts` then calls these endpoints instead of the mock store:

| Function | Method & path |
|---|---|
| `login` / `signup` / `requestPasswordReset` | `POST /auth/login` · `POST /auth/signup` · `POST /auth/forgot-password` → `{ token, user }` |
| `updateProfile` / `changePassword` / `deleteAccount` | `PATCH /me` · `POST /auth/change-password` · `DELETE /me` |
| `getExpenses(q)` | `GET /expenses?search&category_id&from&to&min_amount&max_amount&sort&page&page_size` → `Paginated<Expense>` (includes `total_amount` of the filtered set) |
| `createExpense` / `updateExpense` / `deleteExpense` | `POST /expenses` · `PATCH /expenses/{id}` · `DELETE /expenses/{id}` |
| `getItemSuggestions` | `GET /expenses/suggestions` |
| `getDashboardStats` | `GET /dashboard/stats` → `DashboardStats` |
| `getAnalytics(from, to, granularity)` | `GET /analytics?from&to&granularity=daily\|weekly\|monthly` → `Analytics` |
| `getReports(from, to, title)` | `GET /reports?from&to&title` → `Report` (binary: `GET /reports/export?format=pdf\|excel\|csv`) |
| `getCategories` / `createCategory` / `updateCategory` / `deleteCategory` | `GET/POST /categories` · `PATCH/DELETE /categories/{id}` |
| `getBudget` / `setBudget` | `GET /budgets/current` · `PUT /budgets/{year}/{month}` |
| `exportAllData` | `GET /export` |

Bearer token is sent automatically after login. Amounts are whole rupees (integers); dates are `YYYY-MM-DD`.
The same aggregation logic in `calc.ts` can be ported to SQL/Python on the server.

## Testing states

Settings → Data: **Reset demo data**, **Clear all expenses** (empty states), **Simulate a connection error** (error + retry states on every screen). Skeletons appear on every first load.
