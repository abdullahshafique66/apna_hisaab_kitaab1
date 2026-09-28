import { Suspense, type ComponentProps } from "react";
import { lazyWithReload as lazy } from "@/components/ui/ErrorBoundary";
import { LoadingSkeleton } from "@/components/ui/States";

// Charts are lazy-loaded so recharts stays out of the landing-page critical path.
const SpendingChartLazy = lazy(() => import("./SpendingChart"));
const CategoryChartLazy = lazy(() => import("./CategoryChart"));

export function SpendingChart(props: ComponentProps<typeof SpendingChartLazy>) {
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 260 }}><LoadingSkeleton variant="chart" /></div>}>
      <SpendingChartLazy {...props} />
    </Suspense>
  );
}
export function CategoryChart(props: ComponentProps<typeof CategoryChartLazy>) {
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 220 }}><LoadingSkeleton variant="chart" /></div>}>
      <CategoryChartLazy {...props} />
    </Suspense>
  );
}
