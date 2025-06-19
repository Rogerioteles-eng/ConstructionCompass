import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Filter } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeCost {
  employeeId: number;
  employeeName: string;
  role: string;
  isContractor: boolean;
  projectName: string;
  projectId: number;
  workDate: string;
  dailyRate: number;
  totalCost: number;
}

export default function EmployeeCosts() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectFilter, setProjectFilter] = useState("todos");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("todos");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [searchFilter, setSearchFilter] = useState("");

  // Verificar se há filtros aplicados
  const hasFilters = Boolean(startDate || endDate || projectFilter !== "todos" || employeeTypeFilter !== "todos" || roleFilter !== "todos" || searchFilter);

  // Buscar projetos para o filtro
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Buscar custos apenas quando há filtros
  const { data: employeeCosts, isLoading } = useQuery({
    queryKey: ["/api/employee-costs", { startDate, endDate, projectId: projectFilter === "todos" ? undefined : parseInt(projectFilter), employeeType: employeeTypeFilter === "todos" ? undefined : employeeTypeFilter, role: roleFilter === "todos" ? undefined : roleFilter, search: searchFilter || undefined }],
    enabled: hasFilters,
  });

  // Filtrar resultados no frontend se necessário
  const filteredCosts: EmployeeCost[] = (employeeCosts as EmployeeCost[]) || [];

  // Listas únicas para filtros
  const uniqueRoles = Array.from(new Set(filteredCosts.map(cost => cost.role)));

  // Agrupar por data
  const costsByDate = filteredCosts.reduce((acc, cost) => {
    const date = cost.workDate;
    if (!acc[date]) {
      acc[date] = {
        date,
        totalCost: 0,
        entries: [],
      };
    }
    acc[date].totalCost += cost.totalCost;
    acc[date].entries.push(cost);
    return acc;
  }, {} as Record<string, { date: string; totalCost: number; entries: EmployeeCost[] }>);

  const sortedDates = Object.keys(costsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/employees">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Gestão de Funcionários
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Custos de Funcionários</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Obra</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as obras</SelectItem>
                  {(projects as any[] || []).map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={employeeTypeFilter} onValueChange={setEmployeeTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="funcionario">Funcionários</SelectItem>
                  <SelectItem value="empreiteiro">Empreiteiros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Função</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as funções</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome, função ou obra..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando custos...
            </div>
          ) : hasFilters && filteredCosts.length > 0 ? (
            <div className="space-y-6">
              {sortedDates.map((date) => {
                const dayData = costsByDate[date];
                return (
                  <div key={date} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </h3>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        R$ {dayData.totalCost.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Obra</TableHead>
                          <TableHead>Diária</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayData.entries.map((cost, index) => (
                          <TableRow key={`${cost.employeeId}-${cost.projectId}-${index}`}>
                            <TableCell className="font-medium">{cost.employeeName}</TableCell>
                            <TableCell>{cost.role}</TableCell>
                            <TableCell>
                              <Badge variant={cost.isContractor ? "secondary" : "default"}>
                                {cost.isContractor ? "Empreiteiro" : "Funcionário"}
                              </Badge>
                            </TableCell>
                            <TableCell>{cost.projectName}</TableCell>
                            <TableCell className="font-medium">R$ {Number(cost.totalCost || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          ) : hasFilters && filteredCosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum custo encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aplique filtros para visualizar os custos de funcionários</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}