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
import { Plus, BookOpen, Users, Calendar, DollarSign, Trash2, Edit, UserPlus } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkDiarySchema, insertWorkDiaryWorkerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import PhotoUpload from "@/components/photo-upload";
import { z } from "zod";

const diaryFormSchema = insertWorkDiarySchema.omit({ createdBy: true, projectId: true }).extend({
  workers: z.array(insertWorkDiaryWorkerSchema.omit({ diaryId: true })).min(1, "Adicione pelo menos um funcionário")
});

type DiaryFormData = z.infer<typeof diaryFormSchema>;

export default function Diary() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("");
  const [diaryPhotos, setDiaryPhotos] = useState<string[]>([]);
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

  const { data: diaries = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/diaries`],
    enabled: isAuthenticated && !!selectedProject,
  });

  const form = useForm<DiaryFormData>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      activities: "",
      workers: [
        {
          workerName: "",
          role: "",
          dailyRate: "",
          isContractor: false,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "workers",
  });

  const createMutation = useMutation({
    mutationFn: async (data: DiaryFormData) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProject}/diaries`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/diaries`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Diário de obra registrado com sucesso",
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
        description: "Falha ao registrar diário de obra",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DiaryFormData) => {
    createMutation.mutate(data);
  };

  const addWorker = () => {
    append({
      workerName: "",
      role: "",
      dailyRate: "",
      isContractor: false,
    });
  };

  const filteredDiaries = diaries.filter((diary: any) => {
    const matchesDate = !dateFilter || diary.date === dateFilter;
    return matchesDate;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const calculateDailyTotal = (workers: any[]) => {
    return workers.reduce((sum, worker) => sum + parseFloat(worker.dailyRate || "0"), 0);
  };

  const calculateWeeklyPayroll = () => {
    const weeklyData: { [key: string]: number } = {};
    
    filteredDiaries.forEach((diary: any) => {
      diary.workers.forEach((worker: any) => {
        if (!weeklyData[worker.workerName]) {
          weeklyData[worker.workerName] = 0;
        }
        weeklyData[worker.workerName] += parseFloat(worker.dailyRate || "0");
      });
    });

    return weeklyData;
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  const weeklyPayroll = calculateWeeklyPayroll();
  const totalWeeklyPayroll = Object.values(weeklyPayroll).reduce((sum, value) => sum + value, 0);

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Diário de Obras"
          subtitle="Registro diário de atividades e funcionários"
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
                        <p className="text-sm font-medium text-gray-600">Registros Hoje</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {filteredDiaries.filter((d: any) => d.date === new Date().toISOString().split('T')[0]).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Funcionários Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {new Set(filteredDiaries.flatMap((d: any) => d.workers.map((w: any) => w.workerName))).size}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-secondary rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Folha Semanal</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(totalWeeklyPayroll)}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Add Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="construction-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Registro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Novo Diário de Obra</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>

                      <div>
                        <Label htmlFor="activities">Atividades do Dia *</Label>
                        <Textarea
                          id="activities"
                          {...form.register("activities")}
                          placeholder="Descreva as atividades realizadas no dia..."
                          rows={4}
                        />
                        {form.formState.errors.activities && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.activities.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Funcionários Presentes *</Label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addWorker}
                            size="sm"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adicionar Funcionário
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                              <div>
                                <Label>Nome *</Label>
                                <Input
                                  {...form.register(`workers.${index}.workerName`)}
                                  placeholder="Nome completo"
                                />
                                {form.formState.errors.workers?.[index]?.workerName && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.workers[index]?.workerName?.message}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label>Função *</Label>
                                <Select
                                  value={form.watch(`workers.${index}.role`)}
                                  onValueChange={(value) => form.setValue(`workers.${index}.role`, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Função" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pedreiro">Pedreiro</SelectItem>
                                    <SelectItem value="Servente">Servente</SelectItem>
                                    <SelectItem value="Eletricista">Eletricista</SelectItem>
                                    <SelectItem value="Encanador">Encanador</SelectItem>
                                    <SelectItem value="Pintor">Pintor</SelectItem>
                                    <SelectItem value="Carpinteiro">Carpinteiro</SelectItem>
                                    <SelectItem value="Soldador">Soldador</SelectItem>
                                    <SelectItem value="Operador de Máquina">Operador de Máquina</SelectItem>
                                    <SelectItem value="Outros">Outros</SelectItem>
                                  </SelectContent>
                                </Select>
                                {form.formState.errors.workers?.[index]?.role && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.workers[index]?.role?.message}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label>Diária (R$) *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...form.register(`workers.${index}.dailyRate`)}
                                  placeholder="0.00"
                                />
                                {form.formState.errors.workers?.[index]?.dailyRate && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {form.formState.errors.workers[index]?.dailyRate?.message}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 pt-6">
                                <input
                                  type="checkbox"
                                  {...form.register(`workers.${index}.isContractor`)}
                                  className="rounded"
                                />
                                <Label>Empreiteiro</Label>
                              </div>
                              
                              <div className="flex items-center pt-6">
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {form.formState.errors.workers && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.workers.message}
                          </p>
                        )}
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

              {/* Diary Entries */}
              {isLoading ? (
                <div className="grid gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
                  ))}
                </div>
              ) : filteredDiaries.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {dateFilter ? "Nenhum registro encontrado" : "Nenhum diário registrado"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {dateFilter 
                        ? "Não há registros para a data selecionada"
                        : "Comece registrando as atividades diárias da obra"
                      }
                    </p>
                    {!dateFilter && (
                      <Button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="construction-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Primeiro Registro
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredDiaries.map((diary: any) => (
                    <Card key={diary.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center">
                              <Calendar className="h-5 w-5 mr-2" />
                              {formatDate(diary.date)}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Registrado por: {diary.createdByUser?.firstName} {diary.createdByUser?.lastName}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {diary.workers.length} funcionário{diary.workers.length !== 1 ? 's' : ''}
                            </Badge>
                            <Badge className="construction-success">
                              {formatCurrency(calculateDailyTotal(diary.workers))}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Atividades:</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{diary.activities}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Funcionários Presentes:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {diary.workers.map((worker: any, index: number) => (
                                <div key={index} className="bg-white border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-900">{worker.workerName}</h5>
                                    {worker.isContractor && (
                                      <Badge variant="secondary" className="text-xs">Empreiteiro</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">{worker.role}</p>
                                  <p className="text-sm font-medium text-green-600">
                                    {formatCurrency(worker.dailyRate)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Weekly Payroll Summary */}
              {Object.keys(weeklyPayroll).length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Resumo da Folha de Pagamento Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {Object.entries(weeklyPayroll).map(([workerName, total]) => (
                        <div key={workerName} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">{workerName}</h4>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(total)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Total da Folha:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalWeeklyPayroll)}
                        </span>
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
