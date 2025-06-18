import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Mic, Camera, FileText, Upload, Play, Square } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [command, setCommand] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isOpen,
  });

  const projectsList = Array.isArray(projects) ? projects : [];

  const processMutation = useMutation({
    mutationFn: async (data: { command: string; projectId?: string }) => {
      return await apiRequest("/api/ai/process", "POST", data);
    },
    onSuccess: (response: any) => {
      setLastResult(response);
      toast({
        title: "Comando Processado pela IA",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      });
      if (response.success) {
        setCommand("");
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        if (selectedProjectId) {
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/expenses`] });
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/diaries`] });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na IA",
        description: "Falha ao processar comando com OpenAI",
        variant: "destructive",
      });
    },
  });

  const transcribeMutation = useMutation({
    mutationFn: async (audioFile: FormData) => {
      return await fetch("/api/ai/transcribe-audio", {
        method: "POST",
        body: audioFile,
      }).then(res => res.json());
    },
    onSuccess: (response) => {
      if (response.success) {
        setCommand(response.transcription);
        toast({
          title: "Áudio Transcrito",
          description: "Comando extraído do áudio com sucesso",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro na Transcrição",
        description: "Falha ao transcrever áudio",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (imageFile: FormData) => {
      return await fetch("/api/ai/analyze-image", {
        method: "POST",
        body: imageFile,
      }).then(res => res.json());
    },
    onSuccess: (response) => {
      if (response.success) {
        setCommand(prev => prev + (prev ? "\n\n" : "") + "Análise da imagem: " + response.analysis);
        toast({
          title: "Imagem Analisada",
          description: "Informações extraídas da imagem",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro na Análise",
        description: "Falha ao analisar imagem",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    processMutation.mutate({ 
      command, 
      projectId: selectedProjectId || undefined 
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Automatically transcribe
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        transcribeMutation.mutate(formData);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Erro no Microfone",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const formData = new FormData();
      formData.append('image', file);
      analyzeMutation.mutate(formData);
    } else {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  };

  const exampleCommands = [
    "Na obra Jardim Europa, hoje trabalharam João (pedreiro) e José (ajudante). Colocaram 40 m² de piso e gastei R$ 280 com argamassa.",
    "Gastei R$ 150 com cimento e R$ 80 com areia para a fundação",
    "Hoje estiveram presentes Maria (eletricista) e Pedro (encanador) trabalhando 8 horas cada",
    "Executaram 25 m² de reboco na sala e 15 m² no quarto"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🤖 Assistente IA - MindMapMaster
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Selection */}
          {projectsList.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Projeto (opcional)</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto ou deixe em branco para auto-detectar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-detectar projeto</SelectItem>
                  {projectsList.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} - {project.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Command Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Digite ou grave seu comando aqui..."
                className="min-h-[100px]"
                disabled={processMutation.isPending}
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="submit"
                  disabled={processMutation.isPending || !command.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {processMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Processar Comando
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVoiceRecord}
                  disabled={transcribeMutation.isPending}
                  className={isRecording ? "bg-red-100 text-red-700 border-red-300" : ""}
                >
                  {transcribeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isRecording ? (
                    <Square className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  {isRecording ? "Parar Gravação" : "Gravar Voz"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImageUpload}
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Analisar Foto
                </Button>

                {audioBlob && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={playAudio}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reproduzir Áudio
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Example Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Exemplos de Comandos</CardTitle>
                <CardDescription>
                  Clique nos exemplos para testar a IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exampleCommands.map((example, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setCommand(example)}
                  >
                    <p className="text-sm">{example}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Last Result */}
            {lastResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Último Resultado</CardTitle>
                  <CardDescription>
                    {lastResult.success ? "Processado com sucesso" : "Erro no processamento"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lastResult.success && lastResult.aiResult && (
                    <div className="space-y-2">
                      <Badge variant="outline" className="mb-2">
                        Tipo: {lastResult.aiResult.type}
                      </Badge>
                      {lastResult.aiResult.projectName && (
                        <p className="text-sm">
                          <strong>Projeto:</strong> {lastResult.aiResult.projectName}
                        </p>
                      )}
                      {lastResult.processedData && (
                        <div className="space-y-1 text-sm">
                          {lastResult.processedData.expenses?.length > 0 && (
                            <p>✅ {lastResult.processedData.expenses.length} gasto(s) registrado(s)</p>
                          )}
                          {lastResult.processedData.diaryEntries?.length > 0 && (
                            <p>✅ {lastResult.processedData.diaryEntries.length} entrada(s) no diário</p>
                          )}
                          {lastResult.processedData.measurementNotes?.length > 0 && (
                            <p>📝 {lastResult.processedData.measurementNotes.length} medição(ões) anotada(s)</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {lastResult.message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como Usar a IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Texto
                  </Badge>
                  <p className="text-muted-foreground">
                    Digite comandos em linguagem natural como "gastei R$ 100 com cimento"
                  </p>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    <Mic className="h-3 w-3 mr-1" />
                    Voz
                  </Badge>
                  <p className="text-muted-foreground">
                    Grave comandos falados que serão transcritos automaticamente
                  </p>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    <Camera className="h-3 w-3 mr-1" />
                    Imagem
                  </Badge>
                  <p className="text-muted-foreground">
                    Envie fotos da obra para análise automática de materiais e progresso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}