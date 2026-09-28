/**
 * API / service layer.
 *
 * UI components only ever call these functions. Each one has two implementations:
 *   - mock: in-browser store seeded from src/data/mockData.ts and persisted to localStorage
 *   - http: FastAPI endpoints (enabled by setting VITE_API_URL)
 *
 * Suggested FastAPI routes are documented next to each function.
 */
import type {
  Analytics, Budget, Category, CategoryInput, DashboardStats, Expense, ExpenseInput, ExpenseQuery,
  Granularity, ISODate, Paginated, Report, User,
} from "@/types";
import { API_URL, ApiError, http, httpBlob, setAuthToken } from "./http";
import { buildReport, computeAnalytics, computeDashboardStats, filterExpenses } from "./calc";
import { MOCK_USER_ID, buildMockBudget, buildMockExpenses, defaultCategories, mockUser } from "@/data/mockData";
import { sleep, storage, todayISO, uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Change notifications — lets every screen refresh its totals after a mutation
// ---------------------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();
export const onDataChange = (fn: Listener) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
const emitChange = () => listeners.forEach((fn) => fn());

// ---------------------------------------------------------------------------
// Mock store
// ---------------------------------------------------------------------------
const KEY = "ahk:db:v1";
interface DB {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  user: User;
}
let db: DB | null = null;
function load(): DB {
  if (db) return db;
  const saved = storage.get<DB | null>(KEY, null);
  db = saved ?? { expenses: buildMockExpenses(), categories: defaultCategories, budgets: [buildMockBudget()], user: mockUser };
  return db;
}
const persist = () => storage.set(KEY, db);

/** Testing aid: Settings → Data can make the mock API fail to preview error states. */
let simulateFailure = false;
export const setSimulateFailure = (v: boolean) => {
  simulateFailure = v;
  emitChange();
};
export const getSimulateFailure = () => simulateFailure;

/** True when the app talks to the real FastAPI backend (VITE_API_URL is set). */
export const isLiveBackend = Boolean(API_URL);

async function mock<T>(fn: () => T, delay = 260): Promise<T> {
  await sleep(delay);
  if (simulateFailure) throw new ApiError(503, "Network unavailable");
  return structuredClone(fn());
}

const useHttp = () => Boolean(API_URL);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const SESSION_KEY = "ahk:session";
const DEMO_EMAIL = mockUser.email;
export interface Session {
  token: string;
  user: User;
}

export function getSession(): Session | null {
  const s = storage.get<Session | null>(SESSION_KEY, null) ?? memorySession;
  if (s) setAuthToken(s.token);
  return s;
}

/** POST /auth/login → { token, user } */
export async function login(email: string, password: string, remember = true): Promise<Session> {
  let session: Session;
  if (useHttp()) session = await http<Session>("POST", "/auth/login", { body: { email, password } });
  else {
    await sleep(500);
    if (password.length < 6) throw new ApiError(401, "Email ya password ghalat hai.");
    const d = load();
    const isDemo = email.trim().toLowerCase() === DEMO_EMAIL;
    if (isDemo && d.user.email !== DEMO_EMAIL) {
      // Switching to the demo account → load the sample household data
      db = { expenses: buildMockExpenses(), categories: defaultCategories, budgets: [buildMockBudget()], user: mockUser };
      persist();
      emitChange();
    }
    if (!isDemo && d.user.email.toLowerCase() !== email.trim().toLowerCase())
      throw new ApiError(401, "Is phone par yeh account nahi mila. Pehle Sign up karein ya Demo account try karein.");
    const u = isDemo ? mockUser : d.user;
    session = { token: `mock_${uid()}`, user: u };
  }
  setAuthToken(session.token);
  if (remember) storage.set(SESSION_KEY, session);
  else storage.remove(SESSION_KEY);
  memorySession = session;
  return session;
}

/** POST /auth/signup → { token, user } */
export async function signup(name: string, email: string, password: string): Promise<Session> {
  if (useHttp()) {
    const s = await http<Session>("POST", "/auth/signup", { body: { name, email, password } });
    setAuthToken(s.token);
    storage.set(SESSION_KEY, s);
    memorySession = s;
    return s;
  }
  await sleep(600);
  // A real new user starts with an empty hisab (default categories, no budget).
  const user: User = { id: `u_${uid()}`, name, email, avatar_url: null, created_at: new Date().toISOString() };
  db = { expenses: [], categories: defaultCategories.map((c) => ({ ...c, user_id: user.id })), budgets: [], user };
  persist();
  emitChange();
  const s = { token: `mock_${uid()}`, user };
  storage.set(SESSION_KEY, s);
  memorySession = s;
  return s;
}

/** POST /auth/reset-password → { token, user } */
export async function resetPassword(token: string, password: string): Promise<Session | null> {
  if (useHttp()) {
    const s = await http<Session>("POST", "/auth/reset-password", { body: { token, password } });
    setAuthToken(s.token);
    storage.set(SESSION_KEY, s);
    memorySession = s;
    return s;
  }
  await sleep(600);
  return null;
}

/** POST /auth/forgot-password */
export async function requestPasswordReset(email: string): Promise<void> {
  if (useHttp()) return http("POST", "/auth/forgot-password", { body: { email } });
  await sleep(700);
}

let memorySession: Session | null = null;
export const getMemorySession = () => memorySession;

export function logout() {
  storage.remove(SESSION_KEY);
  memorySession = null;
  setAuthToken(null);
}

/** PATCH /me */
export async function updateProfile(patch: Partial<Pick<User, "name" | "email" | "avatar_url">>): Promise<User> {
  if (useHttp()) return http<User>("PATCH", "/me", { body: patch });
  return mock(() => {
    const d = load();
    d.user = { ...d.user, ...patch };
    persist();
    const s = storage.get<Session | null>(SESSION_KEY, null);
    if (s) storage.set(SESSION_KEY, { ...s, user: d.user });
    if (memorySession) memorySession = { ...memorySession, user: d.user };
    emitChange();
    return d.user;
  });
}

/** POST /auth/change-password */
export async function changePassword(current: string, next: string): Promise<void> {
  if (useHttp()) return http("POST", "/auth/change-password", { body: { current, next } });
  await sleep(500);
  if (current.length < 6) throw new ApiError(400, "Current password ghalat hai.");
  if (next.length < 8) throw new ApiError(400, "Naya password kam az kam 8 characters ka ho.");
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

/** GET /expenses?search=&category_id=&from=&to=&min_amount=&max_amount=&sort=&page=&page_size= */
export async function getExpenses(q: ExpenseQuery = {}): Promise<Paginated<Expense>> {
  if (useHttp()) return http("GET", "/expenses", { query: { ...q } });
  return mock(() => filterExpenses(load().expenses, q, load().categories));
}

/** POST /expenses */
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  if (useHttp()) {
    const e = await http<Expense>("POST", "/expenses", { body: input });
    emitChange();
    return e;
  }
  const res = await mock(() => {
    const now = new Date().toISOString();
    const e: Expense = { ...input, id: `e_${uid()}`, user_id: MOCK_USER_ID, created_at: now, updated_at: now };
    load().expenses.unshift(e);
    persist();
    return e;
  }, 320);
  emitChange();
  return res;
}

/** PATCH /expenses/{id} */
export async function updateExpense(id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
  if (useHttp()) {
    const e = await http<Expense>("PATCH", `/expenses/${id}`, { body: patch });
    emitChange();
    return e;
  }
  const res = await mock(() => {
    const d = load();
    const i = d.expenses.findIndex((e) => e.id === id);
    if (i < 0) throw new ApiError(404, "Expense not found");
    d.expenses[i] = { ...d.expenses[i], ...patch, updated_at: new Date().toISOString() };
    persist();
    return d.expenses[i];
  }, 300);
  emitChange();
  return res;
}

/** DELETE /expenses/{id} */
export async function deleteExpense(id: string): Promise<void> {
  if (useHttp()) {
    await http("DELETE", `/expenses/${id}`);
    emitChange();
    return;
  }
  await mock(() => {
    const d = load();
    d.expenses = d.expenses.filter((e) => e.id !== id);
    persist();
  }, 250);
  emitChange();
}

/** Restore a deleted expense (used by the "Undo" toast). POST /expenses with the original payload. */
export async function restoreExpense(e: Expense): Promise<void> {
  if (useHttp()) {
    await http("POST", "/expenses", { body: e });
    emitChange();
    return;
  }
  load().expenses.push(e);
  persist();
  emitChange();
}

/** GET /expenses/suggestions — most-used item names for autocomplete */
export async function getItemSuggestions(): Promise<{ item_name: string; category_id: string; amount: number; unit: Expense["unit"]; quantity: number | null }[]> {
  if (useHttp()) return http("GET", "/expenses/suggestions");
  return mock(() => {
    const m = new Map<string, { count: number; e: Expense }>();
    for (const e of load().expenses) {
      const k = e.item_name.toLowerCase();
      const cur = m.get(k);
      if (!cur) m.set(k, { count: 1, e });
      else cur.count++;
    }
    return [...m.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 40)
      .map(({ e }) => ({ item_name: e.item_name, category_id: e.category_id, amount: e.amount, unit: e.unit, quantity: e.quantity }));
  }, 0);
}

// ---------------------------------------------------------------------------
// Dashboard / analytics / reports
// ---------------------------------------------------------------------------

/** GET /dashboard/stats */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (useHttp()) return http("GET", "/dashboard/stats");
  return mock(() => {
    const d = load();
    const t = todayISO();
    const [y, m] = t.split("-").map(Number);
    const budget = d.budgets.find((b) => b.year === y && b.month === m) ?? null;
    return computeDashboardStats(d.expenses, budget, t);
  });
}

