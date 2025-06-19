import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema, type Employee, type InsertEmployee } from "@shared/schema";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

const predefinedRoles = [
  "Pedreiro",
  "Servente", 
  "Pintor",
  "Eletricista",
  "Encanador",
  "Carpinteiro",
  "Azulejista",
  "Mestre de obras",
  "Outros"
];

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

const employeeFormSchema = insertEmployeeSchema.extend({
  dailyRate: z.string().min(1, "Valor da diária é obrigatório"),
});

export default function EmployeesManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      role: "",
      dailyRate: "",
      phone: "",
      document: "",
      status: "ativo",
      isContractor: false,
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees"],
    enabled: isAuthenticated,
    retry: false,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const payload = {
        ...data,
        dailyRate: parseFloat(data.dailyRate),
      };
      return apiRequest("/api/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      form.reset();
      toast({
        title: "Sucesso",
        description: "Funcionário cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
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
        description: "Erro ao cadastrar funcionário",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmployeeFormData }) => {
      const payload = {
        ...data,
        dailyRate: parseFloat(data.dailyRate),
      };
      return apiRequest(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditingEmployee(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
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
        description: "Erro ao atualizar funcionário",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/employees/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Sucesso",
        description: "Funcionário removido com sucesso!",
      });
    },
    onError: (error: Error) => {
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
        description: "Erro ao remover funcionário",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      role: employee.role,
      dailyRate: employee.dailyRate.toString(),
      phone: employee.phone || "",
      document: employee.document || "",
      status: employee.status,
      isContractor: employee.isContractor,
    });
  };

  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = searchFilter === "" || 
      employee.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (employee.document && employee.document.toLowerCase().includes(searchFilter.toLowerCase()));
    
    const matchesStatus = statusFilter === "todos" || employee.status === statusFilter;
    const matchesRole = roleFilter === "todos" || employee.role === roleFilter;
    const matchesType = typeFilter === "todos" || 
      (typeFilter === "funcionario" && !employee.isContractor) ||
      (typeFilter === "empreiteiro" && employee.isContractor);
    
    return matchesSearch && matchesStatus && matchesRole && matchesType;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((emp: Employee) => emp.status === "ativo").length;
  const contractors = employees.filter((emp: Employee) => emp.isContractor).length;
  const regularEmployees = employees.filter((emp: Employee) => !emp.isContractor).length;

  const uniqueRoles = Array.from(new Set(employees.map((emp: Employee) => emp.role)));

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggleAI={() => setAiOpen(!aiOpen)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Funcionários"
          subtitle="Gerencie funcionários e empreiteiros"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100">Funcionários</span>
            </nav>

            <h1 className="text-2xl font-semibold mb-6">Funcionários</h1>

            {/* Estatísticas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                    <p className="text-sm text-muted-foreground">Total Cadastrados</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{regularEmployees}</div>
                    <p className="text-sm text-muted-foreground">Funcionários</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{contractors}</div>
                    <p className="text-sm text-muted-foreground">Empreiteiros</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário de Cadastro */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Pedreiro, Eletricista..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Diária (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="document"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Documento (CPF/RG)</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                              <SelectItem value="afastado">Afastado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2 lg:col-span-3">
                      <FormField
                        control={form.control}
                        name="isContractor"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>É empreiteiro/terceirizado</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                      >
                        {editingEmployee ? "Atualizar" : "Cadastrar"}
                      </Button>
                      {editingEmployee && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setEditingEmployee(null);
                            form.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Lista de Funcionários */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Lista de Funcionários
                </CardTitle>
                
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      placeholder="Nome, função, documento..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="afastado">Afastado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {uniqueRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="empreiteiro">Empreiteiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEmployees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Diária</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee: Employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.role}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                employee.status === "ativo" ? "default" : 
                                employee.status === "inativo" ? "destructive" : 
                                "secondary"
                              }
                            >
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.isContractor ? "outline" : "secondary"}>
                              {employee.isContractor ? "Empreiteiro" : "Funcionário"}
                            </Badge>
                          </TableCell>
                          <TableCell>R$ {Number(employee.dailyRate).toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                disabled={deleteEmployeeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum funcionário encontrado com os filtros aplicados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <AIAssistant 
        isOpen={aiOpen} 
        onClose={() => setAiOpen(false)} 
      />
    </div>
  );
}