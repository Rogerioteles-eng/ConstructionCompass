import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, DollarSign, Receipt, Users, TrendingUp, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import ProjectCard from "@/components/project-card";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Mock data for charts
  const budgetData = [
    { month: 'Jan', orcado: 400000, executado: 380000 },
    { month: 'Fev', orcado: 380000, executado: 375000 },
    { month: 'Mar', orcado: 420000, executado: 395000 },
    { month: 'Abr', orcado: 450000, executado: 430000 },
    { month: 'Mai', orcado: 390000, executado: 385000 },
    { month: 'Jun', orcado: 410000, executado: 395000 },
  ];

  const expenseData = [
    { month: 'Jan', gastos: 120000 },
    { month: 'Fev', gastos: 135000 },
    { month: 'Mar', gastos: 140000 },
    { month: 'Abr', gastos: 155000 },
    { month: 'Mai', gastos: 148000 },
    { month: 'Jun', gastos: 160000 },
  ];

  const statusData = [
    { name: 'Em Execução', value: 8, color: '#22c55e' },
    { name: 'Planejamento', value: 3, color: '#3b82f6' },
    { name: 'Pausadas', value: 1, color: '#f59e0b' },
    { name: 'Concluídas', value: 2, color: '#6b7280' },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'success',
      title: 'Etapa de fundação concluída',
      description: 'Residencial São Paulo - há 2 horas',
      icon: CheckCircle,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Atraso na entrega de material',
      description: 'Centro Comercial Norte - há 4 horas',
      icon: AlertTriangle,
    },
    {
      id: 3,
      type: 'info',
      title: 'Novo funcionário adicionado',
      description: 'José Santos - Pedreiro - há 6 horas',
      icon: Plus,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          subtitle="Visão geral das suas obras"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Obras Ativas</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.activeProjects || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+8%</span>
                  <span className="text-gray-500 ml-2">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Orçamento Total</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? "..." : formatCurrencyCompact(stats?.totalBudget || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+15%</span>
                  <span className="text-gray-500 ml-2">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gastos do Mês</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? "..." : formatCurrencyCompact(stats?.monthlyExpenses || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">+12%</span>
                  <span className="text-gray-500 ml-2">acima do previsto</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Funcionários</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.totalWorkers || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 construction-secondary rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">+3</span>
                  <span className="text-gray-500 ml-2">novos contratados</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Obras em Andamento</CardTitle>
                <Button 
                  onClick={() => navigate("/projects")}
                  className="construction-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Obra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 6).map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onView={(id) => navigate(`/projects/${id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Budget vs Expenses Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Orçado vs Executado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => formatCurrencyCompact(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                    <Bar dataKey="executado" fill="#f97316" name="Executado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status das Obras</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expenses Chart */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Gastos Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => formatCurrencyCompact(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gastos" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      name="Gastos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  const colorClasses = {
                    success: 'construction-success',
                    warning: 'construction-warning',
                    info: 'construction-primary',
                  };
                  
                  return (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[activity.type as keyof typeof colorClasses]}`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
