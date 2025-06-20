import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Truck, MapPin, FileText } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ManagePage() {
  const manageItems = [
    { path: "/manage/suppliers", label: "Fornecedores", icon: Truck, description: "Gerenciar fornecedores e contatos" },
    { path: "/employees", label: "Funcionários", icon: Users, description: "Gerenciar funcionários e custos" },
    { path: "/manage/quotations", label: "Cotações", icon: MapPin, description: "Mapas de cotações globais" },
    { path: "/manage/registers", label: "Registros", icon: FileText, description: "Documentos e registros" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar</h1>
          <p className="text-gray-600 mt-2">Gerencie recursos globais do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {manageItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}