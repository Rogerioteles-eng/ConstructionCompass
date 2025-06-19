import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Plus, X, Search, Save } from "lucide-react";
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

interface AttendanceRecord {
  employeeId?: number;
  employeeName: string;
  role: string;
  dailyRate: string;
  isContractor: boolean;
}

interface DiaryEntry {
  id: number;
  date: string;
  activities: string;
  photos: string[];
  attendance?: AttendanceRecord[];
}

export default function Diary() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  
  const [formData, setFormData] = useState({
    activities: "",
    photos: [] as string[]
  });
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    Array(7).fill(null).map(() => ({
      employeeName: "",
      role: "",
      dailyRate: "",
      isContractor: false
    }))
  );
  
  const [employeeSearch, setEmployeeSearch] = useState<string[]>(Array(7).fill(""));

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
  const datesWithEntries = diaries ? diaries.map((diary: any) => diary.date) : [];

  // Buscar entrada do dia selecionado
  const selectedDateEntry = diaries?.find((diary: any) => 
    diary.date === selectedDate.toISOString().split('T')[0]
  );

  // Carregar dados da entrada selecionada
  const loadEntryData = (entry: DiaryEntry | null) => {
    if (entry) {
      setCurrentEntry(entry);
      setFormData({
        activities: entry.activities,
        photos: entry.photos || []
      });
      // Carregar attendance se disponível (por enquanto vazio até implementar)
      setAttendance(Array(7).fill(null).map(() => ({
        employeeName: "",
        role: "",
        dailyRate: "",
        isContractor: false
      })));
    } else {
      // Limpar formulário para nova entrada
      setCurrentEntry(null);
      setFormData({
        activities: "",
        photos: []
      });
      setAttendance(Array(7).fill(null).map(() => ({
        employeeName: "",
        role: "",
        dailyRate: "",
        isContractor: false
      })));
      setEmployeeSearch(Array(7).fill(""));
    }
  };

  // Carregar dados quando a data selecionada mudar
  useEffect(() => {
    loadEntryData(selectedDateEntry || null);
  }, [selectedDateEntry]);

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
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar registro",
        variant: "destructive",
      });
    },
  });

  const handleEmployeeSelect = (index: number, employee: Employee) => {
    const newAttendance = [...attendance];
    newAttendance[index] = {
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      dailyRate: employee.dailyRate.toString(),
      isContractor: employee.isContractor
    };
    setAttendance(newAttendance);
    
    const newSearch = [...employeeSearch];
    newSearch[index] = "";
    setEmployeeSearch(newSearch);
  };

  const handleEmployeeSearchChange = (index: number, value: string) => {
    const newSearch = [...employeeSearch];
    newSearch[index] = value;
    setEmployeeSearch(newSearch);
    
    if (!value) {
      const newAttendance = [...attendance];
      newAttendance[index] = {
        employeeName: "",
        role: "",
        dailyRate: "",
        isContractor: false
      };
      setAttendance(newAttendance);
    }
  };

  const getFilteredEmployees = (searchTerm: string) => {
    if (!employees || !searchTerm) return [];
    return employees.filter((emp: Employee) => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const calculateTotalCost = () => {
    return attendance.reduce((total, record) => {
      return total + (parseFloat(record.dailyRate) || 0);
    }, 0);
  };

  const handleSave = () => {
    const validAttendance = attendance.filter(record => 
      record.employeeName && record.role && record.dailyRate
    );
    
    if (!formData.activities.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva as atividades realizadas",
        variant: "destructive",
      });
      return;
    }
    
    createDiaryMutation.mutate({
      date: selectedDate.toISOString().split('T')[0],
      activities: formData.activities,
      photos: formData.photos,
      attendance: validAttendance
    });
  };

  const addMoreSlots = () => {
    const additionalSlots = Array(5).fill(null).map(() => ({
      employeeName: "",
      role: "",
      dailyRate: "",
      isContractor: false
    }));
    setAttendance([...attendance, ...additionalSlots]);
    setEmployeeSearch([...employeeSearch, ...Array(5).fill("")]);
  };

  const removeSlot = (index: number) => {
    if (attendance.length <= 7) return;
    
    const newAttendance = attendance.filter((_, i) => i !== index);
    const newSearch = employeeSearch.filter((_, i) => i !== index);
    setAttendance(newAttendance);
    setEmployeeSearch(newSearch);
  };

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
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name} - {project.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-1">
            <DiaryCalendar
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
              }}
              datesWithEntries={datesWithEntries}
            />
          </div>

          {/* Formulário de Registro */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {currentEntry ? "Editar" : "Novo"} Registro - {selectedDate.toLocaleDateString('pt-BR')}
                  </span>
                  <Button onClick={handleSave} disabled={createDiaryMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {createDiaryMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Funcionários Presentes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Funcionários Presentes</Label>
                    <div className="text-sm text-muted-foreground">
                      Custo Total do Dia: R$ {calculateTotalCost().toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {attendance.map((record, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Funcionário {index + 1}</h4>
                          {index >= 7 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSlot(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Busca de Funcionário */}
                          <div className="relative">
                            <Label>Buscar Funcionário</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Nome ou função..."
                                value={employeeSearch[index]}
                                onChange={(e) => handleEmployeeSearchChange(index, e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            
                            {/* Lista de Sugestões */}
                            {employeeSearch[index] && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {getFilteredEmployees(employeeSearch[index]).map((employee: Employee) => (
                                  <button
                                    key={employee.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                                    onClick={() => handleEmployeeSelect(index, employee)}
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
                                {getFilteredEmployees(employeeSearch[index]).length === 0 && (
                                  <div className="px-3 py-2 text-muted-foreground">
                                    Nenhum funcionário encontrado
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Nome */}
                          <div>
                            <Label>Nome</Label>
                            <Input
                              value={record.employeeName}
                              onChange={(e) => {
                                const newAttendance = [...attendance];
                                newAttendance[index].employeeName = e.target.value;
                                setAttendance(newAttendance);
                              }}
                              placeholder="Nome do funcionário"
                            />
                          </div>

                          {/* Função */}
                          <div>
                            <Label>Função</Label>
                            <Input
                              value={record.role}
                              onChange={(e) => {
                                const newAttendance = [...attendance];
                                newAttendance[index].role = e.target.value;
                                setAttendance(newAttendance);
                              }}
                              placeholder="Ex: Pedreiro, Servente"
                            />
                          </div>

                          {/* Diária */}
                          <div>
                            <Label>Valor da Diária (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={record.dailyRate}
                              onChange={(e) => {
                                const newAttendance = [...attendance];
                                newAttendance[index].dailyRate = e.target.value;
                                setAttendance(newAttendance);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        {record.isContractor && (
                          <Badge variant="outline" className="mt-2">Empreiteiro</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botão para adicionar mais funcionários */}
                  {attendance.length < 20 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMoreSlots}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Mais Funcionários
                    </Button>
                  )}
                </div>

                {/* Atividades */}
                <div>
                  <Label htmlFor="activities">Atividades Realizadas</Label>
                  <Textarea
                    id="activities"
                    value={formData.activities}
                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    placeholder="Descreva as atividades realizadas no dia..."
                    rows={4}
                  />
                </div>

                {/* Upload de Fotos */}
                <div>
                  <Label>Fotos da Obra</Label>
                  <PhotoUpload
                    onMultiplePhotos={(photos) => setFormData({ ...formData, photos })}
                    label="Adicionar fotos do progresso da obra"
                    multiple={true}
                  />
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}