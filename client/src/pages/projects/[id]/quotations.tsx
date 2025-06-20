import MainLayout from "@/layouts/MainLayout";
import ProjectLayout from "@/layouts/ProjectLayout";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function Quotations() {
  const params = useParams();
  const projectId = params.id || "1";

  return (
    <MainLayout>
      <ProjectLayout projectId={projectId}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapas de Cotações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Módulo de Mapas de Cotações em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      </ProjectLayout>
    </MainLayout>
  );
}