/**
 * Mock data — kept separate from UI and services.
 * Dates are generated relative to "today" so the app always opens in a realistic working state.
 * On 28 September 2026 this produces: Today Rs. 1,250 · Last 7 days Rs. 8,450 · September Rs. 32,450 · 48 entries.
 */
import type { Budget, Category, Expense, Unit, User } from "@/types";
import { addDays, todayISO } from "@/lib/utils";

export const MOCK_USER_ID = "u_demo";

export const mockUser: User = {
  id: MOCK_USER_ID,
  name: "Ayesha Khan",
  email: "ayesha@example.pk", // demo login (password: any 6+ chars in offline mode)
  avatar_url: null,
  created_at: "2026-06-02T09:00:00.000Z",
};

const created = "2026-06-02T09:00:00.000Z";
export const defaultCategories: Category[] = [
  { id: "c_grocery", user_id: MOCK_USER_ID, name: "Grocery", icon: "grocery", color: "#087F5B", created_at: created },
  { id: "c_vegetables", user_id: MOCK_USER_ID, name: "Vegetables", icon: "vegetables", color: "#5E9E3F", created_at: created },
  { id: "c_fruits", user_id: MOCK_USER_ID, name: "Fruits", icon: "fruits", color: "#E07A3F", created_at: created },
  { id: "c_dairy", user_id: MOCK_USER_ID, name: "Dairy", icon: "dairy", color: "#4A86C8", created_at: created },
  { id: "c_meat", user_id: MOCK_USER_ID, name: "Meat", icon: "meat", color: "#C4524E", created_at: created },
  { id: "c_food", user_id: MOCK_USER_ID, name: "Food", icon: "food", color: "#F4A340", created_at: created },
  { id: "c_bills", user_id: MOCK_USER_ID, name: "Bills", icon: "bills", color: "#7A66C4", created_at: created },
  { id: "c_transport", user_id: MOCK_USER_ID, name: "Transport", icon: "transport", color: "#2A9D96", created_at: created },
  { id: "c_household", user_id: MOCK_USER_ID, name: "Household", icon: "household", color: "#B08A3E", created_at: created },
  { id: "c_other", user_id: MOCK_USER_ID, name: "Other", icon: "other", color: "#86938C", created_at: created },
];

type Row = [offset: number, item: string, amount: number, cat: string, qty?: number, unit?: Unit, note?: string];

// Current month (offsets 0–27 → 28 Sep … 1 Sep)
const recentRows: Row[] = [
  // Today — Rs. 1,250
  [0, "Doodh", 180, "dairy", 1, "liter"],
  [0, "Aloo", 120, "vegetables", 2, "kg"],
  [0, "Tamatar", 150, "vegetables", 1, "kg"],
  [0, "Chicken", 650, "meat", 1, "kg"],
  [0, "Naan", 150, "food", 6, "piece", "Tandoor wale se"],
  // Rest of last 7 days — Rs. 7,200
  [1, "Doodh", 180, "dairy", 1, "liter"],
  [1, "Sabzi", 350, "vegetables", undefined, undefined, "Bhindi, palak, dhania"],
  [1, "Rickshaw", 250, "transport", undefined, undefined, "Bazaar aana jana"],
  [2, "Doodh", 180, "dairy", 1, "liter"],
  [2, "Atta", 1800, "grocery", 10, "kg"],
  [2, "Pyaz", 100, "vegetables", 1, "kg"],
  [3, "Doodh", 180, "dairy", 1, "liter"],
  [3, "Kele", 220, "fruits", 1, "dozen"],
  [3, "Rickshaw", 250, "transport"],
  [4, "Doodh", 180, "dairy", 1, "liter"],
  [4, "Dahi", 160, "dairy", 1, "kg"],
  [4, "Beef", 1100, "meat", 1, "kg"],
  [5, "Doodh", 180, "dairy", 1, "liter"],
  [5, "Chai Patti", 450, "grocery", 1, "pack"],
  [5, "Anday", 390, "dairy", 1, "dozen"],
  [6, "Doodh", 180, "dairy", 1, "liter"],
  [6, "Surf Excel", 650, "household", 1, "pack"],
  [6, "Samosay", 150, "food", 6, "piece"],
  [6, "Sabzi", 250, "vegetables"],
  // Earlier this month — Rs. 24,000
  [7, "Doodh", 180, "dairy", 1, "liter"],
  [7, "Bijli Bill", 5800, "bills", undefined, undefined, "LESCO — September"],
  [8, "Chicken", 650, "meat", 1, "kg"],
  [9, "Doodh", 180, "dairy", 1, "liter"],
  [9, "Chawal", 1250, "grocery", 5, "kg", "Basmati"],
  [10, "Gas Bill", 2400, "bills", undefined, undefined, "SNGPL"],
  [11, "Sabzi", 350, "vegetables"],
  [11, "Rickshaw", 250, "transport"],
  [12, "Doodh", 200, "dairy", 1, "liter", "Naya doodh wala"],
  [12, "Seb", 280, "fruits", 1, "kg"],
  [13, "Qeema", 1100, "meat", 1, "kg"],
  [14, "Cooking Oil", 2650, "grocery", 5, "liter"],
  [15, "Mobile Load", 500, "bills"],
  [16, "Doodh", 180, "dairy", 1, "liter"],
  [16, "Daal Masoor", 380, "grocery", 1, "kg"],
  [18, "Biryani", 700, "food", 2, "piece", "Friday dinner"],
  [19, "Chicken", 650, "meat", 1, "kg"],
  [20, "Internet Bill", 2500, "bills"],
  [21, "Petrol", 2000, "transport", 7, "liter"],
  [22, "Aam", 470, "fruits", 2, "kg"],
  [23, "Sabzi", 400, "vegetables"],
  [23, "Doodh", 180, "dairy", 1, "liter"],
  [25, "Cheeni", 300, "grocery", 2, "kg"],
  [27, "Sabun aur Shampoo", 450, "household"],
];

