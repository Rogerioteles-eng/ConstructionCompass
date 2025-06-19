import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calculator } from "lucide-react";
import { UNITS } from "@/lib/constants";

interface BudgetTableProps {
  budget: any;
  onAddStage: (budgetId: number, stageData: any) => void;
  onAddItem: (stageId: number, itemData: any) => void;
  onAddSubitem: (itemId: number, subitemData: any) => void;
  onUpdateSubitem: (subitemId: number, subitemData: any) => void;
}

export default function BudgetTable({
  budget,
  onAddStage,
  onAddItem,
  onAddSubitem,
  onUpdateSubitem
}: BudgetTableProps) {
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddSubitemOpen, setIsAddSubitemOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [editingSubitem, setEditingSubitem] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const calculateItemTotal = (item: any) => {
    if (!item.subitems) return 0;
    return item.subitems.reduce((total: number, subitem: any) => {
      const quantity = parseFloat(subitem.quantity) || 0;
      const unitCost = parseFloat(subitem.unitCost) || 0;
      return total + (quantity * unitCost);
    }, 0);
  };

  const calculateStageTotal = (stage: any) => {
    if (!stage.items) return 0;
    return stage.items.reduce((total: number, item: any) => {
      return total + calculateItemTotal(item);
    }, 0);
  };

  const calculateBudgetTotal = () => {
    if (!budget.stages) return 0;
    return budget.stages.reduce((total: number, stage: any) => {
      return total + calculateStageTotal(stage);
    }, 0);
  };

  const handleAddStage = (data: any) => {
    onAddStage(budget.id, data);
    setIsAddStageOpen(false);
  };

  const handleAddItem = (data: any) => {
    if (selectedStage) {
      onAddItem(selectedStage, data);
      setIsAddItemOpen(false);
      setSelectedStage(null);
    }
  };

  const handleAddSubitem = (data: any) => {
    if (selectedItem) {
      onAddSubitem(selectedItem, data);
      setIsAddSubitemOpen(false);
      setSelectedItem(null);
    }
  };

  const handleUpdateSubitem = (data: any) => {
    if (editingSubitem) {
      onUpdateSubitem(editingSubitem.id, data);
      setEditingSubitem(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">
              {budget.name} - Versão {budget.version}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Geral</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateBudgetTotal())}
                </p>
              </div>
              <Dialog open={isAddStageOpen} onOpenChange={setIsAddStageOpen}>
                <DialogTrigger asChild>
                  <Button className="construction-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Etapa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Etapa</DialogTitle>
                  </DialogHeader>
                  <StageForm onSubmit={handleAddStage} onCancel={() => setIsAddStageOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="w-16 font-bold">ITEM</TableHead>
                  <TableHead className="font-bold">DESCRIÇÃO</TableHead>
                  <TableHead className="w-24 text-center font-bold">QUANT.</TableHead>
                  <TableHead className="w-24 text-center font-bold">UNIDADE</TableHead>
                  <TableHead className="w-32 text-center font-bold">CUSTO ESTIMADO</TableHead>
                  <TableHead className="w-32 text-center font-bold">TOTAL (R$)</TableHead>
                  <TableHead className="w-24 text-center font-bold">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.stages?.map((stage: any, stageIndex: number) => (
                  <>
                    {/* Stage Header */}
                    <TableRow key={`stage-${stage.id}`} className="bg-blue-100 font-bold">
                      <TableCell className="font-bold">
                        {String(stageIndex + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-bold text-blue-800" colSpan={4}>
                        {stage.name.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-800">
                        {formatCurrency(calculateStageTotal(stage))}
                      </TableCell>
                      <TableCell>
                        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStage(stage.id)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Novo Item - {stage.name}</DialogTitle>
                            </DialogHeader>
                            <ItemForm onSubmit={handleAddItem} onCancel={() => setIsAddItemOpen(false)} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>

                    {/* Items */}
                    {stage.items?.map((item: any, itemIndex: number) => (
                      <>
                        {/* Item Header */}
                        <TableRow key={`item-${item.id}`} className="bg-gray-50">
                          <TableCell className="font-semibold">
                            {String(stageIndex + 1).padStart(2, '0')}.{String(itemIndex + 1).padStart(2, '0')}
                          </TableCell>
                          <TableCell className="font-semibold" colSpan={4}>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(calculateItemTotal(item))}
                          </TableCell>
                          <TableCell>
                            <Dialog open={isAddSubitemOpen} onOpenChange={setIsAddSubitemOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedItem(item.id)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Novo Subitem - {item.name}</DialogTitle>
                                </DialogHeader>
                                <SubitemForm onSubmit={handleAddSubitem} onCancel={() => setIsAddSubitemOpen(false)} />
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>

                        {/* Subitems */}
                        {item.subitems?.map((subitem: any, subitemIndex: number) => (
                          <TableRow key={`subitem-${subitem.id}`} className="hover:bg-gray-50">
                            <TableCell className="text-sm">
                              {String(stageIndex + 1).padStart(2, '0')}.{String(itemIndex + 1).padStart(2, '0')}.{String(subitemIndex + 1).padStart(2, '0')}
                            </TableCell>
                            <TableCell className="text-sm">{subitem.description}</TableCell>
                            <TableCell className="text-center text-sm">{subitem.quantity}</TableCell>
                            <TableCell className="text-center text-sm">{subitem.unit}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(parseFloat(subitem.unitCost) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold">
                              {formatCurrency((parseFloat(subitem.quantity) || 0) * (parseFloat(subitem.unitCost) || 0))}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSubitem(subitem)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Subitem Dialog */}
      <Dialog open={!!editingSubitem} onOpenChange={() => setEditingSubitem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Subitem</DialogTitle>
          </DialogHeader>
          <SubitemForm 
            initialData={editingSubitem}
            onSubmit={handleUpdateSubitem} 
            onCancel={() => setEditingSubitem(null)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stage Form Component
function StageForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
    setName("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome da Etapa *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: INCORPORAÇÃO"
          required
        />
      </div>
      <div>
        <Label>Descrição</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional"
        />
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="construction-primary">
          Adicionar
        </Button>
      </div>
    </form>
  );
}

// Item Form Component
function ItemForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
    setName("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome do Item *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Despesas de início de obra"
          required
        />
      </div>
      <div>
        <Label>Descrição</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional"
        />
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="construction-primary">
          Adicionar
        </Button>
      </div>
    </form>
  );
}

// Subitem Form Component
function SubitemForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
}) {
  const [description, setDescription] = useState(initialData?.description || "");
  const [quantity, setQuantity] = useState(initialData?.quantity || "");
  const [unit, setUnit] = useState(initialData?.unit || "");
  const [unitCost, setUnitCost] = useState(initialData?.unitCost || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ description, quantity, unit, unitCost });
    if (!initialData) {
      setDescription("");
      setQuantity("");
      setUnit("");
      setUnitCost("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Descrição *</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Terreno"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantidade *</Label>
          <Input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1.00"
            required
          />
        </div>
        <div>
          <Label>Unidade *</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unitOption) => (
                <SelectItem key={unitOption} value={unitOption}>
                  {unitOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Custo Unitário (R$) *</Label>
        <Input
          type="number"
          step="0.01"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <div className="p-3 bg-gray-100 rounded">
        <p className="text-sm font-semibold">
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            (parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)
          )}
        </p>
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="construction-primary">
          {initialData ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}