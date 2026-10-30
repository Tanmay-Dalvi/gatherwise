import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { BudgetItem, BudgetSummary, Event } from '../types';
import { formatCurrency } from '../utils/format';

interface BudgetTabProps {
  event: Event;
  budgetSummary: BudgetSummary;
  budgetItems: BudgetItem[];
  onSaveBudgetItems: (items: BudgetItem[]) => Promise<void>;
  onOpenRegenerateModal: () => void;
  isSaving: boolean;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  event,
  budgetSummary,
  budgetItems,
  onSaveBudgetItems,
  onOpenRegenerateModal,
  isSaving,
}) => {
  const [items, setItems] = useState<BudgetItem[]>(budgetItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New item form state
  const [newCategory, setNewCategory] = useState<string>('Venue & Rentals');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEstimatedCost, setNewEstimatedCost] = useState<number>(500);
  const [newActualCost, setNewActualCost] = useState<number>(0);
  const [newNotes, setNewNotes] = useState<string>('');

  // Update internal items if prop changes and no unsaved edits
  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setItems(budgetItems);
    }
  }, [budgetItems, hasUnsavedChanges]);

  // Categories list
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const filteredItems = useMemo(
    () => (selectedCategory === 'ALL' ? items : items.filter((i) => i.category === selectedCategory)),
    [items, selectedCategory]
  );

  // Live KPI metrics reflecting in-progress edits immediately
  const liveTotalEstimated = useMemo(
    () => (hasUnsavedChanges ? items.reduce((acc, i) => acc + (i.estimated_cost || 0), 0) : budgetSummary.total_estimated),
    [hasUnsavedChanges, items, budgetSummary.total_estimated]
  );

  const liveTotalActual = useMemo(
    () => (hasUnsavedChanges ? items.reduce((acc, i) => acc + (i.actual_cost || 0), 0) : budgetSummary.total_actual),
    [hasUnsavedChanges, items, budgetSummary.total_actual]
  );

  const liveRemaining = useMemo(() => {
    if (hasUnsavedChanges) {
      const benchmark = liveTotalActual > 0 ? liveTotalActual : liveTotalEstimated;
      return budgetSummary.target_budget - benchmark;
    }
    return budgetSummary.remaining_budget;
  }, [hasUnsavedChanges, liveTotalActual, liveTotalEstimated, budgetSummary.target_budget, budgetSummary.remaining_budget]);

  const liveIsOverBudget = liveRemaining < 0;

  const handleCostChange = (id: string, field: 'estimated_cost' | 'actual_cost', valueStr: string) => {
    const val = parseFloat(valueStr);
    if (isNaN(val) || val < 0) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const newItem: BudgetItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
      event_id: event.id,
      category: newCategory,
      description: newDescription.trim(),
      estimated_cost: Math.max(0, newEstimatedCost),
      actual_cost: Math.max(0, newActualCost),
      notes: newNotes.trim(),
      is_custom: true,
    };

    setItems((prev) => [...prev, newItem]);
    setHasUnsavedChanges(true);
    setIsAddingNew(false);
    setNewDescription('');
    setNewNotes('');
    setNewEstimatedCost(500);
    setNewActualCost(0);
  };

  const handleSaveAll = async () => {
    await onSaveBudgetItems(items);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Save Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-editorial text-xl font-bold text-stone-900">
            Itemized Celebration Budget
          </h3>
          <p className="text-xs text-stone-500">
            All totals are calculated deterministically. Edit costs directly in the table.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Budget Changes'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Expense</span>
          </button>

          <button
            onClick={onOpenRegenerateModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition"
            title="Refine and regenerate budget allocations with AI or demo prompts"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span>Regenerate Budget</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">
            Target Budget
          </span>
          <div className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
            {formatCurrency(budgetSummary.target_budget, event.currency)}
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">
            Total Estimated
          </span>
          <div className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
            {formatCurrency(liveTotalEstimated, event.currency)}
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider">
            Total Actual Spent
          </span>
          <div className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
            {formatCurrency(liveTotalActual, event.currency)}
          </div>
        </div>

        <div
          className={`border rounded-xl p-3.5 ${
            liveIsOverBudget
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Remaining Budget
            </span>
            {liveIsOverBudget ? (
              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold mt-0.5">
            {formatCurrency(liveRemaining, event.currency)}
          </div>
        </div>
      </div>

      {/* Add Custom Item Form Box */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNewItem}
          className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Add Custom Expense Line
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Category
              </label>
              <input
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Venue, Catering, Music"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Item Description *
              </label>
              <input
                type="text"
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g. Artisanal Gelato Cart, Vintage Cadillac Rental"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Estimated Cost ({event.currency})
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={newEstimatedCost}
                onChange={(e) => setNewEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Add to Budget
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-stone-500 font-medium mr-1">Filter:</span>
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            selectedCategory === 'ALL'
              ? 'bg-stone-900 border-stone-900 text-white font-medium'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          All Categories ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              selectedCategory === cat
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Itemized Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Category & Description</th>
                <th className="py-3 px-3 text-right">Est. Cost ({event.currency})</th>
                <th className="py-3 px-3 text-right">Actual Cost ({event.currency})</th>
                <th className="py-3 px-3 text-right">Variance</th>
                <th className="py-3 px-4">Notes & Rationale</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map((item) => {
                const variance = item.actual_cost - item.estimated_cost;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition group">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-900">{item.description}</span>
                        {item.is_custom && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {item.category}
                      </span>
                    </td>

                    {/* Estimated Cost input */}
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={item.estimated_cost}
                        onChange={(e) => handleCostChange(item.id, 'estimated_cost', e.target.value)}
                        className="w-24 text-right px-2 py-1 rounded border border-stone-200 text-stone-900 font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </td>

                    {/* Actual Cost input */}
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={item.actual_cost}
                        onChange={(e) => handleCostChange(item.id, 'actual_cost', e.target.value)}
                        className="w-24 text-right px-2 py-1 rounded border border-stone-200 text-stone-900 font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </td>

                    {/* Variance display */}
                    <td className="py-3 px-3 text-right font-medium">
                      {item.actual_cost === 0 ? (
                        <span className="text-stone-400">—</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            variance > 0
                              ? 'text-rose-600'
                              : variance < 0
                              ? 'text-emerald-600'
                              : 'text-stone-600'
                          }`}
                        >
                          {variance > 0 ? `+${variance.toFixed(0)}` : variance.toFixed(0)}
                        </span>
                      )}
                    </td>

                    {/* Notes input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        placeholder="Vendor quotes or assumptions..."
                        className="w-full text-xs px-2 py-1 rounded border border-transparent hover:border-stone-200 focus:border-amber-500 focus:bg-white bg-transparent text-stone-600"
                      />
                    </td>

                    {/* Delete action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                        title="Remove budget line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
