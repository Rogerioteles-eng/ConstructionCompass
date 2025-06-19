import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, DollarSign } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIAssistant from "@/components/ai-assistant";

export default function Employees() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:from-gray-900 dark:to-gray-800">
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100">Funcionários</span>
            </nav>

            <h1 className="text-2xl font-semibold mb-6">Funcionários</h1>

            {/* Cadastro de Funcionário */}
            <Card>
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
            <Card>
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

            {/* Custos de Funcionários */}
            <Card>
              <CardHeader>
                <CardTitle>Custos de Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Análise de custos por funcionário e período</p>
                <Link href="/employee-costs">
                  <Button variant="outline" size="lg" className="w-full">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Ver Custos
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