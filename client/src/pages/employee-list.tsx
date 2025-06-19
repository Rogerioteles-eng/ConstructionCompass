import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema } from "@shared/schema";
import { ArrowLeft, Search, Edit, Phone, FileText, Users, UserCheck, Trash2 } from "lucide-react";
import { Link } from "wouter";

interface Employee {
  id: number;
  name: string;
  role: string;
  isContractor: boolean;
  dailyRate: string;
  phone?: string;
  document?: string;
  status: string;
}

type FormData = {
  name: string;
  role: string;
  isContractor: boolean;
  dailyRate: string;
  phone?: string;
  document?: string;
  status: string;
};

export default function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      role: "",
      isContractor: false,
      dailyRate: "0",
      phone: "",
      document: "",
      status: "ativo",
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: { id: number; employee: any }) => {
      await apiRequest("PATCH", `/api/employees/${data.id}`, data.employee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Funcionário atualizado",
        description: "Os dados do funcionário foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o funcionário.",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      role: employee.role,
      isContractor: employee.isContractor,
      dailyRate: employee.dailyRate,
      phone: employee.phone || "",
      document: employee.document || "",
      status: employee.status,
    });
  };

  const handleDelete = (id: number) => {
    deleteEmployeeMutation.mutate(id);
  };

  const onSubmit = (data: FormData) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({
        id: editingEmployee.id,
        employee: data,
      });
    }
  };

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role))).filter(Boolean);

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.phone && employee.phone.includes(searchTerm));
    
    const matchesType = typeFilter === "all" || 
                       (typeFilter === "funcionario" && !employee.isContractor) ||
                       (typeFilter === "empreiteiro" && employee.isContractor);
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;

    return matchesSearch && matchesType && matchesStatus && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/employees">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Lista de Funcionários</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{employees.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Funcionários</p>
                    <p className="text-2xl font-bold">{employees.filter(e => !e.isContractor).length}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Empreiteiros</p>
                    <p className="text-2xl font-bold">{employees.filter(e => e.isContractor).length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold">{employees.filter(e => e.status === "ativo").length}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, função, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="funcionario">Funcionários</SelectItem>
                  <SelectItem value="empreiteiro">Empreiteiros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionários ({filteredEmployees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Diária</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      <Badge variant={employee.isContractor ? "secondary" : "default"}>
                        {employee.isContractor ? "Empreiteiro" : "Funcionário"}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {parseFloat(employee.dailyRate).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {employee.phone && <Phone className="w-3 h-3" />}
                        {employee.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "ativo"
                            ? "default"
                            : employee.status === "inativo"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Funcionário</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
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
                                          <Input {...field} />
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
                                          <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="isContractor"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <FormControl>
                                          <Select
                                            value={field.value ? "true" : "false"}
                                            onValueChange={(value) => field.onChange(value === "true")}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="false">Funcionário</SelectItem>
                                              <SelectItem value="true">Empreiteiro</SelectItem>
                                            </SelectContent>
                                          </Select>
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
                                        <FormControl>
                                          <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="ativo">Ativo</SelectItem>
                                              <SelectItem value="inativo">Inativo</SelectItem>
                                              <SelectItem value="afastado">Afastado</SelectItem>
                                            </SelectContent>
                                          </Select>
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
                                          <Input {...field} value={field.value || ""} />
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
                                        <FormLabel>CPF/RG</FormLabel>
                                        <FormControl>
                                          <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <DialogTrigger asChild>
                                    <Button type="button" variant="outline">
                                      Cancelar
                                    </Button>
                                  </DialogTrigger>
                                  <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                                    {updateEmployeeMutation.isPending ? "Salvando..." : "Salvar"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o funcionário "{employee.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(employee.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum funcionário encontrado com os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}