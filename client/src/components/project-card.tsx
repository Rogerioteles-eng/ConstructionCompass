import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, User, Calendar, Eye } from "lucide-react";
import { STATUS_COLORS, PROJECT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    address: string;
    client: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  onView: (id: number) => void;
}

export default function ProjectCard({ project, onView }: ProjectCardProps) {
  const getProgressPercentage = () => {
    // Mock progress calculation - in real app this would come from measurements/schedule
    const statusProgress = {
      [PROJECT_STATUS.PLANNING]: 15,
      [PROJECT_STATUS.EXECUTION]: 65,
      [PROJECT_STATUS.PAUSED]: 45,
      [PROJECT_STATUS.COMPLETED]: 100,
    };
    return statusProgress[project.status as keyof typeof statusProgress] || 0;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      [PROJECT_STATUS.PLANNING]: "Planejamento",
      [PROJECT_STATUS.EXECUTION]: "Em Execução",
      [PROJECT_STATUS.PAUSED]: "Pausada",
      [PROJECT_STATUS.COMPLETED]: "Concluída",
    };
    return labels[status as keyof typeof labels] || "Desconhecido";
  };

  const getProgressColor = () => {
    const progress = getProgressPercentage();
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 construction-primary rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {project.address}
              </div>
            </div>
          </div>
          <Badge className={cn("text-xs", STATUS_COLORS[project.status as keyof typeof STATUS_COLORS])}>
            {getStatusLabel(project.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            Cliente: {project.client}
          </div>
          {project.startDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progresso</span>
            <span>{getProgressPercentage()}% concluído</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full transition-all", getProgressColor())}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onView(project.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
