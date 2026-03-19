import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, Building, Calculator, FileText, Calendar, BarChart3, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 construction-primary rounded-lg flex items-center justify-center">
                <HardHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MindMapMaster</h1>
                <p className="text-sm text-gray-500">Gestão de Obras</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="construction-primary"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gerencie suas obras com
            <span className="text-primary"> inteligência</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistema completo para controle de orçamento, medições, diário de obras, cronograma e relatórios. 
            Com assistente de IA para preenchimento automático via comandos de voz e texto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="construction-primary text-lg px-8 py-3"
            >
              Começar Agora
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h3>
            <p className="text-lg text-gray-600">
              Funcionalidades completas para gestão profissional de obras
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Cadastro de Obras</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize seus projetos com informações detalhadas de clientes, endereços e status
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 construction-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Orçamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Estrutura hierárquica em 3 níveis com cálculos automáticos e controle detalhado
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 construction-success rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Diário de Obras</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Registro diário com funcionários, atividades e geração automática de folha de pagamento
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 construction-warning rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Cronograma</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visualização estilo Gantt com controle de prazo e status de execução
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 construction-error rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Relatórios</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gráficos e relatórios detalhados de execução, gastos e produtividade
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Controle de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Perfis de usuário com permissões específicas para cada tipo de colaborador
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Assistente IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Preenchimento automático via comandos de voz, texto e análise de fotos
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <HardHat className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Medições</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Controle de progresso físico das obras com medições por etapa e item
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 construction-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para revolucionar sua gestão de obras?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Comece hoje mesmo e experimente o poder da tecnologia na construção civil.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = '/auth'}
            className="text-lg px-8 py-3"
          >
            Entrar no Sistema
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 construction-primary rounded-lg flex items-center justify-center">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-lg font-bold">MindMapMaster</h4>
            </div>
            <p className="text-gray-400">
              © 2024 MindMapMaster. Sistema profissional de gestão de obras.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
