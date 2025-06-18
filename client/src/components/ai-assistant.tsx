import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Mic, Camera, X, Loader2 } from "lucide-react";
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
  const [response, setResponse] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isOpen,
  });

  const processMutation = useMutation({
    mutationFn: async ({ command, projectId }: { command: string; projectId: string }) => {
      const response = await apiRequest("POST", "/api/ai/process", { command, projectId });
      return response.json();
    },
    onSuccess: (data) => {
      setResponse(data);
      if (data.success) {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        if (selectedProjectId) {
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/expenses`] });
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/diaries`] });
        }
        toast({
          title: "Sucesso!",
          description: data.message,
        });
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao processar comando da IA",
        variant: "destructive",
      });
      console.error("AI processing error:", error);
    },
  });

  const handleProcess = () => {
    if (!command.trim()) {
      toast({
        title: "Erro",
        description: "Digite um comando para processar",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: "Erro",
        description: "Selecione uma obra para registrar os dados",
        variant: "destructive",
      });
      return;
    }

    processMutation.mutate({ command, projectId: selectedProjectId });
  };

  const handleClear = () => {
    setCommand("");
    setResponse(null);
    setSelectedProjectId("");
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const handleVoiceInput = () => {
    // Mock voice input for demonstration
    const mockCommands = [
      "gastei 30 reais com cimento na obra",
      "hoje estiveram presentes João e Pedro fazendo reboco",
      "comprei 5 sacos de areia por 25 reais cada",
      "funcionários Carlos e Ana fizeram instalação elétrica"
    ];
    const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
    setCommand(randomCommand);
    toast({
      title: "Comando de voz simulado",
      description: "Em produção, isso usaria reconhecimento de voz real",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 construction-secondary rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span>Assistente IA</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione a Obra
            </label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma obra..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Command Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Como posso ajudar?
            </label>
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Digite ou use comando de voz: 'gastei 50 reais com cimento' ou 'hoje estiveram presentes João e Pedro fazendo reboco'"
              className="h-32 resize-none"
            />
          </div>

          {/* Voice and Photo Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleVoiceInput}
              className="flex items-center space-x-2"
            >
              <Mic className="h-4 w-4" />
              <span>Comando de Voz</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              disabled
            >
              <Camera className="h-4 w-4" />
              <span>Foto de Comprovante</span>
            </Button>
          </div>

          {/* AI Response */}
          {response && (
            <div className={`rounded-lg p-4 ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${response.success ? 'construction-success' : 'construction-error'}`}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${response.success ? 'text-green-800' : 'text-red-800'}`}>
                    {response.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleProcess}
              disabled={processMutation.isPending}
              className="flex-1 construction-primary"
            >
              {processMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Processar Comando"
              )}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
