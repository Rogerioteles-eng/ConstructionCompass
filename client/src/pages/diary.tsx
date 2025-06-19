import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Plus, X, Search, Save, Camera } from "lucide-react";
import PhotoUpload from "@/components/photo-upload";
import { Badge } from "@/components/ui/badge";
import DiaryCalendar from "@/components/diary-calendar";

interface Employee {
  id: number;
  name: string;
  role: string;
  dailyRate: number;
  isContractor: boolean;
}

interface SelectedEmployee {
  id: number;
  name: string;
  role: string;
  dailyRate: number;
  isContractor: boolean;
}

export default function Diary() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    activities: "",
    photos: [] as string[]
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  if (!isAuthenticated) {
    return <div>Por favor, faça login para acessar o diário de obras.</div>;
  }

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: diaries, isLoading: loadingDiaries } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "diaries"],
    enabled: !!selectedProjectId,
  });

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "employees"],
    enabled: !!selectedProjectId,
  });

  // Processar diários para obter datas com registros
  const datesWithEntries = diaries && Array.isArray(diaries) ? diaries.map((diary: any) => diary.date) : [];

  const createDiaryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedProjectId) throw new Error("Projeto não selecionado");
      return await apiRequest(`/api/projects/${selectedProjectId}/diaries`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Registro salvo com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "diaries"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar registro",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      activities: "",
      photos: []
    });
    setSelectedEmployees([]);
    setEmployeeSearch("");
  };

  const getFilteredEmployees = (searchTerm: string) => {
    if (!employees || !searchTerm || !Array.isArray(employees)) return [];
    return employees.filter((emp: Employee) => 
      emp?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const addEmployee = (employee: Employee) => {
    const isAlreadySelected = selectedEmployees.some(emp => emp.id === employee.id);
    if (!isAlreadySelected) {
      setSelectedEmployees([...selectedEmployees, employee]);
    }
    setEmployeeSearch("");
  };

  const removeEmployee = (employeeId: number) => {
    setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employeeId));
  };

  const calculateTotalCost = () => {
    return selectedEmployees.reduce((total, emp) => total + emp.dailyRate, 0);
  };

  const handleSave = () => {
    if (!formData.activities.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva as atividades realizadas",
        variant: "destructive",
      });
      return;
    }

    const attendance = selectedEmployees.map(emp => ({
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      dailyRate: emp.dailyRate.toString(),
      isContractor: emp.isContractor
    }));
    
    createDiaryMutation.mutate({
      date: selectedDate.toISOString().split('T')[0],
      activities: formData.activities,
      photos: formData.photos,
      attendance: attendance
    });
  };

  // Separar funcionários e empreiteiros
  const employeesList = selectedEmployees.filter(emp => !emp.isContractor);
  const contractorsList = selectedEmployees.filter(emp => emp.isContractor);

  if (loadingProjects) {
    return <div className="flex items-center justify-center h-64">Carregando projetos...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Diário de Obras</h1>
      </div>

      {/* Seletor de Projeto */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecionar Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId?.toString() || ""} onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects && Array.isArray(projects) && projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name} - {project.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {/* Botão para Novo Registro */}
          <div className="mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Novo Registro de Diário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Novo Registro - {selectedDate.toLocaleDateString('pt-BR')}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Descrição das Atividades */}
                  <div>
                    <Label htmlFor="activities">Descrição das Atividades</Label>
                    <Textarea
                      id="activities"
                      value={formData.activities}
                      onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                      placeholder="Descreva as atividades realizadas no dia..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  {/* Upload de Fotos */}
                  <div>
                    <Label>Fotos da Obra</Label>
                    <div className="mt-2">
                      <PhotoUpload
                        onPhotoCapture={(photo) => setFormData({ ...formData, photos: [...formData.photos, photo] })}
                        onMultiplePhotos={(photos) => setFormData({ ...formData, photos })}
                        label="Tirar foto ou carregar arquivos"
                        multiple={true}
                      />
                    </div>
                    {formData.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={photo} 
                              alt={`Foto ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                const newPhotos = formData.photos.filter((_, i) => i !== index);
                                setFormData({ ...formData, photos: newPhotos });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Busca de Funcionários */}
                  <div>
                    <Label>Funcionários Presentes</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar funcionário por nome ou função..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    {/* Lista de Sugestões */}
                    {employeeSearch && (
                      <div className="mt-2 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredEmployees(employeeSearch).map((employee: Employee) => (
                          <button
                            key={employee.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                            onClick={() => addEmployee(employee)}
                          >
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.role} - R$ {employee.dailyRate}/dia
                              {employee.isContractor && (
                                <Badge variant="outline" className="ml-2">Empreiteiro</Badge>
                              )}
                            </div>
                          </button>
                        ))}
                        {getFilteredEmployees(employeeSearch).length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground">
                            Nenhum funcionário encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Funcionários Selecionados */}
                  {selectedEmployees.length > 0 && (
                    <div className="space-y-4">
                      {/* Funcionários */}
                      {employeesList.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Funcionários ({employeesList.length})</h4>
                          <div className="space-y-2">
                            {employeesList.map((employee) => (
                              <div key={employee.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div>
                                  <div className="font-medium">{employee.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {employee.role} - R$ {employee.dailyRate}/dia
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEmployee(employee.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empreiteiros */}
                      {contractorsList.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Empreiteiros ({contractorsList.length})</h4>
                          <div className="space-y-2">
                            {contractorsList.map((contractor) => (
                              <div key={contractor.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div>
                                  <div className="font-medium">{contractor.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {contractor.role} - R$ {contractor.dailyRate}/dia
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEmployee(contractor.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">
                          Custo Total do Dia: R$ {calculateTotalCost().toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedEmployees.length} pessoa(s) presente(s)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botão Salvar */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={createDiaryMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createDiaryMutation.isPending ? "Salvando..." : "Salvar Registro"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={createDiaryMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Calendário */}
          <DiaryCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
            datesWithEntries={datesWithEntries}
          />
        </>
      )}
    </div>
  );
}