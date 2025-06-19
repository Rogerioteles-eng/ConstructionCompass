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
import Diary from "@/pages/diary";
import Measurements from "@/pages/measurements";
import Schedule from "@/pages/schedule";
import Reports from "@/pages/reports";
import Employees from "@/pages/employees";
import EmployeeRegistration from "@/pages/employee-registration";
import EmployeeList from "@/pages/employee-list";
import EmployeesManagement from "@/pages/employees-management";
import EmployeeCosts from "@/pages/employee-costs";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/budget" component={Budget} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/diary" component={Diary} />
          <Route path="/measurements" component={Measurements} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/reports" component={Reports} />
          <Route path="/employees" component={Employees} />
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
