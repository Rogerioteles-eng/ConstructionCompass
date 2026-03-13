import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProjectLayout from "@/layouts/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, CheckCircle, Clock, DollarSign } from "lucide-react";

export default function Quotations() {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", supplier: "",
    amount: "", status: "pending", validUntil: "", notes: ""
  });

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/quotations`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/quotations`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/quotations`] });
      toast({ title: "✅ Cotação adicionada!" });
      setIsOpen(false);
      setForm({ title: "", description: "", supplier: "", amount: "", status: "pending", validUntil: "", notes: "" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const res = await apiRequest("PUT", `/api/quotations/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/quotations`] });
      toast({ title: "Status atualizado!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/quotations`] });
      toast({ title: "Cotação removida" });
    },
  });

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending:  { label: "Pendente",  class: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Aprovada",  class: "bg-green-100 text-green-800"  },
      rejected: { label: "Rejeitada", class: "bg-red-100 text-red-800"      },
    };
    const s = map[status] || map.pending;
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  const formatCurrency = (val: any) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(val) || 0);

  const totalApproved = (quotations as any[])
    .filter((q: any) => q.status === "approved")
    .reduce((sum: number, q: any) => sum + (parseFloat(q.amount) || 0), 0);

  return (
    <ProjectLayout projectId={projectId!}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mapas de Cotações</h2>
            <p className="text-gray-500">Gerencie cotações e propostas desta obra</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Nova Cotação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Cotação</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
                className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={form.title} required
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Cotação de Cimento" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fornecedor</Label>
                    <Input value={form.supplier}
                      onChange={e => setForm({ ...form, supplier: e.target.value })}
                      placeholder="Nome do fornecedor" />
                  </div>
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      placeholder="0,00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <select value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="pending">Pendente</option>
                      <option value="approved">Aprovada</option>
                      <option value="rejected">Rejeitada</option>
                    </select>
                  </div>
                  <div>
                    <Label>Válida até</Label>
                    <Input type="date" value={form.validUntil}
                      onChange={e => setForm({ ...form, validUntil: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <textarea value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalhes da cotação..."
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={createMutation.isPending}>Adicionar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{(quotations as any[]).length}</p>
              <p className="text-sm text-gray-500">Total de Cotações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {(quotations as any[]).filter((q: any) => q.status === "approved").length}
              </p>
              <p className="text-sm text-gray-500">Aprovadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</p>
              <p className="text-sm text-gray-500">Total Aprovado</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : (quotations as any[]).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma cotação cadastrada</h3>
              <p className="text-gray-500 mt-1">Adicione cotações para comparar preços</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(quotations as any[]).map((q: any) => (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{q.title}</h3>
                        {getStatusBadge(q.status)}
                      </div>
                      {q.supplier && (
                        <p className="text-sm text-gray-600 mb-1">🏢 {q.supplier}</p>
                      )}
                      {q.description && (
                        <p className="text-sm text-gray-500 mb-2">{q.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {q.amount && (
                          <span className="font-bold text-green-600 text-lg">
                            {formatCurrency(q.amount)}
                          </span>
                        )}
                        {q.validUntil && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Válida até {new Date(q.validUntil).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {q.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            onClick={() => updateStatusMutation.mutate({ id: q.id, status: "approved" })}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 text-xs"
                            onClick={() => updateStatusMutation.mutate({ id: q.id, status: "rejected" })}>
                            Rejeitar
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-400"
                        onClick={() => deleteMutation.mutate(q.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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