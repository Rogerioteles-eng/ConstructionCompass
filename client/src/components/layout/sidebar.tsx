import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  HardHat, 
  Building, 
  Calculator, 
  Receipt, 
  BookOpen, 
  Ruler, 
  Calendar, 
  BarChart3,
  Bot,
  LayoutDashboard,
  Users,
  Share2,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Obras", href: "/projects", icon: Building },
  { name: "Orçamentos", href: "/budget", icon: Calculator },
  { name: "Gastos", href: "/expenses", icon: Receipt },
  { name: "Diário de Obras", href: "/diary", icon: BookOpen },
  { name: "Funcionários", href: "/employees", icon: Users },
  { name: "Custos", href: "/employee-costs", icon: DollarSign },
  { name: "Medições", href: "/measurements", icon: Ruler },
  { name: "Cronograma", href: "/schedule", icon: Calendar },
  { name: "Compartilhamento", href: "/share", icon: Share2 },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onToggleAI: () => void;
}

export default function Sidebar({ isOpen, onToggleAI }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserRole = (role: string) => {
    const roles = {
      admin: "Administrador",
      buyer: "Comprador",
      master: "Mestre de Obra",
      contractor: "Empreiteiro",
      worker: "Funcionário",
      viewer: "Visualizador",
    };
    return roles[role as keyof typeof roles] || "Visualizador";
  };

  return (
    <div className={cn(
      "bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex flex-col h-full",
      isOpen ? "w-64" : "w-0 lg:w-64 overflow-hidden"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 construction-primary rounded-lg flex items-center justify-center">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MindMapMaster</h1>
            <p className="text-sm text-gray-500">Gestão de Obras</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={(user as any)?.profileImageUrl || ""} alt={(user as any)?.firstName || "User"} />
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {(user as any)?.firstName && (user as any)?.lastName 
                ? `${(user as any).firstName} ${(user as any).lastName}` 
                : (user as any)?.email?.split('@')[0] || "Usuário"}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {getUserRole((user as any)?.role || "viewer")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                isActive 
                  ? "construction-primary text-white" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Toggle */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          onClick={onToggleAI}
          className="w-full construction-secondary"
        >
          <Bot className="h-5 w-5 mr-2" />
          Assistente IA
        </Button>
      </div>

      {/* Logout */}
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.location.href = '/api/logout'}
        >
          Sair
        </Button>
      </div>
    </div>
  );
}
