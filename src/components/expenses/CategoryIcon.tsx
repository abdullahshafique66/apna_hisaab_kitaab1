import {
  Apple, Beef, Car, Carrot, Gift, GraduationCap, HeartPulse, Home, Milk, Package, ReceiptText,
  ShoppingBasket, Smartphone, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import type { Category, CategoryIcon as IconKey } from "@/types";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: Record<IconKey, LucideIcon> = {
  grocery: ShoppingBasket,
  vegetables: Carrot,
  fruits: Apple,
  dairy: Milk,
  meat: Beef,
  food: UtensilsCrossed,
  bills: ReceiptText,
  transport: Car,
  household: Home,
  other: Package,
  health: HeartPulse,
  education: GraduationCap,
  gift: Gift,
  phone: Smartphone,
};

export const ICON_CHOICES = Object.keys(CATEGORY_ICONS) as IconKey[];

export const CATEGORY_COLORS = ["#087F5B", "#5E9E3F", "#E07A3F", "#4A86C8", "#C4524E", "#F4A340", "#7A66C4", "#2A9D96", "#B08A3E", "#86938C", "#D0607F", "#3F6E9E"];

export function CategoryIcon({
  category, icon, color, size = "md", className,
}: {
  category?: Pick<Category, "icon" | "color"> | null;
  icon?: IconKey;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const key = icon ?? category?.icon ?? "other";
  const c = color ?? category?.color ?? "#86938C";
  const Icon = CATEGORY_ICONS[key] ?? Package;
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";
  const ic = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", box, className)} style={{ backgroundColor: `${c}1F`, color: c }} aria-hidden>
      <Icon className={ic} strokeWidth={2} />
    </span>
  );
}

export function CategoryChip({ category }: { category?: Category | null }) {
  if (!category) return null;
  return (
    <span className="chip whitespace-nowrap text-ink" style={{ backgroundColor: `${category.color}1A` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  );
}
