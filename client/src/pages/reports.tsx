import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, Building, FileText, Download, Calendar, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ["/api/projects/expenses/all"],
    enabled: false, // Would need endpoint for all expenses
  });

  // Mock data for comprehensive reports - in real app this would come from API
  const budgetVsExecutionData = [
    { month: 'Jan', orcado: 400000, executado: 380000, economia: 20000 },
    { month: 'Fev', orcado: 380000, executado: 375000, economia: 5000 },
    { month: 'Mar', orcado: 420000, executado: 410000, economia: 10000 },
    { month: 'Abr', orcado: 450000, executado: 460000, economia: -10000 },
    { month: 'Mai', orcado: 390000, executado: 385000, economia: 5000 },
    { month: 'Jun', orcado: 410000, executado: 395000, economia: 15000 },
  ];

  const expensesByCategory = [
    { name: 'Material', value: 450000, color: '#3b82f6' },
    { name: 'Mão de Obra', value: 280000, color: '#f97316' },
    { name: 'Equipamentos', value: 120000, color: '#22c55e' },
    { name: 'Outros', value: 80000, color: '#f59e0b' },
  ];

  const productivityData = [
    { worker: 'João Silva', completed: 28, planned: 30, efficiency: 93.3 },
    { worker: 'Pedro Santos', completed: 25, planned: 30, efficiency: 83.3 },
    { worker: 'Carlos Oliveira', completed: 30, planned: 30, efficiency: 100 },
    { worker: 'Ana Costa', completed: 22, planned: 25, efficiency: 88 },
    { worker: 'José Lima', completed: 27, planned: 30, efficiency: 90 },
  ];

  const projectPerformance = [
    { project: 'Residencial São Paulo', budget: 800000, spent: 750000, progress: 85, efficiency: 113.3 },
    { project: 'Centro Comercial Norte', budget: 1200000, spent: 950000, progress: 65, efficiency: 82.1 },
    { project: 'Galpão Industrial Sul', budget: 600000, spent: 180000, progress: 25, efficiency: 83.3 },
  ];

  const monthlyTrends = [
    { month: 'Jan', gastos: 380000, receita: 420000, lucro: 40000 },
    { month: 'Fev', gastos: 375000, receita: 410000, lucro: 35000 },
    { month: 'Mar', gastos: 410000, receita: 450000, lucro: 40000 },
    { month: 'Abr', gastos: 460000, receita: 480000, lucro: 20000 },
    { month: 'Mai', gastos: 385000, receita: 430000, lucro: 45000 },
    { month: 'Jun', gastos: 395000, receita: 440000, lucro: 45000 },
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

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return TrendingUp;
    if (variance < 0) return TrendingDown;
    return null;
  };

  const exportReport = (reportType: string) => {
    toast({
      title: "Relatório Exportado",
      description: `Relatório de ${reportType} foi exportado com sucesso`,
    });
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Relatórios"
          subtitle="Análise e métricas das obras"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Obras</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => exportReport("Completo")}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button 
                variant="outline"
                onClick={() => exportReport("Excel")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="productivity">Produtividade</TabsTrigger>
              <TabsTrigger value="projects">Projetos</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Obras Ativas</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {dashboardStats?.activeProjects || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+8%</span>
                      <span className="text-gray-500 ml-2">vs período anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Receita Total</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCurrencyCompact(2630000)}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+12%</span>
                      <span className="text-gray-500 ml-2">vs período anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
                        <p className="text-3xl font-bold text-gray-900">18.5%</p>
                      </div>
                      <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">-2%</span>
                      <span className="text-gray-500 ml-2">vs período anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Eficiência Média</p>
                        <p className="text-3xl font-bold text-gray-900">91.2%</p>
                      </div>
                      <div className="w-12 h-12 construction-secondary rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+5%</span>
                      <span className="text-gray-500 ml-2">vs período anterior</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Orçado vs Executado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetVsExecutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrencyCompact(value)} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                        <Bar dataKey="executado" fill="#f97316" name="Executado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gastos por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {expensesByCategory.map((entry, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-gray-600">{entry.name}</span>
                          <span className="ml-auto font-medium">{formatCurrencyCompact(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise Financeira Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrencyCompact(value)} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="receita" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Receita" />
                      <Area type="monotone" dataKey="gastos" stackId="2" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Gastos" />
                      <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Variação Orçamentária</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budgetVsExecutionData.map((item, index) => {
                        const variance = item.economia;
                        const VarianceIcon = getVarianceIcon(variance);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{item.month}</p>
                              <p className="text-sm text-gray-500">
                                Orçado: {formatCurrency(item.orcado)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={cn("flex items-center", getVarianceColor(variance))}>
                                {VarianceIcon && <VarianceIcon className="h-4 w-4 mr-1" />}
                                <span className="font-medium">
                                  {formatCurrency(Math.abs(variance))}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {variance > 0 ? "Economia" : "Acima do orçado"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">ROI Médio</span>
                          <span className="font-bold text-green-600">24.5%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Margem Bruta</span>
                          <span className="font-bold text-blue-600">32.1%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Fluxo de Caixa</span>
                          <span className="font-bold text-purple-600">Positivo</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3">Próximos Recebimentos</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Residencial São Paulo</span>
                            <span className="font-medium">{formatCurrency(150000)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Centro Comercial Norte</span>
                            <span className="font-medium">{formatCurrency(200000)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Productivity Tab */}
            <TabsContent value="productivity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produtividade da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead className="text-center">Tarefas Concluídas</TableHead>
                          <TableHead className="text-center">Tarefas Planejadas</TableHead>
                          <TableHead className="text-center">Eficiência</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productivityData.map((worker, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{worker.worker}</TableCell>
                            <TableCell className="text-center">{worker.completed}</TableCell>
                            <TableCell className="text-center">{worker.planned}</TableCell>
                            <TableCell className="text-center">
                              <span className={cn(
                                "font-medium",
                                worker.efficiency >= 95 ? "text-green-600" : 
                                worker.efficiency >= 85 ? "text-yellow-600" : "text-red-600"
                              )}>
                                {worker.efficiency.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={
                                worker.efficiency >= 95 ? "default" : 
                                worker.efficiency >= 85 ? "secondary" : "destructive"
                              }>
                                {worker.efficiency >= 95 ? "Excelente" : 
                                 worker.efficiency >= 85 ? "Bom" : "Precisa Melhorar"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Eficiência por Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { period: 'Sem 1', efficiency: 88 },
                        { period: 'Sem 2', efficiency: 92 },
                        { period: 'Sem 3', efficiency: 85 },
                        { period: 'Sem 4', efficiency: 91 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[80, 100]} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Horas Trabalhadas vs Produtividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900">Horas Regulares</p>
                          <p className="text-sm text-green-600">8h/dia - Eficiência: 95%</p>
                        </div>
                        <div className="text-2xl font-bold text-green-600">176h</div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-yellow-900">Horas Extras</p>
                          <p className="text-sm text-yellow-600">+2h/dia - Eficiência: 78%</p>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">24h</div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-900">Total do Mês</p>
                          <p className="text-sm text-blue-600">Eficiência Média: 91%</p>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">200h</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance dos Projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Projeto</TableHead>
                          <TableHead className="text-right">Orçamento</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-center">Progresso</TableHead>
                          <TableHead className="text-center">Eficiência</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectPerformance.map((project, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{project.project}</TableCell>
                            <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(project.spent)}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{project.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn(
                                "font-medium",
                                project.efficiency >= 100 ? "text-green-600" : 
                                project.efficiency >= 90 ? "text-yellow-600" : "text-red-600"
                              )}>
                                {project.efficiency.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={
                                project.efficiency >= 100 ? "default" : 
                                project.efficiency >= 90 ? "secondary" : "destructive"
                              }>
                                {project.efficiency >= 100 ? "No Prazo" : 
                                 project.efficiency >= 90 ? "Atenção" : "Atrasado"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Recursos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Residencial São Paulo', value: 40, color: '#3b82f6' },
                            { name: 'Centro Comercial Norte', value: 35, color: '#f97316' },
                            { name: 'Galpão Industrial Sul', value: 25, color: '#22c55e' },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={(entry) => `${entry.value}%`}
                        >
                          {[
                            { name: 'Residencial São Paulo', value: 40, color: '#3b82f6' },
                            { name: 'Centro Comercial Norte', value: 35, color: '#f97316' },
                            { name: 'Galpão Industrial Sul', value: 25, color: '#22c55e' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cronograma vs Realizado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { project: 'Res. SP', planejado: 85, realizado: 85 },
                        { project: 'Com. Norte', planejado: 75, realizado: 65 },
                        { project: 'Ind. Sul', planejado: 30, realizado: 25 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="project" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Bar dataKey="planejado" fill="#e5e7eb" name="Planejado" />
                        <Bar dataKey="realizado" fill="#3b82f6" name="Realizado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendências e Previsões</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={[
                      { month: 'Jan', receita: 420000, gasto: 380000, previsao: 450000 },
                      { month: 'Fev', receita: 410000, gasto: 375000, previsao: 440000 },
                      { month: 'Mar', receita: 450000, gasto: 410000, previsao: 480000 },
                      { month: 'Abr', receita: 480000, gasto: 460000, previsao: 510000 },
                      { month: 'Mai', receita: 430000, gasto: 385000, previsao: 460000 },
                      { month: 'Jun', receita: 440000, gasto: 395000, previsao: 470000 },
                      { month: 'Jul', receita: null, gasto: null, previsao: 490000 },
                      { month: 'Ago', receita: null, gasto: null, previsao: 520000 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrencyCompact(value)} />
                      <Tooltip formatter={(value: number) => value ? formatCurrency(value) : 'N/A'} />
                      <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={3} name="Receita" />
                      <Line type="monotone" dataKey="gasto" stroke="#f97316" strokeWidth={3} name="Gastos" />
                      <Line type="monotone" dataKey="previsao" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Previsão" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Previsão de Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">+18%</div>
                      <p className="text-gray-600 mb-4">Crescimento previsto nos próximos 6 meses</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Receita</span>
                          <span className="font-medium text-green-600">+22%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Projetos</span>
                          <span className="font-medium text-blue-600">+15%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Equipe</span>
                          <span className="font-medium text-purple-600">+12%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Alerta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                        <div>
                          <p className="font-medium text-red-900">Custos Elevados</p>
                          <p className="text-sm text-red-600">Material subiu 8%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-500 mr-3" />
                        <div>
                          <p className="font-medium text-yellow-900">Atraso Potencial</p>
                          <p className="text-sm text-yellow-600">Projeto Norte: 5 dias</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Users className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium text-blue-900">Capacidade Limitada</p>
                          <p className="text-sm text-blue-600">95% da equipe alocada</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Oportunidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-1">Novos Contratos</h4>
                        <p className="text-sm text-green-600">2 propostas em análise - R$ 1.2M</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Otimização</h4>
                        <p className="text-sm text-blue-600">Economia de 12% com novos fornecedores</p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-1">Expansão</h4>
                        <p className="text-sm text-purple-600">Novo mercado: obras industriais</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
