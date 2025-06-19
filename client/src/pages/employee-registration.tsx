import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

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

export default function EmployeeRegistration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customRole, setCustomRole] = useState("");
  const [showCustomRole, setShowCustomRole] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      role: "",
      dailyRate: "",
      isContractor: false,
      phone: "",
      document: "",
      status: "ativo",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Sucesso",
        description: "Funcionário cadastrado com sucesso!",
      });
      form.reset();
      setShowCustomRole(false);
      setCustomRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar funcionário",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const finalData = {
      ...data,
      role: showCustomRole ? customRole : data.role,
      dailyRate: parseFloat(data.dailyRate),
    };
    createEmployeeMutation.mutate(finalData);
  };

  const handleRoleChange = (value: string) => {
    if (value === "Outros") {
      setShowCustomRole(true);
      form.setValue("role", "");
    } else {
      setShowCustomRole(false);
      setCustomRole("");
      form.setValue("role", value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/employees">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Gestão de Funcionários
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cadastro de Funcionário</h1>
          <p className="text-gray-600 mt-2">Preencha os dados do novo funcionário</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Novo Funcionário</CardTitle>
            <CardDescription>
              Cadastre um novo funcionário no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome completo" {...field} />
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
                      <Select onValueChange={handleRoleChange} value={showCustomRole ? "Outros" : field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {predefinedRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showCustomRole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especifique a função
                    </label>
                    <Input
                      placeholder="Digite a função específica"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                    />
                  </div>
                )}

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
                          placeholder="0,00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
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
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                        <FormLabel>
                          É empreiteiro
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Marque se for empreiteiro ao invés de funcionário
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending}
                    className="flex-1"
                  >
                    {createEmployeeMutation.isPending ? "Cadastrando..." : "Cadastrar Funcionário"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setShowCustomRole(false);
                      setCustomRole("");
                    }}
                    className="flex-1"
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}