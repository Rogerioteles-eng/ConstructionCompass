import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, X, Lightbulb, MessageSquare, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface ContextualTip {
  id: string;
  title: string;
  description: string;
  type: "tip" | "suggestion" | "feature";
  icon: typeof Lightbulb;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualAITooltipProps {
  onOpenAI: () => void;
}

export default function ContextualAITooltip({ onOpenAI }: ContextualAITooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTips, setCurrentTips] = useState<ContextualTip[]>([]);
  const [location] = useLocation();

  // Context-aware tips based on current page
  const getContextualTips = (path: string): ContextualTip[] => {
    if (path.includes('/diary')) {
      return [
        {
          id: 'diary-voice',
          title: 'Registro por Voz',
          description: 'Use o assistente de IA para criar registros de diário através de comandos de voz',
          type: 'feature',
          icon: Bot,
          action: {
            label: 'Abrir Assistente',
            onClick: onOpenAI
          }
        },
        {
          id: 'diary-photo',
          title: 'Análise de Fotos',
          description: 'O AI pode analisar fotos da obra e gerar descrições automáticas das atividades',
          type: 'tip',
          icon: Lightbulb
        },
        {
          id: 'diary-attendance',
          title: 'Presença Inteligente',
          description: 'Dica: Registre primeiro as atividades, depois adicione os funcionários presentes',
          type: 'suggestion',
          icon: MessageSquare
        }
      ];
    }
    
    if (path.includes('/employees')) {
      return [
        {
          id: 'employee-costs',
          title: 'Análise de Custos',
          description: 'Use o AI para analisar padrões de custos e sugerir otimizações de mão de obra',
          type: 'feature',
          icon: Bot,
          action: {
            label: 'Analisar Custos',
            onClick: onOpenAI
          }
        },
        {
          id: 'employee-roles',
          title: 'Sugestão de Funções',
          description: 'O AI pode sugerir funções adequadas baseado na experiência do funcionário',
          type: 'tip',
          icon: Lightbulb
        }
      ];
    }
    
    if (path.includes('/share')) {
      return [
        {
          id: 'share-organize',
          title: 'Organização Inteligente',
          description: 'O AI pode organizar automaticamente fotos por tipo de atividade ou data',
          type: 'feature',
          icon: Bot,
          action: {
            label: 'Organizar com AI',
            onClick: onOpenAI
          }
        },
        {
          id: 'share-descriptions',
          title: 'Descrições Automáticas',
          description: 'Gere descrições automáticas para fotos usando análise de imagem por AI',
          type: 'tip',
          icon: Lightbulb
        }
      ];
    }
    
    if (path.includes('/suppliers')) {
      return [
        {
          id: 'supplier-analysis',
          title: 'Análise de Fornecedores',
          description: 'Use AI para comparar preços e qualidade de diferentes fornecedores',
          type: 'feature',
          icon: Bot,
          action: {
            label: 'Analisar Fornecedores',
            onClick: onOpenAI
          }
        }
      ];
    }
    
    if (path.includes('/quotations')) {
      return [
        {
          id: 'quotation-smart',
          title: 'Cotações Inteligentes',
          description: 'O AI pode gerar cotações baseado em projetos similares e preços de mercado',
          type: 'feature',
          icon: Bot,
          action: {
            label: 'Gerar Cotação',
            onClick: onOpenAI
          }
        }
      ];
    }

    // Default tips for dashboard or general pages
    return [
      {
        id: 'general-ai',
        title: 'Assistente de IA',
        description: 'Clique no ícone do robô para acessar o assistente de IA em qualquer momento',
        type: 'tip',
        icon: Bot,
        action: {
          label: 'Abrir Assistente',
          onClick: onOpenAI
        }
      },
      {
        id: 'general-voice',
        title: 'Comandos de Voz',
        description: 'Use comandos de voz para registrar informações rapidamente',
        type: 'feature',
        icon: Zap
      }
    ];
  };

  // Update tips when location changes
  useEffect(() => {
    const tips = getContextualTips(location);
    setCurrentTips(tips);
    
    // Show tooltip automatically on page change (with delay)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [location]);

  // Auto-hide after some time
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 15000); // Hide after 15 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const getTypeColor = (type: ContextualTip['type']) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tip':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suggestion':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: ContextualTip['type']) => {
    switch (type) {
      case 'feature':
        return 'Recurso';
      case 'tip':
        return 'Dica';
      case 'suggestion':
        return 'Sugestão';
      default:
        return 'Info';
    }
  };

  if (!isVisible || currentTips.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2 border-blue-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-blue-600" />
              Assistente Contextual
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentTips.slice(0, 2).map((tip) => {
            const IconComponent = tip.icon;
            return (
              <div key={tip.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <IconComponent className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{tip.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0.5 ${getTypeColor(tip.type)}`}
                      >
                        {getTypeLabel(tip.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {tip.description}
                    </p>
                    {tip.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={tip.action.onClick}
                        className="mt-2 h-6 text-xs px-2"
                      >
                        {tip.action.label}
                      </Button>
                    )}
                  </div>
                </div>
                {tip.id !== currentTips[currentTips.length - 1]?.id && (
                  <div className="border-b border-gray-100" />
                )}
              </div>
            );
          })}
          
          {currentTips.length > 2 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAI}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Ver mais dicas no assistente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}