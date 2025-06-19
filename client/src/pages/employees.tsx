import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";

export default function Employees() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggleAI={() => setAiOpen(!aiOpen)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Funcionários"
          subtitle="Cadastre e gerencie funcionários e empreiteiros"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Cadastro de Funcionário */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Cadastro de Funcionário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Cadastre um novo funcionário ou empreiteiro</p>
                <Link href="/employee-registration">
                  <Button size="lg" className="w-full">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Cadastro
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Lista de Funcionários */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Lista de Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Visualize e gerencie todos os funcionários</p>
                <Link href="/employee-list">
                  <Button variant="outline" size="lg" className="w-full">
                    <Search className="h-5 w-5 mr-2" />
                    Ver Lista
                  </Button>
                </Link>
              </CardContent>
            </Card>
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