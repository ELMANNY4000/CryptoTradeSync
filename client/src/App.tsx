import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Markets from "@/pages/markets";
import Trade from "@/pages/trade";
import Wallets from "@/pages/wallets";
import Admin from "@/pages/admin";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import KYC from "@/pages/kyc";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { AppShell } from "@/components/layout/app-shell";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    navigate("/auth/login");
    return null;
  }
  
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAdmin) {
    navigate("/");
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/markets" component={() => <ProtectedRoute component={Markets} />} />
      <Route path="/trade" component={() => <ProtectedRoute component={Trade} />} />
      <Route path="/wallets" component={() => <ProtectedRoute component={Wallets} />} />
      <Route path="/kyc" component={() => <ProtectedRoute component={KYC} />} />
      <Route path="/admin" component={() => <AdminRoute component={Admin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  // Don't wrap auth pages in AppShell
  if (location.startsWith("/auth/")) {
    return <Router />;
  }
  
  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