// Older history (offsets 28–95) generated deterministically for analytics / trends
const templates: [string, number, string, number | undefined, Unit | undefined][] = [
  ["Doodh", 180, "dairy", 1, "liter"],
  ["Doodh", 180, "dairy", 1, "liter"],
  ["Sabzi", 320, "vegetables", undefined, undefined],
  ["Aloo", 120, "vegetables", 2, "kg"],
  ["Tamatar", 160, "vegetables", 1, "kg"],
  ["Pyaz", 110, "vegetables", 1, "kg"],
  ["Chicken", 640, "meat", 1, "kg"],
  ["Rickshaw", 250, "transport", undefined, undefined],
  ["Naan", 150, "food", 6, "piece"],
  ["Dahi", 160, "dairy", 1, "kg"],
  ["Kele", 200, "fruits", 1, "dozen"],
  ["Anday", 380, "dairy", 1, "dozen"],
  ["Samosay", 150, "food", 6, "piece"],
  ["Aam", 450, "fruits", 2, "kg"],
];
const monthlyRows: [string, number, string, number | undefined, Unit | undefined, number][] = [
  // [item, amount, cat, qty, unit, day-of-cycle offset]
  ["Bijli Bill", 6400, "bills", undefined, undefined, 7],
  ["Gas Bill", 1900, "bills", undefined, undefined, 10],
  ["Internet Bill", 2500, "bills", undefined, undefined, 20],
  ["Atta", 1750, "grocery", 10, "kg", 3],
  ["Chawal", 1250, "grocery", 5, "kg", 12],
  ["Cooking Oil", 2600, "grocery", 5, "liter", 16],
  ["Petrol", 2000, "transport", 7, "liter", 21],
  ["Beef", 1100, "meat", 1, "kg", 14],
  ["Surf Excel", 620, "household", 1, "pack", 18],
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildMockExpenses(today = todayISO()): Expense[] {
  const out: Expense[] = [];
  let n = 0;
  const push = (offset: number, item: string, amount: number, cat: string, qty?: number | null, unit?: Unit, note?: string) => {
    const date = addDays(today, -offset);
    const ts = `${date}T${String(8 + (n % 12)).padStart(2, "0")}:${String((n * 7) % 60).padStart(2, "0")}:00.000Z`;
    out.push({
      id: `e_${String(++n).padStart(4, "0")}`,
      user_id: MOCK_USER_ID,
      item_name: item,
      quantity: qty ?? null,
      unit: qty ? unit ?? "piece" : null,
      amount,
      category_id: `c_${cat}`,
      date,
      note: note ?? null,
      created_at: ts,
      updated_at: ts,
    });
  };

  for (const [off, item, amt, cat, qty, unit, note] of recentRows) push(off, item, amt, cat, qty, unit, note);

  const r = rng(2026);
  for (let off = 28; off <= 95; off++) {
    const count = 1 + Math.floor(r() * 2.4);
    for (let i = 0; i < count; i++) {
      const [item, amt, cat, qty, unit] = templates[Math.floor(r() * templates.length)];
      const jitter = Math.round((r() - 0.5) * 0.16 * amt / 10) * 10;
      push(off, item, amt + jitter, cat, qty, unit);
    }
    for (const [item, amt, cat, qty, unit, cyc] of monthlyRows) {
      if ((off - 28) % 30 === cyc) push(off, item, amt + Math.round((r() - 0.5) * 300 / 10) * 10, cat, qty, unit);
    }
  }
  return out;
}

export function buildMockBudget(today = todayISO()): Budget {
  const [y, m] = today.split("-").map(Number);
  return { id: "b_current", user_id: MOCK_USER_ID, amount: 50000, month: m, year: y };
}
