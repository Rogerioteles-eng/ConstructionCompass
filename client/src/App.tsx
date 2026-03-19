import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import ManagePage from "@/pages/ManagePage";
import Finances from "@/pages/Finances";
import Reports from "@/pages/Reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Aguarda verificar se está logado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-600 text-xl font-semibold animate-pulse">
          Carregando...
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de auth
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Se estiver logado, mostra o sistema
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/manage" component={ManagePage} />
      <Route path="/finances" component={Finances} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;