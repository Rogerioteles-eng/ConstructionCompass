import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ruler, TrendingUp, Calendar, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeasurementSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { z } from "zod";

const measurementFormSchema = insertMeasurementSchema.omit({ createdBy: true, projectId: true, totalAmount: true });
type MeasurementFormData = z.infer<typeof measurementFormSchema>;

export default function Measurements() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
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

  const { data: budgets = [] } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/budgets`],
    enabled: isAuthenticated && !!selectedProject,
  });

  const { data: budgetStructure } = useQuery({
    queryKey: [`/api/budgets/${selectedBudget}/structure`],
    enabled: isAuthenticated && !!selectedBudget,
  });

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/measurements`],
    enabled: isAuthenticated && !!selectedProject,
  });

  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      executedQuantity: "",
      unitPrice: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MeasurementFormData) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProject}/measurements`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/measurements`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Medição registrada com sucesso",
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
        description: "Falha ao registrar medição",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MeasurementFormData) => {
    createMutation.mutate(data);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSubitemProgress = (subitemId: number) => {
    const subitemMeasurements = measurements.filter((m: any) => m.subitemId === subitemId);
    if (subitemMeasurements.length === 0) return 0;
    
    // Get total executed quantity for this subitem
    const totalExecuted = subitemMeasurements.reduce((sum: number, m: any) => 
      sum + parseFloat(m.executedQuantity), 0
    );
    
    // Find the subitem in budget structure to get planned quantity
    if (!budgetStructure) return 0;
    
    for (const stage of budgetStructure.stages || []) {
      for (const item of stage.items || []) {
        const subitem = item.subitems?.find((s: any) => s.id === subitemId);
        if (subitem) {
          const plannedQuantity = parseFloat(subitem.quantity);
          return Math.min(100, (totalExecuted / plannedQuantity) * 100);
        }
      }
    }
    return 0;
  };

  const getProjectProgress = () => {
    if (!budgetStructure || !budgetStructure.stages) return 0;
    
    let totalSubitems = 0;
    let completedSubitems = 0;
    
    budgetStructure.stages.forEach((stage: any) => {
      stage.items?.forEach((item: any) => {
        item.subitems?.forEach((subitem: any) => {
          totalSubitems++;
          const progress = getSubitemProgress(subitem.id);
          if (progress >= 100) completedSubitems++;
        });
      });
    });
    
    return totalSubitems > 0 ? (completedSubitems / totalSubitems) * 100 : 0;
  };

  const getTotalMeasuredValue = () => {
    return measurements.reduce((sum: number, m: any) => sum + parseFloat(m.totalAmount), 0);
  };

  const getAllSubitems = () => {
    if (!budgetStructure || !budgetStructure.stages) return [];
    
    const subitems: any[] = [];
    budgetStructure.stages.forEach((stage: any) => {
      stage.items?.forEach((item: any) => {
        item.subitems?.forEach((subitem: any) => {
          subitems.push({
            ...subitem,
            stageName: stage.name,
            itemName: item.name,
          });
        });
      });
    });
    
    return subitems;
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  const allSubitems = getAllSubitems();

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Medições"
          subtitle="Controle de progresso físico das obras"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Project and Budget Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecione uma Obra</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
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

            <Card>
              <CardHeader>
                <CardTitle>Selecione um Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedBudget} 
                  onValueChange={setSelectedBudget}
                  disabled={!selectedProject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um orçamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map((budget: any) => (
                      <SelectItem key={budget.id} value={budget.id.toString()}>
                        {budget.name} {budget.isActive && "(Ativo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {selectedProject && selectedBudget && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getProjectProgress().toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <Progress value={getProjectProgress()} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Valor Medido</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(getTotalMeasuredValue())}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Medições Registradas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {measurements.length}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center">
                        <Ruler className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Itens Concluídos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {allSubitems.filter(s => getSubitemProgress(s.id) >= 100).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-secondary rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add New Measurement */}
              <div className="flex justify-end mb-6">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="construction-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Medição
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Medição</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="subitemId">Item do Orçamento *</Label>
                        <Select
                          value={form.watch("subitemId")?.toString() || ""}
                          onValueChange={(value) => form.setValue("subitemId", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allSubitems.map((subitem) => (
                              <SelectItem key={subitem.id} value={subitem.id.toString()}>
                                {subitem.stageName} → {subitem.itemName} → {subitem.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.subitemId && (
                          <p className="text-sm text-red-500 mt-1">
                            Selecione um item
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="executedQuantity">Quantidade Executada *</Label>
                          <Input
                            id="executedQuantity"
                            type="number"
                            step="0.001"
                            {...form.register("executedQuantity")}
                            placeholder="0.000"
                          />
                          {form.formState.errors.executedQuantity && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.executedQuantity.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="unitPrice">Preço Unitário (R$) *</Label>
                          <Input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            {...form.register("unitPrice")}
                            placeholder="0.00"
                          />
                          {form.formState.errors.unitPrice && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.unitPrice.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="date">Data da Medição *</Label>
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
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          {...form.register("notes")}
                          placeholder="Observações sobre a medição..."
                          rows={3}
                        />
                      </div>

                      {/* Calculation Preview */}
                      {form.watch("executedQuantity") && form.watch("unitPrice") && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Valor Total:</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              parseFloat(form.watch("executedQuantity") || "0") * 
                              parseFloat(form.watch("unitPrice") || "0")
                            )}
                          </p>
                        </div>
                      )}

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

              {/* Progress by Stage */}
              {budgetStructure && budgetStructure.stages && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Progresso por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budgetStructure.stages.map((stage: any) => {
                        const stageSubitems = stage.items?.flatMap((item: any) => item.subitems || []) || [];
                        const completedItems = stageSubitems.filter((subitem: any) => 
                          getSubitemProgress(subitem.id) >= 100
                        ).length;
                        const stageProgress = stageSubitems.length > 0 
                          ? (completedItems / stageSubitems.length) * 100 
                          : 0;

                        return (
                          <div key={stage.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{stage.name}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  {completedItems}/{stageSubitems.length} concluídos
                                </span>
                                <span className="font-bold text-blue-600">
                                  {stageProgress.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <Progress value={stageProgress} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Measurements Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Medições</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-500">Carregando medições...</p>
                    </div>
                  ) : measurements.length === 0 ? (
                    <div className="text-center py-8">
                      <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma medição registrada
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Registre a primeira medição para acompanhar o progresso
                      </p>
                      <Button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="construction-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Primeira Medição
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qtd. Executada</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {measurements.map((measurement: any) => {
                            const subitem = allSubitems.find(s => s.id === measurement.subitemId);
                            return (
                              <TableRow key={measurement.id}>
                                <TableCell className="font-medium">
                                  {formatDate(measurement.date)}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <p className="font-medium truncate" title={subitem?.description}>
                                      {subitem?.description || "Item não encontrado"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {subitem?.stageName} → {subitem?.itemName}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {parseFloat(measurement.executedQuantity).toFixed(3)} {subitem?.unit}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(parseFloat(measurement.unitPrice))}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(parseFloat(measurement.totalAmount))}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs truncate" title={measurement.notes}>
                                    {measurement.notes || "-"}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
