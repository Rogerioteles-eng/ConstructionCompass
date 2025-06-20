import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Budget from "@/pages/budget";
import Expenses from "@/pages/expenses";
import Measurements from "@/pages/measurements";
import Schedule from "@/pages/schedule";
import EmployeeRegistration from "@/pages/employee-registration";
import EmployeeList from "@/pages/employee-list";
import EmployeesManagement from "@/pages/employees-management";
import EmployeeCosts from "@/pages/employee-costs";

// New layout-based pages
import ManagePage from "@/pages/ManagePage";
import Finances from "@/pages/Finances";
import Reports from "@/pages/Reports";

// Project-specific pages with new layout
import Diary from "@/pages/projects/[id]/diary";
import Employees from "@/pages/projects/[id]/employees";
import Share from "@/pages/projects/[id]/share";
import Suppliers from "@/pages/projects/[id]/suppliers";
import Quotations from "@/pages/projects/[id]/quotations";
import Registers from "@/pages/projects/[id]/registers";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Main Dashboard - shows project list */}
          <Route path="/" component={Dashboard} />
          
          {/* Main navigation sections */}
          <Route path="/manage" component={ManagePage} />
          <Route path="/finances" component={Finances} />
          <Route path="/reports" component={Reports} />
          
          {/* Project-specific routes with new layout */}
          <Route path="/projects/:id/diary" component={Diary} />
          <Route path="/projects/:id/employees" component={Employees} />
          <Route path="/projects/:id/share" component={Share} />
          <Route path="/projects/:id/suppliers" component={Suppliers} />
          <Route path="/projects/:id/quotations" component={Quotations} />
          <Route path="/projects/:id/registers" component={Registers} />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/projects" component={Projects} />
          <Route path="/budget" component={Budget} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/measurements" component={Measurements} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/employees" component={EmployeesManagement} />
          <Route path="/employee-registration" component={EmployeeRegistration} />
          <Route path="/employee-list" component={EmployeeList} />
          <Route path="/employee-costs" component={EmployeeCosts} />
          <Route path="/employees-management" component={EmployeesManagement} />
        </>
      )}
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
