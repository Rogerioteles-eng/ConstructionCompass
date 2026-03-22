import { Link, useLocation, useParams, Outlet } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, Share2, Truck, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ProjectLayout() {
  const location = useLocation();
  const { projectId } = useParams();

  const navItems = [
    { path: "diary", label: "Diário de Obras", icon: BookOpen },
    { path: "employees", label: "Funcionários", icon: Users },
    { path: "share", label: "Compartilhamento", icon: Share2 },
    { path: "suppliers", label: "Fornecedores", icon: Truck },
    { path: "quotations", label: "Mapas de Cotações", icon: MapPin },
    { path: "registers", label: "Registros", icon: FileText },
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Obras
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Obra {projectId}</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const itemPath = `/projects/${projectId}/${item.path}`;
              const isActive = location.pathname.includes(item.path);

              return (
                <Link key={item.path} to={itemPath}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2",
                      isActive && "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* É aqui que as páginas filhas (Fornecedores, Cotações, etc) vão aparecer */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Outlet />
      </div>
    </div>
  );
}