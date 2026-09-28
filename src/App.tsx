import { Suspense, useLayoutEffect, type ReactNode } from "react";
import { ErrorBoundary, lazyWithReload as lazy } from "@/components/ui/ErrorBoundary";
import { BrowserRouter, HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AppProvider, useApp } from "@/context/AppContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSkeleton } from "@/components/ui/States";
import { LogoMark } from "@/components/brand/Logo";
import LandingPage from "@/pages/LandingPage";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from "@/pages/auth/AuthPages";

// App pages are split so the landing page loads fast.
const DashboardPage = lazy(() => import("@/pages/app/DashboardPage"));
const ExpensesPage = lazy(() => import("@/pages/app/ExpensesPage"));
const DailyPage = lazy(() => import("@/pages/app/DailyPage"));
const AnalyticsPage = lazy(() => import("@/pages/app/AnalyticsPage"));
const ReportsPage = lazy(() => import("@/pages/app/ReportsPage"));
const CategoriesPage = lazy(() => import("@/pages/app/CategoriesPage"));
const BudgetPage = lazy(() => import("@/pages/app/BudgetPage"));
const SettingsPage = lazy(() => import("@/pages/app/SettingsPage"));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const page = (el: ReactNode) => <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>{el}</Suspense>;

function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg px-6 text-center">
      <LogoMark size={56} />
      <p className="num mt-6 text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Yeh safha nahi mila.</h1>
      <p className="mt-2 text-ink-muted">Link ghalat ho sakta hai ya safha hata diya gaya hai.</p>
      <Link to="/" className="btn-primary mt-6">
        Home par jayein
      </Link>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/dashboard" element={page(<DashboardPage />)} />
        <Route path="/expenses" element={page(<ExpensesPage />)} />
        <Route path="/daily" element={page(<DailyPage />)} />
        <Route path="/analytics" element={page(<AnalyticsPage />)} />
        <Route path="/reports" element={page(<ReportsPage />)} />
        <Route path="/categories" element={page(<CategoriesPage />)} />
        <Route path="/budget" element={page(<BudgetPage />)} />
        <Route path="/settings" element={page(<SettingsPage />)} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Hash routing for the single-file hosted preview; clean URLs for the real deployment.
const Router = __SINGLE__ ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router future={{ v7_relativeSplatPath: true }}>
        <ErrorBoundary>
        <ToastProvider>
          <AppProvider>
            <ScrollToTop />
            <AppRoutes />
          </AppProvider>
        </ToastProvider>
        </ErrorBoundary>
      </Router>
    </MotionConfig>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  // Jump (not smooth-scroll) to the top on every page change. Smooth scrolling from far down a long
  // page into a short page can leave mobile browsers showing an empty area until refresh.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    html.style.scrollBehavior = prev;
  }, [pathname]);
  return null;
}
