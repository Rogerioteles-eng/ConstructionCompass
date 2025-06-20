import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function Finances() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-600 mt-2">Controle financeiro e relatórios</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Módulo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Módulo de Finanças em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}