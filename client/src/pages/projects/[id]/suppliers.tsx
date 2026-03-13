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
import {
  Truck, Plus, Phone, Mail, MapPin,
  Edit, Trash2, Search, Building2
} from "lucide-react";

export default function Suppliers() {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", contact: "", phone: "",
    email: "", address: "", category: "", notes: ""
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/suppliers`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/suppliers`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/suppliers`] });
      toast({ title: "✅ Fornecedor adicionado!" });
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/suppliers`] });
      toast({ title: "✅ Fornecedor atualizado!" });
      setEditingSupplier(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/suppliers`] });
      toast({ title: "Fornecedor removido" });
    },
  });

  const resetForm = () => setForm({
    name: "", contact: "", phone: "",
    email: "", address: "", category: "", notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      contact: supplier.contact || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      category: supplier.category || "",
      notes: supplier.notes || "",
    });
  };

  const filtered = (suppliers as any[]).filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["Material", "Mão de obra", "Equipamento", "Serviço", "Outro"];

  return (
    <ProjectLayout projectId={projectId!}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fornecedores</h2>
            <p className="text-gray-500">Gerencie fornecedores desta obra</p>
          </div>
          <Dialog open={isOpen || !!editingSupplier}
            onOpenChange={(v) => { setIsOpen(v); if (!v) { setEditingSupplier(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome da Empresa *</Label>
                    <Input value={form.name} required
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Materiais Silva Ltda" />
                  </div>
                  <div>
                    <Label>Contato</Label>
                    <Input value={form.contact}
                      onChange={e => setForm({ ...form, contact: e.target.value })}
                      placeholder="Nome do responsável" />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@empresa.com" />
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço</Label>
                    <Input value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Rua, número, cidade" />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Informações adicionais..."
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline"
                    onClick={() => { setIsOpen(false); setEditingSupplier(null); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingSupplier ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-10" placeholder="Buscar fornecedor..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 4).map(cat => (
            <Card key={cat}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(suppliers as any[]).filter((s: any) => s.category === cat).length}
                </p>
                <p className="text-sm text-gray-500">{cat}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum fornecedor cadastrado</h3>
              <p className="text-gray-500 mt-1">Adicione fornecedores para esta obra</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((supplier: any) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        {supplier.category && (
                          <Badge variant="outline" className="text-xs mt-0.5">
                            {supplier.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(supplier.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {supplier.contact && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{supplier.contact}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                    {supplier.notes && (
                      <p className="text-xs text-gray-400 mt-2 border-t pt-2">{supplier.notes}</p>
                    )}
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