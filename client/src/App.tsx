import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth"; // Mantemos para não quebrar dependências
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

// Importando as outras páginas para garantir que o código compila
import ManagePage from "@/pages/ManagePage";
import Finances from "@/pages/Finances";
import Reports from "@/pages/Reports";

function Router() {
  const { isAuthenticated, user } = useAuth();

  // DEBUG: Vamos ver o que o sistema está "pensando"
  console.log("Status do Usuário:", { isAuthenticated, user });

  // SE NÃO TIVER USUÁRIO, MOSTRA A LANDING (LOGIN)
  // Forçamos a verificação visual aqui
  if (!user) {
    return <Landing />;
  }

  // SE TIVER USUÁRIO, MOSTRA O DASHBOARD
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/manage" component={ManagePage} />
      <Route path="/finances" component={Finances} />
      <Route path="/reports" component={Reports} />
      
      {/* Se não achar nada, cai no 404 */}
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