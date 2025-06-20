import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import ProjectLayout from "@/layouts/ProjectLayout";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import AIAssistant from "@/components/ai-assistant";

export default function Registers() {
  const [aiOpen, setAiOpen] = useState(false);
  const params = useParams();
  const projectId = params.id || "1";

  return (
    <MainLayout onOpenAI={() => setAiOpen(true)}>
      <ProjectLayout projectId={projectId}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cadastros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Módulo de Cadastros em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      </ProjectLayout>
    </MainLayout>
  );
}