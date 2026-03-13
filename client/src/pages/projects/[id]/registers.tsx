import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProjectLayout from "@/layouts/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Calendar, Tag } from "lucide-react";

export default function Registers() {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "", type: "occurrence", description: "",
    date: new Date().toISOString().split("T")[0], priority: "normal"
  });

  const { data: registers = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/registers`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/registers`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/registers`] });
      toast({ title: "✅ Registro adicionado!" });
      setIsOpen(false);
      setForm({ title: "", type: "occurrence", description: "", date: new Date().toISOString().split("T")[0], priority: "normal" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/registers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/registers`] });
      toast({ title: "Registro removido" });
    },
  });

  const types = [
    { value: "all",        label: "Todos"      },
    { value: "occurrence", label: "Ocorrência" },
    { value: "inspection", label: "Vistoria"   },
    { value: "decision",   label: "Decisão"    },
    { value: "photo",      label: "Foto"       },
    { value: "other",      label: "Outro"      },
  ];

  const priorities: any = {
    low:    { label: "Baixa",  class: "bg-gray-100 text-gray-700"    },
    normal: { label: "Normal", class: "bg-blue-100 text-blue-700"    },
    high:   { label: "Alta",   class: "bg-orange-100 text-orange-700"},
    urgent: { label: "Urgente",class: "bg-red-100 text-red-700"      },
  };

  const filtered = filter === "all"
    ? (registers as any[])
    : (registers as any[]).filter((r: any) => r.type === filter);

  return (
    <ProjectLayout projectId={projectId!}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registros da Obra</h2>
            <p className="text-gray-500">Ocorrências, vistorias e decisões importantes</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Registro</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
                className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={form.title} required
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Trinca na parede sul" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <select value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {types.slice(1).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <select value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <textarea value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Descreva o registro detalhadamente..."
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={createMutation.isPending}>Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <Button key={t.value} size="sm"
              variant={filter === t.value ? "default" : "outline"}
              onClick={() => setFilter(t.value)}
              className={filter === t.value ? "bg-blue-600 text-white" : ""}>
              {t.label}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{(registers as any[]).length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">
                {(registers as any[]).filter((r: any) => r.priority === "urgent").length}
              </p>
              <p className="text-sm text-gray-500">Urgentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {(registers as any[]).filter((r: any) => r.type === "occurrence").length}
              </p>
              <p className="text-sm text-gray-500">Ocorrências</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">
                {(registers as any[]).filter((r: any) => r.type === "inspection").length}
              </p>
              <p className="text-sm text-gray-500">Vistorias</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-gray-500 mt-1">Adicione registros de ocorrências e vistorias</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{r.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {types.find(t => t.value === r.type)?.label || r.type}
                        </Badge>
                        {r.priority && (
                          <Badge className={`text-xs ${priorities[r.priority]?.class}`}>
                            {priorities[r.priority]?.label}
                          </Badge>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {r.date ? new Date(r.date).toLocaleDateString("pt-BR") : "Sem data"}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost"
                      className="text-red-400 hover:text-red-600 ml-4"
                      onClick={() => deleteMutation.mutate(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProjectLayout>
  );
}