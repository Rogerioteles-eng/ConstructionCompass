import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import { UNITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BudgetTreeProps {
  budget: any;
  onAddStage: (budgetId: number, stageData: any) => void;
  onAddItem: (stageId: number, itemData: any) => void;
  onAddSubitem: (itemId: number, subitemData: any) => void;
  onUpdateSubitem: (subitemId: number, subitemData: any) => void;
}

export default function BudgetTree({ 
  budget, 
  onAddStage, 
  onAddItem, 
  onAddSubitem, 
  onUpdateSubitem 
}: BudgetTreeProps) {
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingSubitem, setEditingSubitem] = useState<number | null>(null);
  const [newStage, setNewStage] = useState({ name: "", description: "" });
  const [newItem, setNewItem] = useState<{ [key: number]: { name: string; description: string } }>({});
  const [newSubitem, setNewSubitem] = useState<{ [key: number]: any }>({});

  const toggleStage = (stageId: number) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const toggleItem = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleAddStage = () => {
    if (newStage.name.trim()) {
      onAddStage(budget.id, {
        ...newStage,
        order: (budget.stages?.length || 0) + 1
      });
      setNewStage({ name: "", description: "" });
    }
  };

  const handleAddItem = (stageId: number) => {
    const itemData = newItem[stageId];
    if (itemData?.name.trim()) {
      const stage = budget.stages.find((s: any) => s.id === stageId);
      onAddItem(stageId, {
        ...itemData,
        order: (stage?.items?.length || 0) + 1
      });
      setNewItem({ ...newItem, [stageId]: { name: "", description: "" } });
    }
  };

  const handleAddSubitem = (itemId: number) => {
    const subitemData = newSubitem[itemId];
    if (subitemData?.description?.trim() && subitemData?.quantity && subitemData?.unitPrice && subitemData?.unit) {
      const stage = budget.stages.find((s: any) => s.items.some((i: any) => i.id === itemId));
      const item = stage?.items.find((i: any) => i.id === itemId);
      onAddSubitem(itemId, {
        ...subitemData,
        quantity: parseFloat(subitemData.quantity),
        unitPrice: parseFloat(subitemData.unitPrice),
        order: (item?.subitems?.length || 0) + 1
      });
      setNewSubitem({ ...newSubitem, [itemId]: {} });
    }
  };

  const calculateStageTotal = (stage: any) => {
    return stage.items?.reduce((stageSum: number, item: any) => {
      return stageSum + (item.subitems?.reduce((itemSum: number, subitem: any) => {
        return itemSum + parseFloat(subitem.totalPrice || "0");
      }, 0) || 0);
    }, 0) || 0;
  };

  const calculateBudgetTotal = () => {
    return budget.stages?.reduce((total: number, stage: any) => {
      return total + calculateStageTotal(stage);
    }, 0) || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!budget) {
    return <div>Carregando orçamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Budget Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{budget.name}</span>
            <span className="text-lg font-bold text-green-600">
              Total: {formatCurrency(calculateBudgetTotal())}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Add New Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage-name">Nome da Etapa</Label>
              <Input
                id="stage-name"
                value={newStage.name}
                onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                placeholder="Ex: Fundação"
              />
            </div>
            <div>
              <Label htmlFor="stage-description">Descrição</Label>
              <Input
                id="stage-description"
                value={newStage.description}
                onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                placeholder="Descrição da etapa"
              />
            </div>
          </div>
          <Button onClick={handleAddStage} className="mt-4 construction-primary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa
          </Button>
        </CardContent>
      </Card>

      {/* Budget Stages */}
      {budget.stages?.map((stage: any) => (
        <Card key={stage.id}>
          <Collapsible
            open={expandedStages.has(stage.id)}
            onOpenChange={() => toggleStage(stage.id)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {expandedStages.has(stage.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <span>{stage.name}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(calculateStageTotal(stage))}
                  </span>
                </CardTitle>
                {stage.description && (
                  <p className="text-sm text-gray-600 ml-7">{stage.description}</p>
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {/* Add New Item */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Novo Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Item</Label>
                      <Input
                        value={newItem[stage.id]?.name || ""}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          [stage.id]: { ...newItem[stage.id], name: e.target.value }
                        })}
                        placeholder="Ex: Escavação"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={newItem[stage.id]?.description || ""}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          [stage.id]: { ...newItem[stage.id], description: e.target.value }
                        })}
                        placeholder="Descrição do item"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAddItem(stage.id)} 
                    className="mt-3 construction-secondary"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                {/* Stage Items */}
                {stage.items?.map((item: any) => (
                  <div key={item.id} className="mb-4 border rounded-lg">
                    <Collapsible
                      open={expandedItems.has(item.id)}
                      onOpenChange={() => toggleItem(item.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {expandedItems.has(item.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-medium text-green-600">
                            {formatCurrency(item.subitems?.reduce((sum: number, sub: any) => 
                              sum + parseFloat(sub.totalPrice || "0"), 0) || 0)}
                          </span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 border-t bg-white">
                          {/* Add New Subitem */}
                          <div className="mb-4 p-3 bg-gray-50 rounded">
                            <h5 className="font-medium mb-3">Novo Subitem</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                              <div>
                                <Label>Descrição</Label>
                                <Input
                                  value={newSubitem[item.id]?.description || ""}
                                  onChange={(e) => setNewSubitem({
                                    ...newSubitem,
                                    [item.id]: { ...newSubitem[item.id], description: e.target.value }
                                  })}
                                  placeholder="Ex: Concreto C25"
                                />
                              </div>
                              <div>
                                <Label>Quantidade</Label>
                                <Input
                                  type="number"
                                  step="0.001"
                                  value={newSubitem[item.id]?.quantity || ""}
                                  onChange={(e) => setNewSubitem({
                                    ...newSubitem,
                                    [item.id]: { ...newSubitem[item.id], quantity: e.target.value }
                                  })}
                                  placeholder="0.000"
                                />
                              </div>
                              <div>
                                <Label>Unidade</Label>
                                <Select
                                  value={newSubitem[item.id]?.unit || ""}
                                  onValueChange={(value) => setNewSubitem({
                                    ...newSubitem,
                                    [item.id]: { ...newSubitem[item.id], unit: value }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unidade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNITS.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Preço Unitário</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={newSubitem[item.id]?.unitPrice || ""}
                                  onChange={(e) => setNewSubitem({
                                    ...newSubitem,
                                    [item.id]: { ...newSubitem[item.id], unitPrice: e.target.value }
                                  })}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button 
                                  onClick={() => handleAddSubitem(item.id)}
                                  className="construction-success"
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Item Subitems */}
                          <div className="space-y-2">
                            {item.subitems?.map((subitem: any) => (
                              <div key={subitem.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 p-3 border rounded bg-white items-center">
                                <div className="col-span-2">
                                  <span className="text-sm font-medium">{subitem.description}</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-sm">{subitem.quantity} {subitem.unit}</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-sm">{formatCurrency(parseFloat(subitem.unitPrice))}</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-sm font-medium text-green-600">
                                    {formatCurrency(parseFloat(subitem.totalPrice))}
                                  </span>
                                </div>
                                <div className="flex justify-center space-x-1">
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