/** GET /analytics?from=&to=&granularity= */
export async function getAnalytics(from: ISODate, to: ISODate, granularity: Granularity = "daily"): Promise<Analytics> {
  if (useHttp()) return http("GET", "/analytics", { query: { from, to, granularity } });
  return mock(() => computeAnalytics(load().expenses, load().categories, from, to, granularity), 380);
}

/** GET /reports?from=&to= — report summary + rows. Binary exports: GET /reports/export?format=pdf|excel|csv */
export async function getReports(from: ISODate, to: ISODate, title = "Expense Report"): Promise<Report> {
  if (useHttp()) return http("GET", "/reports", { query: { from, to, title } });
  return mock(() => buildReport(load().expenses, load().categories, from, to, title), 420);
}

/** GET /reports/export?format=pdf|excel|csv — server-built file. Returns null in mock mode (the browser builds it). */
export async function downloadReportFile(from: ISODate, to: ISODate, title: string, format: "pdf" | "excel" | "csv"): Promise<Blob | null> {
  if (!useHttp()) return null;
  return httpBlob("/reports/export", { from, to, title, format });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** GET /categories */
export async function getCategories(): Promise<Category[]> {
  if (useHttp()) return http("GET", "/categories");
  return mock(() => load().categories, 120);
}

/** POST /categories */
export async function createCategory(input: CategoryInput): Promise<Category> {
  if (useHttp()) {
    const c = await http<Category>("POST", "/categories", { body: input });
    emitChange();
    return c;
  }
  const res = await mock(() => {
    const d = load();
    if (d.categories.some((c) => c.name.toLowerCase() === input.name.trim().toLowerCase())) throw new ApiError(409, "Is naam ki category pehle se maujood hai.");
    const c: Category = { ...input, name: input.name.trim(), id: `c_${uid()}`, user_id: MOCK_USER_ID, created_at: new Date().toISOString() };
    d.categories.push(c);
    persist();
    return c;
  });
  emitChange();
  return res;
}

/** PATCH /categories/{id} */
export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
  if (useHttp()) {
    const c = await http<Category>("PATCH", `/categories/${id}`, { body: patch });
    emitChange();
    return c;
  }
  const res = await mock(() => {
    const d = load();
    const i = d.categories.findIndex((c) => c.id === id);
    if (i < 0) throw new ApiError(404, "Category not found");
    d.categories[i] = { ...d.categories[i], ...patch };
    persist();
    return d.categories[i];
  });
  emitChange();
  return res;
}

