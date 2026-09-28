// Frontend types mirroring the planned FastAPI / database models.
// Field names use snake_case so JSON from the backend maps 1:1.

export type ID = string;
export type ISODate = string; // "2026-09-28"
export type ISODateTime = string; // "2026-09-28T10:15:00.000Z"

export interface User {
  id: ID;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at: ISODateTime;
}

export const UNITS = ["piece", "kg", "gram", "liter", "dozen", "pack", "other"] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<Unit, string> = {
  piece: "Piece",
  kg: "Kg",
  gram: "Gram",
  liter: "Liter",
  dozen: "Dozen",
  pack: "Pack",
  other: "Other",
};

export interface Expense {
  id: ID;
  user_id: ID;
  item_name: string;
  quantity: number | null;
  unit: Unit | null;
  amount: number; // PKR, whole rupees
  category_id: ID;
  date: ISODate;
  note: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type ExpenseInput = Pick<Expense, "item_name" | "quantity" | "unit" | "amount" | "category_id" | "date" | "note">;

export type CategoryIcon =
  | "grocery" | "vegetables" | "fruits" | "dairy" | "meat" | "food"
  | "bills" | "transport" | "household" | "other" | "health" | "education" | "gift" | "phone";

export interface Category {
  id: ID;
  user_id: ID;
  name: string;
  icon: CategoryIcon;
  color: string; // hex, used for charts and chips
  created_at: ISODateTime;
}

export type CategoryInput = Pick<Category, "name" | "icon" | "color">;

export interface Budget {
  id: ID;
  user_id: ID;
  amount: number;
  month: number; // 1-12
  year: number;
}

// ---------- Query / response shapes ----------

export type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "name_asc";

export interface ExpenseQuery {
  search?: string;
  category_id?: ID | "all";
  from?: ISODate;
  to?: ISODate;
  min_amount?: number;
  max_amount?: number;
  sort?: SortKey;
  page?: number;
  page_size?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_amount: number;
}

export interface DashboardStats {
  today: number;
  yesterday: number;
  week: number;
  last_week: number;
  month: number;
  last_month: number;
  total_entries: number;
  month_entries: number;
  budget: Budget | null;
}

export type Granularity = "daily" | "weekly" | "monthly";

export interface SeriesPoint {
  key: string; // bucket key e.g. 2026-09-28
  label: string; // display label e.g. "28 Sep"
  total: number;
}

export interface CategoryTotal {
  category_id: ID;
  name: string;
  color: string;
  icon: CategoryIcon;
  total: number;
  count: number;
  share: number; // 0..1
}

export interface Analytics {
  from: ISODate;
  to: ISODate;
  total: number;
  count: number;
  average_per_day: number;
  series: SeriesPoint[];
  by_category: CategoryTotal[];
  top_items: { item_name: string; total: number; count: number }[];
}

export type ReportFormat = "pdf" | "excel" | "csv";

export interface Report {
  title: string;
  period_label: string;
  from: ISODate;
  to: ISODate;
  total_items: number;
  total_expense: number;
  by_category: CategoryTotal[];
  expenses: Expense[];
  generated_at: ISODateTime;
}

export type ThemePref = "system" | "light" | "dark";
export type DateFormatPref = "dd MMM yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd";

export interface Preferences {
  theme: ThemePref;
  currency: "PKR";
  date_format: DateFormatPref;
}
