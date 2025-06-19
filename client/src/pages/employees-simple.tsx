import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Users, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function Employees() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Funcionários</h1>
          <p className="text-gray-600">Cadastre e gerencie funcionários e empreiteiros</p>
        </div>

        {/* Botões de navegação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/employee-registration">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <UserPlus className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                <CardTitle>Cadastro de Funcionário</CardTitle>
                <CardDescription>
                  Cadastre um novo funcionário ou empreiteiro
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full">
                  Novo Cadastro
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employee-list">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto text-green-600 mb-2" />
                <CardTitle>Lista de Funcionários</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os funcionários
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" variant="outline">
                  Ver Lista
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/employee-costs">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <DollarSign className="w-12 h-12 mx-auto text-orange-600 mb-2" />
                <CardTitle>Custos de Funcionários</CardTitle>
                <CardDescription>
                  Analise custos por data, obra e função
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" variant="outline">
                  Ver Custos
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema de Funcionários</CardTitle>
            <CardDescription>
              Gerencie funcionários e empreiteiros de forma centralizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Cadastro</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cadastro único para toda a empresa</li>
                  <li>• Funções pré-definidas com opção "Outros"</li>
                  <li>• Separação entre funcionários e empreiteiros</li>
                  <li>• Dados de contato e documentos</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Controle</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Filtros avançados por função, tipo e status</li>
                  <li>• Edição de dados dos funcionários</li>
                  <li>• Controle de status: ativo, inativo, afastado</li>
                  <li>• Relatórios de custos por período</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}