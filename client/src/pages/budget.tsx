import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Plus, Building, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import BudgetTable from "@/components/budget-table";
import { z } from "zod";

const budgetFormSchema = insertBudgetSchema.omit({ projectId: true });
type BudgetFormData = z.infer<typeof budgetFormSchema>;

export default function Budget() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Get project ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const projectIdFromUrl = urlParams.get('project');

  useEffect(() => {
    if (projectIdFromUrl) {
      setSelectedProject(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);

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

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      version: 1,
      isActive: true,
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProject}/budgets`, data);
      return response.json();
    },
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/budgets`] });
      setIsCreateDialogOpen(false);
      setSelectedBudget(newBudget.id);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Orçamento criado com sucesso",
      });
    },
    onError: (error) => {
      console.error("Budget creation error:", error);
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
        description: `Falha ao criar orçamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addStageMutation = useMutation({
    mutationFn: async ({ budgetId, stageData }: { budgetId: number; stageData: any }) => {
      const response = await apiRequest("POST", `/api/budgets/${budgetId}/stages`, stageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget}/structure`] });
      toast({
        title: "Sucesso!",
        description: "Etapa adicionada com sucesso",
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
        description: "Falha ao adicionar etapa",
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ stageId, itemData }: { stageId: number; itemData: any }) => {
      const response = await apiRequest("POST", `/api/stages/${stageId}/items`, itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget}/structure`] });
      toast({
        title: "Sucesso!",
        description: "Item adicionado com sucesso",
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
        description: "Falha ao adicionar item",
        variant: "destructive",
      });
    },
  });

  const addSubitemMutation = useMutation({
    mutationFn: async ({ itemId, subitemData }: { itemId: number; subitemData: any }) => {
      const response = await apiRequest("POST", `/api/items/${itemId}/subitems`, subitemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget}/structure`] });
      toast({
        title: "Sucesso!",
        description: "Subitem adicionado com sucesso",
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
        description: "Falha ao adicionar subitem",
        variant: "destructive",
      });
    },
  });

  const updateSubitemMutation = useMutation({
    mutationFn: async ({ subitemId, subitemData }: { subitemId: number; subitemData: any }) => {
      const response = await apiRequest("PUT", `/api/subitems/${subitemId}`, subitemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${selectedBudget}/structure`] });
      toast({
        title: "Sucesso!",
        description: "Subitem atualizado com sucesso",
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
        description: "Falha ao atualizar subitem",
        variant: "destructive",
      });
    },
  });

  const onSubmitBudget = (data: BudgetFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Selected project:", selectedProject);
    if (!selectedProject) {
      toast({
        title: "Erro",
        description: "Selecione uma obra primeiro",
        variant: "destructive",
      });
      return;
    }
    createBudgetMutation.mutate(data);
  };

  const handleAddStage = (budgetId: number, stageData: any) => {
    addStageMutation.mutate({ budgetId, stageData });
  };

  const handleAddItem = (stageId: number, itemData: any) => {
    addItemMutation.mutate({ stageId, itemData });
  };

  const handleAddSubitem = (itemId: number, subitemData: any) => {
    addSubitemMutation.mutate({ itemId, subitemData });
  };

  const handleUpdateSubitem = (subitemId: number, subitemData: any) => {
    updateSubitemMutation.mutate({ subitemId, subitemData });
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  const selectedProjectData = projects.find((p: any) => p.id.toString() === selectedProject);

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Orçamentos"
          subtitle={selectedProjectData ? `${selectedProjectData.name}` : "Gerencie orçamentos de obras"}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Project Selection */}
          {!selectedProject && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Selecione uma Obra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project: any) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedProject(project.id.toString())}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 construction-primary rounded-lg flex items-center justify-center">
                            <Building className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{project.name}</h3>
                            <p className="text-sm text-gray-500">{project.client}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {projects.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma obra encontrada</h3>
                    <p className="text-gray-500 mb-4">Crie uma obra primeiro para gerenciar orçamentos</p>
                    <Button onClick={() => navigate("/projects")} className="construction-primary">
                      Criar Obra
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Budget Management */}
          {selectedProject && (
            <>
              {/* Navigation */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProject("")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold">{selectedProjectData?.name}</h2>
                    <p className="text-gray-500">{selectedProjectData?.client}</p>
                  </div>
                </div>
              </div>

              {/* Budget Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Orçamentos da Obra</CardTitle>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="construction-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Orçamento
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Novo Orçamento</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmitBudget, (errors) => {
                          console.log("Form validation errors:", errors);
                          toast({
                            title: "Erro de validação",
                            description: "Verifique os campos obrigatórios",
                            variant: "destructive",
                          });
                        })} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Nome do Orçamento *</Label>
                            <Input
                              id="name"
                              {...form.register("name")}
                              placeholder="Ex: Orçamento Inicial"
                            />
                            {form.formState.errors.name && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="version">Versão</Label>
                              <Input
                                id="version"
                                type="number"
                                {...form.register("version", { valueAsNumber: true })}
                                placeholder="1"
                              />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                              <input
                                type="checkbox"
                                id="isActive"
                                {...form.register("isActive")}
                                className="rounded"
                              />
                              <Label htmlFor="isActive">Ativo</Label>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              disabled={createBudgetMutation.isPending}
                              className="construction-primary"
                            >
                              {createBudgetMutation.isPending ? "Criando..." : "Criar"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {budgets.length === 0 ? (
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento criado</h3>
                      <p className="text-gray-500">Crie o primeiro orçamento para esta obra</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {budgets.map((budget: any) => (
                        <Card
                          key={budget.id}
                          className={`cursor-pointer transition-all ${
                            selectedBudget === budget.id
                              ? "ring-2 ring-blue-500 shadow-md"
                              : "hover:shadow-md"
                          }`}
                          onClick={() => setSelectedBudget(budget.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{budget.name}</h3>
                              {budget.isActive && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">Versão {budget.version}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Criado em {new Date(budget.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Budget Structure */}
              {selectedBudget && budgetStructure && (
                <BudgetTable
                  budget={budgetStructure}
                  onAddStage={handleAddStage}
                  onAddItem={handleAddItem}
                  onAddSubitem={handleAddSubitem}
                  onUpdateSubitem={handleUpdateSubitem}
                />
              )}
            </>
          )}
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
