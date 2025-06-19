import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Share2, Image, FileText, Plus, Download, Trash2, FolderPlus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { saveAs } from "file-saver";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

interface DiaryImage {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  photos: string[];
}

interface ExpenseDocument {
  id: number;
  date: string;
  projectId: number;
  projectName: string;
  description: string;
  receipt?: string;
  amount: number;
}

export default function Share() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

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

  // Fetch diary images grouped by date
  const { data: diaryImages = [], isLoading: loadingImages } = useQuery<DiaryImage[]>({
    queryKey: ["/api/share/images"],
  });

  // Fetch expense documents grouped by date
  const { data: expenseDocuments = [], isLoading: loadingDocuments } = useQuery<ExpenseDocument[]>({
    queryKey: ["/api/share/documents"],
  });

  // Group images by date
  const imagesByDate = diaryImages.reduce((acc, diary) => {
    const date = diary.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(diary);
    return acc;
  }, {} as Record<string, DiaryImage[]>);

  // Group documents by date
  const documentsByDate = expenseDocuments.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, ExpenseDocument[]>);

  // Sort dates in descending order
  const sortedImageDates = Object.keys(imagesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const sortedDocumentDates = Object.keys(documentsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Export image function
  const handleExportImage = async (imageUrl: string, projectName: string, date: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const fileName = `${projectName}_${date}_foto_${index + 1}.jpg`;
      saveAs(blob, fileName);
      
      toast({
        title: "Imagem exportada",
        description: `Imagem salva como ${fileName}`,
      });
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar a imagem",
        variant: "destructive",
      });
    }
  };

  // Export document function
  const handleExportDocument = async (documentUrl: string, description: string, date: string) => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const fileName = `${description}_${date}.pdf`;
      saveAs(blob, fileName);
      
      toast({
        title: "Documento exportado",
        description: `Documento salvo como ${fileName}`,
      });
    } catch (error) {
      console.error('Erro ao exportar documento:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o documento",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:from-gray-900 dark:to-gray-800">
      <Sidebar isOpen={sidebarOpen} onToggleAI={() => setAiOpen(!aiOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Compartilhamento" 
          subtitle="Organize e compartilhe fotos e documentos dos projetos"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100">Compartilhamento</span>
            </nav>

            <Tabs defaultValue="images" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Imagens
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos
                </TabsTrigger>
              </TabsList>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Imagens do Diário de Obras</h3>
                  <div className="flex gap-2">
                    <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Criar Pasta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Nova Pasta</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="folder-name">Nome da Pasta</Label>
                            <Input
                              id="folder-name"
                              value={folderName}
                              onChange={(e) => setFolderName(e.target.value)}
                              placeholder="Digite o nome da pasta"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={() => {
                              // TODO: Implement folder creation
                              toast({
                                title: "Pasta criada",
                                description: `Pasta "${folderName}" criada com sucesso`,
                              });
                              setFolderName("");
                              setIsCreateFolderOpen(false);
                            }}>
                              Criar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {loadingImages ? (
                  <div className="text-center py-8">Carregando imagens...</div>
                ) : sortedImageDates.length > 0 ? (
                  <div className="space-y-6">
                    {sortedImageDates.map((date) => (
                      <Card key={date}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{format(new Date(date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                            <Badge variant="secondary">
                              {imagesByDate[date].reduce((total, diary) => total + diary.photos.length, 0)} imagens
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {imagesByDate[date].map((diary) =>
                              diary.photos.map((photo, index) => (
                                <div key={`${diary.id}-${index}`} className="aspect-square bg-muted rounded-lg overflow-hidden border relative group">
                                  <img
                                    src={photo}
                                    alt={`${diary.projectName} - ${date}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleExportImage(photo, diary.projectName, date, index)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          // TODO: Implement image deletion
                                          toast({
                                            title: "Imagem removida",
                                            description: "Imagem removida com sucesso",
                                          });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                                    <p className="text-xs truncate">{diary.projectName}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma imagem encontrada no diário de obras</p>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Documentos de Gastos</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Criar Pasta
                    </Button>
                  </div>
                </div>

                {loadingDocuments ? (
                  <div className="text-center py-8">Carregando documentos...</div>
                ) : sortedDocumentDates.length > 0 ? (
                  <div className="space-y-6">
                    {sortedDocumentDates.map((date) => (
                      <Card key={date}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{format(new Date(date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                            <Badge variant="secondary">
                              {documentsByDate[date].length} documentos
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {documentsByDate[date].map((expense) => (
                              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-blue-500" />
                                  <div>
                                    <p className="font-medium">{expense.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {expense.projectName} • R$ {expense.amount.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {expense.receipt && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleExportDocument(expense.receipt!, expense.description, date)}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Baixar
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      // TODO: Implement document deletion
                                      toast({
                                        title: "Documento removido",
                                        description: "Documento removido com sucesso",
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum documento encontrado nos gastos</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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