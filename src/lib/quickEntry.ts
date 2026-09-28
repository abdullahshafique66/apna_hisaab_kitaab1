import type { Unit } from "@/types";

/**
 * Rule-based quick-entry parser. No AI / network needed.
 *
 *   "Doodh 180"              → { item: "Doodh", amount: 180 }
 *   "Aloo 2kg 240"           → { item: "Aloo", quantity: 2, unit: "kg", amount: 240 }
 *   "Anday 1 dozen Rs 390"   → { item: "Anday", quantity: 1, unit: "dozen", amount: 390 }
 *   "Rs. 250 rickshaw"       → { item: "Rickshaw", amount: 250 }
 *   "chicken 1.5 kg 975"     → { item: "Chicken", quantity: 1.5, unit: "kg", amount: 975 }
 */

export interface ParsedEntry {
  item_name: string;
  quantity: number | null;
  unit: Unit | null;
  amount: number | null;
  category_key: string | null; // matches a default category icon key
}

const UNIT_ALIASES: Record<string, Unit> = {
  kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
  g: "gram", gm: "gram", gms: "gram", gram: "gram", grams: "gram", gr: "gram",
  l: "liter", lt: "liter", ltr: "liter", litre: "liter", liter: "liter", liters: "liter", litres: "liter",
  ml: "liter",
  dozen: "dozen", dz: "dozen", darjan: "dozen", darjen: "dozen",
  pc: "piece", pcs: "piece", piece: "piece", pieces: "piece", adad: "piece", x: "piece",
  pack: "pack", packs: "pack", packet: "pack", packets: "pack", pkt: "pack", dabba: "pack",
};

// Keyword → default category key. Roman Urdu + English.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  dairy: ["doodh", "milk", "dahi", "yogurt", "makhan", "butter", "cheese", "paneer", "lassi", "anday", "anda", "eggs", "egg", "cream", "khoya"],
  vegetables: ["aloo", "tamatar", "pyaz", "piyaz", "sabzi", "bhindi", "gobi", "palak", "lauki", "kaddu", "mirch", "adrak", "lehsan", "dhania", "matar", "gajar", "baingan", "karela", "shimla", "kheera", "salad", "potato", "tomato", "onion", "garlic", "ginger"],
  fruits: ["kela", "kele", "seb", "aam", "angoor", "malta", "kinoo", "anar", "amrood", "tarbooz", "kharbooza", "papita", "khajoor", "fruit", "phal", "banana", "apple", "mango", "grapes", "orange"],
  meat: ["chicken", "murgh", "gosht", "beef", "mutton", "qeema", "keema", "machli", "fish", "kaleji", "boti"],
  grocery: ["atta", "aata", "chawal", "rice", "cheeni", "sugar", "daal", "dal", "ghee", "oil", "tel", "namak", "salt", "masala", "chai", "patti", "tea", "besan", "maida", "sooji", "haldi", "mirchi", "bread", "double roti", "biscuit", "jam", "ketchup"],
  bills: ["bijli", "bill", "gas", "paani", "water", "internet", "wifi", "load", "mobile", "rent", "kiraya", "fees", "fee", "electricity", "ptcl"],
  transport: ["rickshaw", "careem", "uber", "indrive", "bykea", "bus", "petrol", "diesel", "fuel", "taxi", "qingqi", "chingchi", "metro", "parking", "fare", "kiraaya"],
  food: ["naan", "roti", "biryani", "samosa", "samosay", "pakoray", "pakora", "chaat", "burger", "pizza", "shawarma", "paratha", "halwa puri", "nihari", "haleem", "karahi", "tikka", "chai dhaba", "jalebi", "mithai", "restaurant", "hotel"],
  household: ["surf", "sabun", "soap", "shampoo", "detergent", "harpic", "brush", "toothpaste", "tissue", "bulb", "broom", "jharu", "phenyl", "dettol", "bartan", "dishwash", "vim"],
};

export function guessCategoryKey(text: string): string | null {
  const t = ` ${text.toLowerCase()} `;
  for (const [key, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => t.includes(` ${w} `) || t.includes(` ${w}s `))) return key;
  }
  return null;
}

const NUM = String.raw`\d+(?:[.,]\d+)?`;

function toNumber(s: string): number {
  return Number(s.replace(/,/g, ""));
}

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function parseQuickEntry(input: string): ParsedEntry {
  let text = ` ${input.trim().replace(/\s+/g, " ")} `;
  let quantity: number | null = null;
  let unit: Unit | null = null;
  let amount: number | null = null;

  // 1) Explicit money: "rs 240", "rs. 240", "240 rs", "rs240", "₨240", "pkr 240", "240/-"
  const moneyPatterns = [
    new RegExp(String.raw`\s(?:rs\.?|pkr|₨|rupay|rupees?)\s?(${NUM})\s`, "i"),
    new RegExp(String.raw`\s(${NUM})\s?(?:rs\.?|pkr|rupay|rupees?|\/-)\s`, "i"),
  ];
  for (const re of moneyPatterns) {
    const m = text.match(re);
    if (m) {
      amount = toNumber(m[1]);
      text = text.replace(m[0], " ");
      break;
    }
  }

  // 2) Quantity + unit: "2kg", "2 kg", "500g", "1.5 ltr", "1 dozen", "3 pcs", "x3"
  const unitWords = Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length).join("|");
  const qtyRe = new RegExp(String.raw`\s(${NUM})\s?(${unitWords})\.?\s`, "i");
  const qm = text.match(qtyRe);
  if (qm) {
    let q = toNumber(qm[1]);
    let u = UNIT_ALIASES[qm[2].toLowerCase()];
    if (qm[2].toLowerCase() === "ml") q = q / 1000; // normalise ml → liter
    quantity = q;
    unit = u;
    text = text.replace(qm[0], " ");
  } else {
    // "adha kilo" / "half kg" / "pao"
    const half = text.match(/\s(adha|aadha|half)\s(kg|kilo|liter|litre|ltr|dozen|darjan)\s/i);
    if (half) {
      quantity = 0.5;
      unit = UNIT_ALIASES[half[2].toLowerCase()];
      text = text.replace(half[0], " ");
    } else if (/\spao\s/i.test(text)) {
      quantity = 250;
      unit = "gram";
      text = text.replace(/\spao\s/i, " ");
    }
  }

  // 3) Remaining numbers: last one is the amount (if not yet found); a leading one before it is a bare quantity.
  const nums = [...text.matchAll(new RegExp(String.raw`\s(${NUM})(?=\s)`, "g"))];
  if (amount === null && nums.length) {
    const last = nums[nums.length - 1];
    amount = toNumber(last[1]);
    text = text.slice(0, last.index!) + " " + text.slice(last.index! + last[0].length);
  }
  const remainingNums = [...text.matchAll(new RegExp(String.raw`\s(${NUM})(?=\s)`, "g"))];
  if (quantity === null && remainingNums.length === 1) {
    quantity = toNumber(remainingNums[0][1]);
    unit = unit ?? "piece";
    text = text.replace(remainingNums[0][0], " ");
  }

  const item = titleCase(text.replace(/[-–—:,]+/g, " ").replace(/\s+/g, " ").trim());
  return {
    item_name: item,
    quantity,
    unit,
    amount,
    category_key: guessCategoryKey(input),
  };
}
