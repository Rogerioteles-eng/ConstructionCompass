import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Download, FileText, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
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

  // Fetch budgets for selected project
  const { data: budgets = [] } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/budgets`],
    enabled: isAuthenticated && !!selectedProject,
  });

  // Fetch budget structure and expenses for analysis
  const { data: budgetStructure } = useQuery({
    queryKey: [`/api/budgets/${selectedBudget}/structure`],
    enabled: isAuthenticated && !!selectedBudget,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/expenses`],
    enabled: isAuthenticated && !!selectedProject,
  });

  // Calculate budget vs actual analysis from real data
  const calculateBudgetAnalysis = () => {
    if (!budgetStructure?.stages || !Array.isArray(expenses)) {
      return { items: [], summary: { totalBudget: 0, totalActual: 0, variance: 0 } };
    }

    const items: any[] = [];
    let totalBudget = 0;
    let totalActual = 0;

    // Process each stage, item, and subitem
    budgetStructure.stages.forEach((stage: any) => {
      stage.items?.forEach((item: any) => {
        item.subitems?.forEach((subitem: any) => {
          const budgetAmount = parseFloat(subitem.unitPrice) * parseFloat(subitem.quantity);
          const actualExpenses = expenses.filter((expense: any) => 
            expense.subitemId === subitem.id
          );
          const actualAmount = actualExpenses.reduce((sum: number, expense: any) => 
            sum + parseFloat(expense.amount), 0
          );

          totalBudget += budgetAmount;
          totalActual += actualAmount;

          items.push({
            id: subitem.id,
            stage: stage.name,
            item: item.description,
            subitem: subitem.description,
            unit: subitem.unit,
            quantity: subitem.quantity,
            unitPrice: subitem.unitPrice,
            budgetAmount,
            actualAmount,
            variance: budgetAmount - actualAmount,
            progress: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0,
            expenseCount: actualExpenses.length
          });
        });
      });
    });

    return {
      items,
      summary: {
        totalBudget,
        totalActual,
        variance: totalBudget - totalActual
      }
    };
  };

  const budgetAnalysis = calculateBudgetAnalysis();

  // Prepare chart data from budget analysis
  const chartData = budgetAnalysis.items.slice(0, 10).map(item => ({
    name: item.subitem.length > 20 ? item.subitem.substring(0, 20) + '...' : item.subitem,
    orcado: item.budgetAmount,
    realizado: item.actualAmount,
    variance: item.variance
  }));

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
          subtitle="Análise Orçado vs Realizado"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Project and Budget Selection */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedProject} onValueChange={(value) => {
                setSelectedProject(value);
                setSelectedBudget(""); // Reset budget when project changes
              }}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(projects) && projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProject && (
                <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione um orçamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(budgets) && budgets.map((budget: any) => (
                      <SelectItem key={budget.id} value={budget.id.toString()}>
                        {budget.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => exportReport("Orçado vs Realizado")}
                disabled={!selectedBudget}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {!selectedProject ? (
            <Card className="p-8">
              <div className="text-center">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Análise Orçado vs Realizado
                </h3>
                <p className="text-gray-600">
                  Selecione uma obra para visualizar a comparação entre valores orçados e gastos reais
                </p>
              </div>
            </Card>
          ) : !selectedBudget ? (
            <Card className="p-8">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Selecione um Orçamento
                </h3>
                <p className="text-gray-600">
                  Escolha um orçamento para análise detalhada de orçado vs realizado
                </p>
              </div>
            </Card>
          ) : budgetAnalysis.items.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum Dado Disponível
                </h3>
                <p className="text-gray-600">
                  Este orçamento ainda não possui itens ou gastos vinculados para análise
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orçado</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(budgetAnalysis.summary.totalBudget)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Realizado</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(budgetAnalysis.summary.totalActual)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Variação</p>
                        <p className={`text-2xl font-bold ${getVarianceColor(budgetAnalysis.summary.variance)}`}>
                          {formatCurrency(Math.abs(budgetAnalysis.summary.variance))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {budgetAnalysis.summary.variance > 0 ? 'Economia' : 'Excesso'}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        budgetAnalysis.summary.variance > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {budgetAnalysis.summary.variance > 0 ? (
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">% Executado</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {budgetAnalysis.summary.totalBudget > 0 
                            ? ((budgetAnalysis.summary.totalActual / budgetAnalysis.summary.totalBudget) * 100).toFixed(1)
                            : '0'
                          }%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Budget vs Actual Chart */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparação Orçado vs Realizado por Item</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                          />
                          <YAxis tickFormatter={formatCurrencyCompact} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              formatCurrency(value), 
                              name === 'orcado' ? 'Orçado' : 'Realizado'
                            ]}
                          />
                          <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                          <Bar dataKey="realizado" fill="#f97316" name="Realizado" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada por Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Etapa</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Subitem</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-right">Orçado</TableHead>
                          <TableHead className="text-right">Realizado</TableHead>
                          <TableHead className="text-right">Variação</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetAnalysis.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.stage}</TableCell>
                            <TableCell>{item.item}</TableCell>
                            <TableCell>{item.subitem}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(parseFloat(item.unitPrice))}
                            </TableCell>
                            <TableCell className="text-right font-medium text-blue-600">
                              {formatCurrency(item.budgetAmount)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-600">
                              {formatCurrency(item.actualAmount)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${getVarianceColor(item.variance)}`}>
                              {formatCurrency(Math.abs(item.variance))}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Progress 
                                  value={Math.min(item.progress, 100)} 
                                  className="w-16 h-2"
                                />
                                <span className="text-xs text-gray-500">
                                  {item.progress.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
      
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}