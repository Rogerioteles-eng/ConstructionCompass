import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Share2, Image, FileText, Download, Building2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { saveAs } from "file-saver";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";
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
  workId: number;
  date: string;
  projectName: string;
  name: string;
  url: string;
  amount: number;
}

export default function Share() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("images");
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você foi deslogado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch diary images
  const { data: images = [], isLoading: imagesLoading } = useQuery<DiaryImage[]>({
    queryKey: ["/api/share/images"],
    enabled: isAuthenticated,
    onSuccess: (data) => {
      console.log("Raw images data:", data);
    }
  });

  // Fetch expense documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<ExpenseDocument[]>({
    queryKey: ["/api/share/documents"],
    enabled: isAuthenticated,
  });

  // Group images by project only  
  const groupedImages = (images as DiaryImage[]).reduce((acc: any, image: DiaryImage) => {
    const projectKey = image.projectName;
    
    if (!acc[projectKey]) {
      acc[projectKey] = [];
    }
    
    // Only add photos if they exist and are valid
    if (image.photos && Array.isArray(image.photos) && image.photos.length > 0) {
      // Ensure we have a valid date
      const dateObj = new Date(image.date);
      const isValidDate = dateObj instanceof Date && !isNaN(dateObj.getTime());
      
      if (isValidDate) {
        image.photos.forEach((photo, index) => {
          // Only add photo if it's not empty
          if (photo && photo.trim() !== '') {
            acc[projectKey].push({
              id: `${image.id}_${index}_${Date.now()}`, // Make unique ID
              projectName: image.projectName,
              date: image.date,
              formattedDate: format(dateObj, 'dd/MM/yyyy', { locale: ptBR }),
              url: photo,
              filename: `${image.projectName}_${format(dateObj, 'dd-MM-yyyy')}_foto_${index + 1}.jpg`
            });
          }
        });
      }
    }
    
    return acc;
  }, {});

  // Group documents by project only (filter only those with actual files)
  const groupedDocuments = (documents as ExpenseDocument[]).filter(doc => doc.url && doc.url.trim() !== '').reduce((acc: any, doc: ExpenseDocument) => {
    const projectKey = doc.projectName;
    
    if (!acc[projectKey]) {
      acc[projectKey] = [];
    }
    
    acc[projectKey].push({
      ...doc,
      formattedDate: format(new Date(doc.date), 'dd/MM/yyyy', { locale: ptBR }),
      filename: `${doc.projectName}_${format(new Date(doc.date), 'dd-MM-yyyy')}_recibo_${doc.name}.jpg`
    });
    
    return acc;
  }, {});

  // Get list of projects with content
  const projectsWithImages = Object.keys(groupedImages);
  const projectsWithDocuments = Object.keys(groupedDocuments);

  // Handle file download
  const handleDownload = (dataUrl: string, filename: string) => {
    try {
      const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      saveAs(blob, filename);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-gray-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggleAI={() => setAiOpen(!aiOpen)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Compartilhamento"
          subtitle="Organize e compartilhe fotos e documentos"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100">Compartilhamento</span>
            </nav>

            <h1 className="text-2xl font-semibold mb-6">Compartilhamento</h1>

            <Tabs 
              value={activeTab} 
              onValueChange={(value) => {
                setActiveTab(value);
                setSelectedProject(null);
              }} 
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Imagens ({projectsWithImages.length} projeto(s))
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos ({projectsWithDocuments.length} projeto(s))
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="space-y-6">
                {imagesLoading ? (
                  <div className="text-center py-8">Carregando imagens...</div>
                ) : selectedProject === null ? (
                  // Show project folders
                  projectsWithImages.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center text-gray-500">
                          <Image className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>Nenhuma imagem encontrada</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectsWithImages.map((projectName) => (
                        <Card key={projectName} className="hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => setSelectedProject(projectName)}>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-8 w-8 text-blue-500" />
                              <div>
                                <h3 className="font-semibold text-lg">{projectName}</h3>
                                <p className="text-sm text-gray-500">
                                  {groupedImages[projectName].length} foto(s)
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  // Show selected project content
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedProject(null)}
                      >
                        ← Voltar para pastas
                      </Button>
                      <h2 className="text-xl font-semibold">{selectedProject}</h2>
                    </div>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {(groupedImages[selectedProject] || []).map((photo: any) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.url}
                                alt={`Foto ${photo.formattedDate}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                                {photo.formattedDate}
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                                onClick={() => handleDownload(photo.url, photo.filename)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                {documentsLoading ? (
                  <div className="text-center py-8">Carregando documentos...</div>
                ) : selectedProject === null ? (
                  // Show project folders
                  projectsWithDocuments.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center text-gray-500">
                          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>Nenhum documento encontrado</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectsWithDocuments.map((projectName) => (
                        <Card key={projectName} className="hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => setSelectedProject(projectName)}>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-8 w-8 text-green-500" />
                              <div>
                                <h3 className="font-semibold text-lg">{projectName}</h3>
                                <p className="text-sm text-gray-500">
                                  {groupedDocuments[projectName].length} documento(s)
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  // Show selected project content
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedProject(null)}
                      >
                        ← Voltar para pastas
                      </Button>
                      <h2 className="text-xl font-semibold">{selectedProject}</h2>
                    </div>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {(groupedDocuments[selectedProject] || []).map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-green-500" />
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {doc.formattedDate} • R$ {Number(doc.amount).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(doc.url, doc.filename)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}