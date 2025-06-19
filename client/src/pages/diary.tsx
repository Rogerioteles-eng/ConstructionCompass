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
import { Calendar, Plus, X, Search, Save, Camera, ArrowLeft, Eye, Edit, Trash2 } from "lucide-react";
import PhotoUpload from "@/components/photo-upload";
import { Badge } from "@/components/ui/badge";
import DiaryCalendar from "@/components/diary-calendar";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { isUnauthorizedError } from "@/lib/authUtils";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activities: "",
    photos: [] as string[]
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<SelectedEmployee[]>([]);

  // Função para abrir diário para criar novo ou mostrar opções  
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const diary = Array.isArray(diaries) ? diaries.find((d: any) => d.date === dateStr) : null;
    
    if (!diary) {
      // Não existe diário, criar novo
      setSelectedDate(date);
      setFormData({
        date: dateStr,
        activities: "",
        photos: []
      });
      setSelectedEmployees([]);
      setSelectedContractors([]);
      setIsEditMode(false);
      setIsDialogOpen(true);
    } else {
      // Existe diário, mostrar opções
      setSelectedDiary(diary);
      setSelectedDate(date);
      setIsOptionsDialogOpen(true);
    }
  };

  // Função para iniciar edição
  const handleEdit = () => {
    if (selectedDiary) {
      setFormData({
        date: selectedDiary.date,
        activities: selectedDiary.activities || "",
        photos: selectedDiary.photos || []
      });
      
      // Carregar funcionários do diário
      const diaryEmployees = selectedDiary.attendance?.map((att: any) => ({
        id: att.employeeId,
        name: att.employeeName,
        role: att.role,
        dailyRate: parseFloat(att.dailyRate || 0),
        isContractor: att.isContractor
      })) || [];
      
      setSelectedEmployees(diaryEmployees.filter((emp: any) => !emp.isContractor));
      setSelectedContractors(diaryEmployees.filter((emp: any) => emp.isContractor));
      
      setIsEditing(true);
      setIsViewDialogOpen(false);
      setIsDialogOpen(true);
    }
  };

  // Função para exportar PDF
  const handleExportPDF = () => {
    if (!selectedDiary) return;

    const projectName = Array.isArray(projects) ? projects.find((p: any) => p.id === selectedProjectId)?.name || "Projeto" : "Projeto";
    const date = new Date(selectedDiary.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const totalCost = selectedDiary.attendance?.reduce((total: number, att: any) => total + Number(att.dailyRate || 0), 0) || 0;

    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diário de Obras - ${date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .employee-list { margin-top: 10px; }
          .employee-item { padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
          .employee-info { display: flex; justify-content: between; }
          .total-cost { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .activities { background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Diário de Obras</h1>
          <h2>${projectName}</h2>
          <h3>Data: ${date}</h3>
        </div>
        
        <div class="section">
          <div class="section-title">Atividades Realizadas</div>
          <div class="activities">${selectedDiary.activities || "Nenhuma atividade registrada"}</div>
        </div>

        ${selectedDiary.attendance && selectedDiary.attendance.length > 0 ? `
        <div class="section">
          <div class="section-title">Funcionários Presentes</div>
          <div class="employee-list">
            ${selectedDiary.attendance.map((att: any) => `
              <div class="employee-item">
                <div class="employee-info">
                  <span><strong>${att.employeeName}</strong> (${att.role}) - ${att.isContractor ? 'Empreiteiro' : 'Funcionário'}</span>
                  <span>R$ ${Number(att.dailyRate || 0).toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="total-cost">
          <strong>Custo Total do Dia: R$ ${totalCost.toFixed(2)}</strong>
        </div>
      </body>
      </html>
    `;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isAuthenticated) {
    return <div>Por favor, faça login para acessar o diário de obras.</div>;
  }

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: diaries, isLoading: loadingDiaries } = useQuery({
    queryKey: [`/api/projects/${selectedProjectId}/diaries`],
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
      return await apiRequest("POST", `/api/projects/${selectedProjectId}/diaries`, data);
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Registro salvo com sucesso!" });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/diaries`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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

  const deleteDiaryMutation = useMutation({
    mutationFn: async (diaryId: number) => {
      return await apiRequest("DELETE", `/api/diaries/${diaryId}`);
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Diário excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/diaries`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsOptionsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir diário",
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
    const employeeCost = selectedEmployees.reduce((total, emp) => total + Number(emp.dailyRate || 0), 0);
    const contractorCost = selectedContractors.reduce((total, emp) => total + Number(emp.dailyRate || 0), 0);
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
        employeeId: Number(emp.id),
        employeeName: emp.name || '',
        role: emp.role || '',
        dailyRate: Number(emp.dailyRate || 0).toString(),
        isContractor: Boolean(emp.isContractor)
      })),
      ...selectedContractors.map(emp => ({
        employeeId: Number(emp.id),
        employeeName: emp.name || '',
        role: emp.role || '',
        dailyRate: Number(emp.dailyRate || 0).toString(),
        isContractor: Boolean(emp.isContractor)
      }))
    ];

    console.log('Dados a serem enviados:', {
      date: formData.date,
      activities: formData.activities,
      photos: formData.photos,
      attendance: allAttendance
    });
    
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
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Diário de Obras" 
          subtitle="Controle de atividades e presença"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
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
              {Array.isArray(projects) && projects.map((project: any) => (
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
          {/* Botões para Novo Registro e Visualizar Existentes */}
          <div className="mb-6 space-y-4">
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
                                <SelectItem value="no-employees">
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
                                <SelectItem value="no-contractors">
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
                          Funcionários ({selectedEmployees.length}): R$ {selectedEmployees.reduce((total, emp) => total + Number(emp.dailyRate || 0), 0).toFixed(2)}
                        </div>
                      )}
                      {selectedContractors.length > 0 && (
                        <div className="text-sm text-green-700">
                          Empreiteiros ({selectedContractors.length}): R$ {selectedContractors.reduce((total, emp) => total + Number(emp.dailyRate || 0), 0).toFixed(2)}
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
            onDateSelect={handleDateClick}
            datesWithEntries={datesWithEntries}
          />

          {/* Diálogo de Opções para Diário Existente */}
          <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Diário de {selectedDate.toLocaleDateString('pt-BR')}
                </DialogTitle>
              </DialogHeader>
              
              {selectedDiary && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Atividades:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDiary.activities?.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedDiary.attendance?.length || 0} funcionário(s) presente(s)
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        setIsOptionsDialogOpen(false);
                        setIsViewDialogOpen(true);
                      }}
                      className="w-full justify-start"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar Diário
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          date: selectedDiary.date,
                          activities: selectedDiary.activities || '',
                          photos: selectedDiary.photos || []
                        });
                        // Pre-populate employees from attendance
                        if (selectedDiary.attendance) {
                          const employees = selectedDiary.attendance.filter((att: any) => !att.isContractor);
                          const contractors = selectedDiary.attendance.filter((att: any) => att.isContractor);
                          setSelectedEmployees(employees.map((att: any) => ({
                            id: att.employeeId,
                            name: att.employeeName,
                            role: att.role,
                            dailyRate: Number(att.dailyRate),
                            isContractor: false
                          })));
                          setSelectedContractors(contractors.map((att: any) => ({
                            id: att.employeeId,
                            name: att.employeeName,
                            role: att.role,
                            dailyRate: Number(att.dailyRate),
                            isContractor: true
                          })));
                        }
                        setIsOptionsDialogOpen(false);
                        setIsEditMode(true);
                        setIsDialogOpen(true);
                      }}
                      className="w-full justify-start"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Diário
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este diário? Esta ação não pode ser desfeita.')) {
                          deleteDiaryMutation.mutate(selectedDiary.id);
                        }
                      }}
                      disabled={deleteDiaryMutation.isPending}
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteDiaryMutation.isPending ? "Excluindo..." : "Excluir Diário"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Diálogo de Visualização de Diário */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Diário de Obras - {selectedDiary?.date && new Date(selectedDiary.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </DialogTitle>
              </DialogHeader>
              
              {selectedDiary && (
                <div className="space-y-6">
                  {/* Atividades */}
                  <div>
                    <Label className="text-base font-semibold">Atividades Realizadas</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedDiary.activities || "Nenhuma atividade registrada"}</p>
                    </div>
                  </div>

                  {/* Funcionários Presentes */}
                  {selectedDiary.attendance && selectedDiary.attendance.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Funcionários Presentes</Label>
                      <div className="mt-2 space-y-2">
                        {selectedDiary.attendance.map((att: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={att.isContractor ? "secondary" : "default"}>
                                {att.isContractor ? "Empreiteiro" : "Funcionário"}
                              </Badge>
                              <span className="font-medium">{att.employeeName}</span>
                              <span className="text-muted-foreground">({att.role})</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">R$ {Number(att.dailyRate || 0).toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">Diária</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custo Total */}
                  {selectedDiary.attendance && selectedDiary.attendance.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800">
                        Custo Total do Dia: R$ {selectedDiary.attendance.reduce((total: number, att: any) => total + Number(att.dailyRate || 0), 0).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Fotos */}
                  {selectedDiary.photos && selectedDiary.photos.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Fotos</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedDiary.photos.map((photo: string, index: number) => (
                          <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <img
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-2">
                    <Button onClick={handleEdit} variant="outline" className="flex-1">
                      Editar Registro
                    </Button>
                    <Button onClick={handleExportPDF} className="flex-1">
                      Exportar PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
          </div>
        </main>
      </div>
      
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}