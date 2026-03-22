import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import AuthPage from "@/pages/auth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import ManagePage from "@/pages/ManagePage";
import Finances from "@/pages/Finances";
import Reports from "@/pages/Reports";
import ProjectLayout from "@/layouts/ProjectLayout";
import Suppliers from "@/pages/suppliers";
import Quotations from "@/pages/quotations";
import Registers from "@/pages/registers";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-600 text-xl font-semibold animate-pulse">
          Carregando...
        </div>
      </div>
    );
  }

  // NÃO autenticado
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // Autenticado
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/finances" element={<Finances />} />
      <Route path="/reports" element={<Reports />} />
      
      {/* Rotas agrupadas dentro do Layout do Projeto */}
      <Route path="/projects/:projectId" element={<ProjectLayout />}>
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="registers" element={<Registers />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;