/** DELETE /categories/{id}?move_to={id} — expenses in the deleted category move to "Other" */
export async function deleteCategory(id: string): Promise<void> {
  if (useHttp()) {
    await http("DELETE", `/categories/${id}`);
    emitChange();
    return;
  }
  await mock(() => {
    const d = load();
    const other = d.categories.find((c) => c.icon === "other" && c.id !== id) ?? d.categories.find((c) => c.id !== id);
    d.expenses = d.expenses.map((e) => (e.category_id === id && other ? { ...e, category_id: other.id } : e));
    d.categories = d.categories.filter((c) => c.id !== id);
    persist();
  });
  emitChange();
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** GET /budgets/current */
export async function getBudget(): Promise<Budget | null> {
  if (useHttp()) return http("GET", "/budgets/current");
  return mock(() => {
    const [y, m] = todayISO().split("-").map(Number);
    return load().budgets.find((b) => b.year === y && b.month === m) ?? null;
  }, 120);
}

/** PUT /budgets/{year}/{month} */
export async function setBudget(amount: number): Promise<Budget> {
  const [year, month] = todayISO().split("-").map(Number);
  if (useHttp()) {
    const b = await http<Budget>("PUT", `/budgets/${year}/${month}`, { body: { amount } });
    emitChange();
    return b;
  }
  const res = await mock(() => {
    const d = load();
    const existing = d.budgets.find((b) => b.year === year && b.month === month);
    if (existing) existing.amount = amount;
    else d.budgets.push({ id: `b_${uid()}`, user_id: MOCK_USER_ID, amount, month, year });
    persist();
    return d.budgets.find((b) => b.year === year && b.month === month)!;
  });
  emitChange();
  return res;
}

// ---------------------------------------------------------------------------
// Data management
// ---------------------------------------------------------------------------

/** GET /export — everything the user owns */
export async function exportAllData(): Promise<DB> {
  if (useHttp()) return http("GET", "/export");
  return mock(() => load());
}

/** Resets the demo data (mock mode only). */
export async function resetDemoData(): Promise<void> {
  db = { expenses: buildMockExpenses(), categories: defaultCategories, budgets: [buildMockBudget()], user: load().user };
  // (kept for the demo account; see Settings → Data)
  persist();
  emitChange();
}

/** DELETE /expenses — clears all expenses (categories and budget stay). */
export async function clearAllExpenses(): Promise<void> {
  if (useHttp()) {
    await http("DELETE", "/expenses");
    emitChange();
    return;
  }
  load().expenses = [];
  persist();
  emitChange();
}

/** DELETE /me */
export async function deleteAccount(): Promise<void> {
  if (useHttp()) await http("DELETE", "/me");
  else {
    await sleep(500);
    storage.remove(KEY);
    db = null;
  }
  logout();
}
