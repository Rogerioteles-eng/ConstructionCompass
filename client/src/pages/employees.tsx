import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Edit, Trash2, Phone, IdCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { insertEmployeeSchema } from "@shared/schema";

// Formulário de funcionário
const employeeFormSchema = insertEmployeeSchema.omit({ projectId: true });
type EmployeeFormData = z.infer<typeof employeeFormSchema>;

// Funções de formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPhone = (phone: string) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Roles/funções comuns na construção civil
const CONSTRUCTION_ROLES = [
  "Pedreiro",
  "Servente",
  "Pintor",
  "Eletricista",
  "Encanador",
  "Carpinteiro",
  "Soldador",
  "Operador de Máquinas",
  "Mestre de Obras",
  "Técnico em Edificações",
  "Azulejista",
  "Gesseiro",
  "Marceneiro",
  "Serralheiro",
  "Outros"
];

export default function Employees() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
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

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      role: "",
      dailyRate: "0",
      isContractor: false,
      isActive: true,
      phone: "",
      document: "",
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${selectedProject}/employees`],
    enabled: isAuthenticated && !!selectedProject,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProject}/employees`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/employees`] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Funcionário cadastrado com sucesso",
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
        description: "Falha ao cadastrar funcionário",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("PUT", `/api/employees/${editingEmployee.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/employees`] });
      setEditingEmployee(null);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Funcionário atualizado com sucesso",
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
        description: "Falha ao atualizar funcionário",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      await apiRequest("DELETE", `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject}/employees`] });
      toast({
        title: "Sucesso!",
        description: "Funcionário removido com sucesso",
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
        description: "Falha ao remover funcionário",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate(data);
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      role: employee.role,
      dailyRate: employee.dailyRate,
      isContractor: employee.isContractor || false,
      phone: employee.phone || "",
      document: employee.document || "",
      isActive: employee.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (employeeId: number) => {
    if (confirm("Tem certeza que deseja remover este funcionário?")) {
      deleteEmployeeMutation.mutate(employeeId);
    }
  };

  const resetForm = () => {
    setEditingEmployee(null);
    form.reset();
    setIsCreateDialogOpen(false);
  };

  if (authLoading || !isAuthenticated) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Funcionários"
          subtitle="Gerenciamento da equipe das obras"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Project Selection */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
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
            </div>
            
            {selectedProject && (
              <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                if (!open) resetForm();
                setIsCreateDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button className="construction-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          placeholder="Ex: João Silva"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="role">Função *</Label>
                        <Select 
                          value={form.watch("role")} 
                          onValueChange={(value) => form.setValue("role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONSTRUCTION_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.role && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.role.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dailyRate">Valor da Diária (R$) *</Label>
                        <Input
                          id="dailyRate"
                          type="number"
                          step="0.01"
                          {...form.register("dailyRate")}
                          placeholder="150.00"
                        />
                        {form.formState.errors.dailyRate && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.dailyRate.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          {...form.register("phone")}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="document">CPF/RG</Label>
                      <Input
                        id="document"
                        {...form.register("document")}
                        placeholder="123.456.789-00"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isContractor"
                        checked={form.watch("isContractor")}
                        onCheckedChange={(checked) => form.setValue("isContractor", !!checked)}
                      />
                      <Label htmlFor="isContractor">É empreiteiro</Label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                        className="construction-primary"
                      >
                        {createEmployeeMutation.isPending || updateEmployeeMutation.isPending 
                          ? "Salvando..." 
                          : editingEmployee ? "Atualizar" : "Cadastrar"
                        }
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedProject ? (
            <Card className="p-8">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Gerenciamento de Funcionários
                </h3>
                <p className="text-gray-600">
                  Selecione uma obra para visualizar e gerenciar os funcionários da equipe
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {Array.isArray(employees) ? employees.length : 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Funcionários</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {Array.isArray(employees) 
                            ? employees.filter((emp: any) => !emp.isContractor).length 
                            : 0
                          }
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Empreiteiros</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {Array.isArray(employees) 
                            ? employees.filter((emp: any) => emp.isContractor).length 
                            : 0
                          }
                        </p>
                      </div>
                      <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Custo Diário</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCurrency(
                            Array.isArray(employees) 
                              ? employees.reduce((sum: number, emp: any) => sum + parseFloat(emp.dailyRate || 0), 0)
                              : 0
                          )}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Employees Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Funcionários</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p>Carregando funcionários...</p>
                    </div>
                  ) : !Array.isArray(employees) || employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum funcionário cadastrado
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Cadastre o primeiro funcionário desta obra
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Diária</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee: any) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">
                                {employee.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {employee.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(parseFloat(employee.dailyRate))}
                              </TableCell>
                              <TableCell>
                                {employee.phone ? (
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {formatPhone(employee.phone)}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {employee.document ? (
                                  <div className="flex items-center text-sm">
                                    <IdCard className="h-3 w-3 mr-1" />
                                    {employee.document}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={employee.isActive ? "default" : "destructive"}
                                >
                                  {employee.isActive ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEdit(employee)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDelete(employee.id)}
                                  >
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
            </div>
          )}
        </main>
      </div>
      
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}