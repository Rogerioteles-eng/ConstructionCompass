import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Receipt, Search, Filter, Calendar, DollarSign, FileText, Trash2, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.omit({ createdBy: true, projectId: true });
type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export default function Expenses() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedSubitem, setSelectedSubitem] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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

  // Fetch budget structure (stages, items, subitems) for selected budget
  const { data: budgetStructure } = useQuery({
    queryKey: [`/api/budgets/${selectedBudget}/structure`],
    enabled: isAuthenticated && !!selectedBudget,
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/expenses`],
    enabled: isAuthenticated && !!selectedProject,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      amount: "",
      receiptUrl: "",
      subitemId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProject}/expenses`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Gasto registrado com sucesso",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao registrar gasto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createMutation.mutate(data);
  };

  const filteredExpenses = expenses.filter((expense: any) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || expense.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum: number, expense: any) => 
    sum + parseFloat(expense.amount), 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Gastos"
          subtitle="Controle de despesas das obras"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Project Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecione uma Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Escolha uma obra..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} - {project.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProject && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Gastos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(totalExpenses)}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-error rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nº de Gastos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {filteredExpenses.length}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Média por Gasto</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {filteredExpenses.length > 0 
                            ? formatCurrency(totalExpenses / filteredExpenses.length)
                            : formatCurrency(0)
                          }
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Add Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="construction-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Registrar Novo Gasto</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="date">Data *</Label>
                        <Input
                          id="date"
                          type="date"
                          {...form.register("date")}
                        />
                        {form.formState.errors.date && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição *</Label>
                        <Textarea
                          id="description"
                          {...form.register("description")}
                          placeholder="Ex: Compra de cimento"
                          rows={3}
                        />
                        {form.formState.errors.description && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.description.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="amount">Valor (R$) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          {...form.register("amount")}
                          placeholder="0.00"
                        />
                        {form.formState.errors.amount && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.amount.message}
                          </p>
                        )}
                      </div>

                      {/* Budget Hierarchy Selection */}
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700">Vincular ao Orçamento (Opcional)</h4>
                        
                        {/* Budget Selection */}
                        <div>
                          <Label htmlFor="budget">Orçamento</Label>
                          <Select value={selectedBudget} onValueChange={(value) => {
                            setSelectedBudget(value);
                            setSelectedStage("");
                            setSelectedItem("");
                            setSelectedSubitem("");
                          }}>
                            <SelectTrigger>
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
                        </div>

                        {/* Stage Selection */}
                        {selectedBudget && budgetStructure?.stages && (
                          <div>
                            <Label htmlFor="stage">Etapa</Label>
                            <Select value={selectedStage} onValueChange={(value) => {
                              setSelectedStage(value);
                              setSelectedItem("");
                              setSelectedSubitem("");
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma etapa" />
                              </SelectTrigger>
                              <SelectContent>
                                {budgetStructure.stages.map((stage: any) => (
                                  <SelectItem key={stage.id} value={stage.id.toString()}>
                                    {stage.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Item Selection */}
                        {selectedStage && budgetStructure?.stages && (
                          <div>
                            <Label htmlFor="item">Item</Label>
                            <Select value={selectedItem} onValueChange={(value) => {
                              setSelectedItem(value);
                              setSelectedSubitem("");
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um item" />
                              </SelectTrigger>
                              <SelectContent>
                                {budgetStructure.stages
                                  .find((stage: any) => stage.id.toString() === selectedStage)
                                  ?.items?.map((item: any) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.description}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Subitem Selection */}
                        {selectedItem && budgetStructure?.stages && (
                          <div>
                            <Label htmlFor="subitem">Subitem</Label>
                            <Select value={selectedSubitem} onValueChange={(value) => {
                              setSelectedSubitem(value);
                              form.setValue("subitemId", value ? parseInt(value) : undefined);
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um subitem" />
                              </SelectTrigger>
                              <SelectContent>
                                {budgetStructure.stages
                                  .find((stage: any) => stage.id.toString() === selectedStage)
                                  ?.items?.find((item: any) => item.id.toString() === selectedItem)
                                  ?.subitems?.map((subitem: any) => (
                                    <SelectItem key={subitem.id} value={subitem.id.toString()}>
                                      {subitem.description} - {subitem.unit}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Selected Item Summary */}
                        {selectedSubitem && budgetStructure?.stages && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Item selecionado:</strong> {
                                budgetStructure.stages
                                  .find((stage: any) => stage.id.toString() === selectedStage)
                                  ?.items?.find((item: any) => item.id.toString() === selectedItem)
                                  ?.subitems?.find((subitem: any) => subitem.id.toString() === selectedSubitem)
                                  ?.description
                              }
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Este gasto será vinculado ao item do orçamento para análise de orçado vs realizado
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="receiptUrl">URL do Comprovante</Label>
                        <Input
                          id="receiptUrl"
                          {...form.register("receiptUrl")}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMutation.isPending}
                          className="construction-primary"
                        >
                          {createMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Expenses Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-500">Carregando gastos...</p>
                    </div>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || dateFilter ? "Nenhum gasto encontrado" : "Nenhum gasto registrado"}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm || dateFilter 
                          ? "Tente ajustar os filtros de busca"
                          : "Registre o primeiro gasto desta obra"
                        }
                      </p>
                      {!searchTerm && !dateFilter && (
                        <Button 
                          onClick={() => setIsCreateDialogOpen(true)}
                          className="construction-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Primeiro Gasto
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Item do Orçamento</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Comprovante</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredExpenses.map((expense: any) => (
                            <TableRow key={expense.id}>
                              <TableCell className="font-medium">
                                {formatDate(expense.date)}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate" title={expense.description}>
                                  {expense.description}
                                </div>
                              </TableCell>
                              <TableCell>
                                {expense.subitemId ? (
                                  <Badge variant="outline" className="text-xs">
                                    Item #{expense.subitemId}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm">Não vinculado</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(parseFloat(expense.amount))}
                              </TableCell>
                              <TableCell className="text-center">
                                {expense.receiptUrl ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(expense.receiptUrl, '_blank')}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 text-sm">Sem comprovante</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center space-x-1">
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Summary */}
              {filteredExpenses.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Resumo Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            filteredExpenses
                              .filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth())
                              .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
                          )}
                        </p>
                        <p className="text-sm text-gray-500">Este Mês</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            filteredExpenses
                              .filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth() - 1)
                              .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
                          )}
                        </p>
                        <p className="text-sm text-gray-500">Mês Anterior</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(totalExpenses / Math.max(1, new Set(filteredExpenses.map((e: any) => e.date.slice(0, 7))).size))}
                        </p>
                        <p className="text-sm text-gray-500">Média Mensal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
