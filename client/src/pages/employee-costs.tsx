import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, DollarSign, Users, Filter, ArrowLeft } from "lucide-react";
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
  hoursWorked: number;
  totalCost: number;
}

interface CostSummary {
  totalCost: number;
  totalDays: number;
  totalEmployees: number;
  totalContractors: number;
  averageDailyCost: number;
}

export default function EmployeeCosts() {
  // Estados para filtros
  const [searchFilter, setSearchFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("todos");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("todos");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Buscar projetos para filtro
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Buscar custos de funcionários com filtros
  const { data: employeeCosts, isLoading } = useQuery<EmployeeCost[]>({
    queryKey: ["/api/employee-costs", { 
      startDate, 
      endDate, 
      projectId: projectFilter !== "todos" ? projectFilter : undefined,
      search: searchFilter || undefined,
      employeeType: employeeTypeFilter !== "todos" ? employeeTypeFilter : undefined,
      role: roleFilter !== "todos" ? roleFilter : undefined,
    }],
  });

  // Filtrar custos localmente (para busca em tempo real)
  const filteredCosts = employeeCosts?.filter((cost) => {
    const matchesSearch = 
      cost.employeeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      cost.role.toLowerCase().includes(searchFilter.toLowerCase()) ||
      cost.projectName.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesProject = projectFilter === "todos" || cost.projectId.toString() === projectFilter;
    const matchesType = employeeTypeFilter === "todos" || 
      (employeeTypeFilter === "funcionario" && !cost.isContractor) ||
      (employeeTypeFilter === "empreiteiro" && cost.isContractor);
    const matchesRole = roleFilter === "todos" || cost.role === roleFilter;
    
    return matchesSearch && matchesProject && matchesType && matchesRole;
  }) || [];

  // Calcular resumo
  const uniqueDates = new Set(filteredCosts.map(cost => cost.workDate));
  const summary: CostSummary = {
    totalCost: filteredCosts.reduce((sum, cost) => sum + cost.totalCost, 0),
    totalDays: uniqueDates.size,
    totalEmployees: new Set(filteredCosts.filter(c => !c.isContractor).map(c => c.employeeId)).size,
    totalContractors: new Set(filteredCosts.filter(c => c.isContractor).map(c => c.employeeId)).size,
    averageDailyCost: uniqueDates.size > 0 ? filteredCosts.reduce((sum, cost) => sum + cost.totalCost, 0) / uniqueDates.size : 0,
  };

  // Listas únicas para filtros
  const uniqueRoles = Array.from(new Set(employeeCosts?.map(cost => cost.role) || []));

  // Agrupar por período
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

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {summary.totalCost.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.totalDays}</div>
                <p className="text-sm text-muted-foreground">Dias Trabalhados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{summary.totalEmployees}</div>
                <p className="text-sm text-muted-foreground">Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{summary.totalContractors}</div>
                <p className="text-sm text-muted-foreground">Empreiteiros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  R$ {summary.averageDailyCost.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Média Diária</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome, função, obra..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="project">Obra</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Obras</SelectItem>
                  {Array.isArray(projects) && projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={employeeTypeFilter} onValueChange={setEmployeeTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="funcionario">Funcionários</SelectItem>
                  <SelectItem value="empreiteiro">Empreiteiros</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de Custos Agrupados por Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Histórico de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando custos...</div>
          ) : sortedDates.length > 0 ? (
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
                          <TableHead>Jornada</TableHead>
                          <TableHead>Diária</TableHead>
                          <TableHead>Total</TableHead>
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
                            <TableCell>Diária</TableCell>
                            <TableCell>R$ {Number(cost.dailyRate || 0).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">R$ {Number(cost.totalCost || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum custo encontrado com os filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}