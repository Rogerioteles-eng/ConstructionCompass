import MainLayout from "@/layouts/MainLayout";
import ProjectLayout from "@/layouts/ProjectLayout";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function Suppliers() {
  const params = useParams();
  const projectId = params.id || "1";

  return (
    <MainLayout>
      <ProjectLayout projectId={projectId}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Módulo de Fornecedores em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      </ProjectLayout>
    </MainLayout>
  );
}