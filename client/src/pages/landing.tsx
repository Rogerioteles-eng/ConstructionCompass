import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, HardHat, CheckCircle, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2 text-orange-600">
          <Building2 className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-900">ConstructionCompass</span>
        </div>
        <Link href="/auth">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            Entrar
          </Button>
        </Link>
      </header>

      {/* Secção Principal (Hero) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="bg-orange-100 p-4 rounded-full mb-6">
          <HardHat className="h-12 w-12 text-orange-600" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 max-w-3xl">
          Gestão Inteligente para a sua Obra
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl">
          O ConstructionCompass é o sistema definitivo para engenheiros e mestres de obra. 
          Controle orçamentos, diários de obra, fornecedores e muito mais num só lugar.
        </p>
        
        <Link href="/auth">
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6">
            Começar Agora
          </Button>
        </Link>

        {/* Cartões de Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl w-full text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Diário de Obras</h3>
            <p className="text-gray-600">Registe as atividades diárias facilmente usando o nosso assistente inteligente.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <BarChart3 className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Controlo Financeiro</h3>
            <p className="text-gray-600">Acompanhe orçamentos, gastos e medições em tempo real de forma simples.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <Building2 className="h-10 w-10 text-orange-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Gestão Integrada</h3>
            <p className="text-gray-600">Mantenha fornecedores, cotações e materiais organizados por projeto.</p>
          </div>
        </div>
      </main>

      {/* Rodapé Corrigido */}
      <footer className="bg-gray-900 text-white py-12 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-orange-500" />
            <h4 className="text-lg font-bold">ConstructionCompass</h4>
          </div>
          <p className="text-gray-400 text-center">
            © 2025 ConstructionCompass. Sistema profissional de gestão de obras.
          </p>
        </div>
      </footer>
    </div>
  );
}