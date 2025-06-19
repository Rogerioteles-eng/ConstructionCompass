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
    date: new Date().toISOString().split('T')[0],
    activities: "",
    photos: [] as string[]
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<SelectedEmployee[]>([]);

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
    queryKey: ["/api/employees"],
    retry: false,
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
      date: new Date().toISOString().split('T')[0],
      activities: "",
      photos: []
    });
    setSelectedEmployees([]);
    setSelectedContractors([]);
  };

  const addEmployee = (employee: Employee) => {
    if (employee.isContractor) {
      const isAlreadySelected = selectedContractors.some(emp => emp.id === employee.id);
      if (!isAlreadySelected) {
        setSelectedContractors([...selectedContractors, employee]);
      }
    } else {
      const isAlreadySelected = selectedEmployees.some(emp => emp.id === employee.id);
      if (!isAlreadySelected) {
        setSelectedEmployees([...selectedEmployees, employee]);
      }
    }
  };

  const removeEmployee = (employeeId: number) => {
    setSelectedEmployees(selectedEmployees.filter(emp => emp.id !== employeeId));
  };

  const removeContractor = (contractorId: number) => {
    setSelectedContractors(selectedContractors.filter(emp => emp.id !== contractorId));
  };

  const calculateTotalCost = () => {
    const employeeCost = selectedEmployees.reduce((total, emp) => total + emp.dailyRate, 0);
    const contractorCost = selectedContractors.reduce((total, emp) => total + emp.dailyRate, 0);
    return employeeCost + contractorCost;
  };

  // Filtrar funcionários e empreiteiros separadamente
  const getEmployeesOnly = () => {
    if (!employees || !Array.isArray(employees)) return [];
    return employees.filter((emp: Employee) => 
      !emp.isContractor && !selectedEmployees.some(selected => selected.id === emp.id)
    );
  };

  const getContractorsOnly = () => {
    if (!employees || !Array.isArray(employees)) return [];
    return employees.filter((emp: Employee) => 
      emp.isContractor && !selectedContractors.some(selected => selected.id === emp.id)
    );
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

    const allAttendance = [
      ...selectedEmployees.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        dailyRate: emp.dailyRate.toString(),
        isContractor: emp.isContractor
      })),
      ...selectedContractors.map(emp => ({
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        dailyRate: emp.dailyRate.toString(),
        isContractor: emp.isContractor
      }))
    ];
    
    createDiaryMutation.mutate({
      date: formData.date,
      activities: formData.activities,
      photos: formData.photos,
      attendance: allAttendance
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
                  {/* Data */}
                  <div>
                    <Label htmlFor="date">Data do Registro</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-2"
                    />
                  </div>

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

                  {/* Seção Funcionários */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-lg font-semibold">Funcionários</Label>
                      <div className="mt-2 space-y-2">
                        {/* Campos dinâmicos para funcionários */}
                        {[...Array(Math.max(1, selectedEmployees.length + 1))].map((_, index) => (
                          <Select 
                            key={`employee-${index}`}
                            value="" 
                            onValueChange={(value) => {
                              const employeesOnly = getEmployeesOnly();
                              const employee = employeesOnly.find((emp: Employee) => emp.id.toString() === value);
                              if (employee) addEmployee(employee);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                index < selectedEmployees.length 
                                  ? `${selectedEmployees[index].name} - ${selectedEmployees[index].role} - R$ ${selectedEmployees[index].dailyRate}/dia`
                                  : "Selecionar funcionário..."
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {getEmployeesOnly().length > 0 ? (
                                getEmployeesOnly().map((employee: Employee) => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.name} - {employee.role} - R$ {employee.dailyRate}/dia
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-employees" disabled>
                                  {index < selectedEmployees.length ? "Funcionário selecionado" : "Nenhum funcionário disponível"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ))}
                        
                        {/* Lista de funcionários selecionados */}
                        {selectedEmployees.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {selectedEmployees.map((emp) => (
                              <div key={emp.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                                <span>{emp.name} - {emp.role} - R$ {emp.dailyRate}/dia</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEmployee(emp.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seção Empreiteiros */}
                    <div>
                      <Label className="text-lg font-semibold">Empreiteiros</Label>
                      <div className="mt-2 space-y-2">
                        {/* Campos dinâmicos para empreiteiros */}
                        {[...Array(Math.max(1, selectedContractors.length + 1))].map((_, index) => (
                          <Select 
                            key={`contractor-${index}`}
                            value="" 
                            onValueChange={(value) => {
                              const contractorsOnly = getContractorsOnly();
                              const contractor = contractorsOnly.find((emp: Employee) => emp.id.toString() === value);
                              if (contractor) addEmployee(contractor);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                index < selectedContractors.length 
                                  ? `${selectedContractors[index].name} - ${selectedContractors[index].role} - R$ ${selectedContractors[index].dailyRate}/dia`
                                  : "Selecionar empreiteiro..."
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {getContractorsOnly().length > 0 ? (
                                getContractorsOnly().map((contractor: Employee) => (
                                  <SelectItem key={contractor.id} value={contractor.id.toString()}>
                                    {contractor.name} - {contractor.role} - R$ {contractor.dailyRate}/dia
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-contractors" disabled>
                                  {index < selectedContractors.length ? "Empreiteiro selecionado" : "Nenhum empreiteiro disponível"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ))}
                        
                        {/* Lista de empreiteiros selecionados */}
                        {selectedContractors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {selectedContractors.map((emp) => (
                              <div key={emp.id} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                                <span>{emp.name} - {emp.role} - R$ {emp.dailyRate}/dia</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContractor(emp.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumo de Custos */}
                  {(selectedEmployees.length > 0 || selectedContractors.length > 0) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800 mb-2">
                        Custo Total do Dia: R$ {calculateTotalCost().toFixed(2)}
                      </div>
                      {selectedEmployees.length > 0 && (
                        <div className="text-sm text-green-700">
                          Funcionários ({selectedEmployees.length}): R$ {selectedEmployees.reduce((total, emp) => total + emp.dailyRate, 0).toFixed(2)}
                        </div>
                      )}
                      {selectedContractors.length > 0 && (
                        <div className="text-sm text-green-700">
                          Empreiteiros ({selectedContractors.length}): R$ {selectedContractors.reduce((total, emp) => total + emp.dailyRate, 0).toFixed(2)}
                        </div>
                      )}
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