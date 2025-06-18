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
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle, PlayCircle, PauseCircle, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduleItemSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { SCHEDULE_STATUS, SCHEDULE_STATUS_COLORS } from "@/lib/constants";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { cn } from "@/lib/utils";
import { z } from "zod";

const scheduleFormSchema = insertScheduleItemSchema.omit({ projectId: true });
type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

export default function Schedule() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");
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

  const { data: scheduleItems = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/schedule`],
    enabled: isAuthenticated && !!selectedProject,
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      duration: 1,
      progress: "0",
      dependencies: "",
      status: "scheduled",
      stageId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProject}/schedule`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/schedule`] });
      setIsCreateDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Item do cronograma criado com sucesso",
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
        description: "Falha ao criar item do cronograma",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ScheduleFormData> }) => {
      const response = await apiRequest("PUT", `/api/schedule/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/schedule`] });
      setEditingItem(null);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Item do cronograma atualizado com sucesso",
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
        description: "Falha ao atualizar item do cronograma",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      duration: item.duration,
      progress: item.progress.toString(),
      dependencies: item.dependencies || "",
      status: item.status,
      stageId: item.stageId || undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const calculateProjectProgress = () => {
    if (scheduleItems.length === 0) return 0;
    const totalProgress = scheduleItems.reduce((sum: number, item: any) => 
      sum + parseFloat(item.progress), 0);
    return totalProgress / scheduleItems.length;
  };

  const getStatusStats = () => {
    const stats = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      delayed: 0,
    };

    scheduleItems.forEach((item: any) => {
      stats[item.status as keyof typeof stats]++;
    });

    return stats;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: "Agendado",
      in_progress: "Em Progresso",
      completed: "Concluído",
      delayed: "Atrasado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      scheduled: Clock,
      in_progress: PlayCircle,
      completed: CheckCircle,
      delayed: AlertTriangle,
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (endDate: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(endDate) < new Date();
  };

  const getDaysUntilDeadline = (endDate: string) => {
    const today = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  const statusStats = getStatusStats();
  const projectProgress = calculateProjectProgress();

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Cronograma"
          subtitle="Planejamento e controle de prazos"
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {projectProgress.toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <Progress value={projectProgress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Em Progresso</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {statusStats.in_progress}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center">
                        <PlayCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Concluídos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {statusStats.completed}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Atrasados</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {statusStats.delayed}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-error rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    size="sm"
                  >
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === "gantt" ? "default" : "outline"}
                    onClick={() => setViewMode("gantt")}
                    size="sm"
                  >
                    Gantt
                  </Button>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleCreateNew} className="construction-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Editar Tarefa" : "Nova Tarefa"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome da Tarefa *</Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          placeholder="Ex: Fundação - Escavação"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="startDate">Data de Início *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...form.register("startDate")}
                          />
                          {form.formState.errors.startDate && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.startDate.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="endDate">Data de Término *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...form.register("endDate")}
                          />
                          {form.formState.errors.endDate && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.endDate.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="duration">Duração (dias) *</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            {...form.register("duration", { valueAsNumber: true })}
                            placeholder="1"
                          />
                          {form.formState.errors.duration && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.duration.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={form.watch("status")}
                            onValueChange={(value) => form.setValue("status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Agendado</SelectItem>
                              <SelectItem value="in_progress">Em Progresso</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="delayed">Atrasado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="progress">Progresso (%)</Label>
                          <Input
                            id="progress"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...form.register("progress")}
                            placeholder="0.0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="stageId">Etapa do Orçamento (Opcional)</Label>
                        <Select
                          value={form.watch("stageId")?.toString() || ""}
                          onValueChange={(value) => form.setValue("stageId", value ? parseInt(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma etapa..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma etapa</SelectItem>
                            {budgets.map((budget: any) => (
                              budget.stages?.map((stage: any) => (
                                <SelectItem key={stage.id} value={stage.id.toString()}>
                                  {budget.name} - {stage.name}
                                </SelectItem>
                              ))
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="dependencies">Dependências (IDs separados por vírgula)</Label>
                        <Input
                          id="dependencies"
                          {...form.register("dependencies")}
                          placeholder="Ex: 1,2,3"
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
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="construction-primary"
                        >
                          {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Schedule Content */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Carregando cronograma...</p>
                </div>
              ) : scheduleItems.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma tarefa no cronograma
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Crie a primeira tarefa para começar o planejamento
                    </p>
                    <Button onClick={handleCreateNew} className="construction-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Primeira Tarefa
                    </Button>
                  </CardContent>
                </Card>
              ) : viewMode === "list" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Tarefas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tarefa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Término</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scheduleItems.map((item: any) => {
                            const StatusIcon = getStatusIcon(item.status);
                            const daysUntilDeadline = getDaysUntilDeadline(item.endDate);
                            const overdue = isOverdue(item.endDate, item.status);
                            
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  <div className="max-w-xs truncate" title={item.name}>
                                    {item.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn("text-xs", SCHEDULE_STATUS_COLORS[item.status as keyof typeof SCHEDULE_STATUS_COLORS])}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {getStatusLabel(item.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(item.startDate)}</TableCell>
                                <TableCell>{formatDate(item.endDate)}</TableCell>
                                <TableCell>{item.duration} dias</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Progress value={parseFloat(item.progress)} className="w-16 h-2" />
                                    <span className="text-sm text-gray-600">{item.progress}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "text-sm",
                                    overdue ? "text-red-600 font-medium" : 
                                    daysUntilDeadline <= 3 ? "text-yellow-600" : "text-gray-600"
                                  )}>
                                    {overdue ? "Atrasado" : 
                                     daysUntilDeadline === 0 ? "Hoje" :
                                     daysUntilDeadline === 1 ? "Amanhã" :
                                     `${daysUntilDeadline} dias`}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Gantt View (Simplified)
                <Card>
                  <CardHeader>
                    <CardTitle>Cronograma Gantt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scheduleItems.map((item: any) => {
                        const startDate = new Date(item.startDate);
                        const endDate = new Date(item.endDate);
                        const today = new Date();
                        
                        // Calculate position and width (simplified)
                        const totalDays = Math.max(30, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 7);
                        const startOffset = Math.max(0, Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                        const taskWidth = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className={cn("text-xs", SCHEDULE_STATUS_COLORS[item.status as keyof typeof SCHEDULE_STATUS_COLORS])}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                                <span className="text-sm text-gray-600">{item.progress}%</span>
                              </div>
                            </div>
                            <div className="relative bg-gray-100 rounded h-6">
                              <div 
                                className="absolute top-0 h-full bg-blue-500 rounded"
                                style={{ 
                                  left: `${Math.max(0, startOffset * 100 / totalDays)}%`,
                                  width: `${Math.min(100, taskWidth * 100 / totalDays)}%`
                                }}
                              />
                              <div 
                                className="absolute top-0 h-full bg-green-500 rounded"
                                style={{ 
                                  left: `${Math.max(0, startOffset * 100 / totalDays)}%`,
                                  width: `${Math.min(100, taskWidth * parseFloat(item.progress) / 100 * 100 / totalDays)}%`
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{formatDate(item.startDate)}</span>
                              <span>{formatDate(item.endDate)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Critical Path and Milestones */}
              {scheduleItems.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tarefas Críticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scheduleItems
                          .filter((item: any) => isOverdue(item.endDate, item.status) || getDaysUntilDeadline(item.endDate) <= 3)
                          .map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-red-900">{item.name}</h4>
                                <p className="text-sm text-red-600">
                                  {isOverdue(item.endDate, item.status) ? "Atrasado" : `Vence em ${getDaysUntilDeadline(item.endDate)} dias`}
                                </p>
                              </div>
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                          ))}
                        {scheduleItems.filter((item: any) => isOverdue(item.endDate, item.status) || getDaysUntilDeadline(item.endDate) <= 3).length === 0 && (
                          <p className="text-gray-500 text-center py-4">Nenhuma tarefa crítica no momento</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Marcos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scheduleItems
                          .filter((item: any) => item.status === 'scheduled' || item.status === 'in_progress')
                          .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                          .slice(0, 5)
                          .map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-blue-900">{item.name}</h4>
                                <p className="text-sm text-blue-600">
                                  Término previsto: {formatDate(item.endDate)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-blue-600">{item.progress}%</p>
                                <Progress value={parseFloat(item.progress)} className="w-16 h-2" />
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
