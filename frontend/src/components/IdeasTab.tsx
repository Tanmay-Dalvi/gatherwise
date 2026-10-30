import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, RefreshCw, Save, Tag } from 'lucide-react';
import { CreativeIdea, Event } from '../types';

interface IdeasTabProps {
  event: Event;
  ideas: CreativeIdea[];
  onSaveIdeas: (ideas: CreativeIdea[]) => Promise<void>;
  onOpenRegenerateModal: () => void;
  isSaving: boolean;
}

export const IdeasTab: React.FC<IdeasTabProps> = ({
  event,
  ideas,
  onSaveIdeas,
  onOpenRegenerateModal,
  isSaving,
}) => {
  const [items, setItems] = useState<CreativeIdea[]>(ideas);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New idea form
  const [newCategory, setNewCategory] = useState<string>('Theme & Aesthetic');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTagsStr, setNewTagsStr] = useState<string>('');

  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setItems(ideas);
    }
  }, [ideas, hasUnsavedChanges]);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const tags = newTagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const idea: CreativeIdea = {
      id: crypto.randomUUID ? crypto.randomUUID() : `idea-${Date.now()}`,
      event_id: event.id,
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim(),
      tags,
    };

    setItems((prev) => [...prev, idea]);
    setHasUnsavedChanges(true);
    setIsAddingNew(false);
    setNewTitle('');
    setNewDescription('');
    setNewTagsStr('');
  };

  const handleSaveAll = async () => {
    await onSaveIdeas(items);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-editorial text-xl font-bold text-stone-900">
            Personalized Creative Ideas & Inspiration
          </h3>
          <p className="text-xs text-stone-500">
            Curated specifically for {event.guest_count} guests, {event.style} style in {event.location}
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
              <span>{isSaving ? 'Saving...' : 'Save Ideas'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Idea</span>
          </button>

          <button
            onClick={onOpenRegenerateModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span>Regenerate Ideas</span>
          </button>
        </div>
      </div>

      {/* Add New Idea Box */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNew}
          className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Add Creative Inspiration
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              >
                <option value="Theme & Aesthetic">Theme & Aesthetic</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Entertainment & Activities">Entertainment & Activities</option>
                <option value="Personal Touches">Personal Touches</option>
                <option value="Logistics & Savings">Logistics & Savings</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Idea Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Polaroid Guestbook Station with Metallic Gel Pens"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-700 mb-1">
              Description & Details *
            </label>
            <textarea
              rows={2}
              required
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the aesthetic, logistics, and guest experience details..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={newTagsStr}
              onChange={(e) => setNewTagsStr(e.target.value)}
              placeholder="e.g. interactive, keepsake, photo"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Add Inspiration
            </button>
          </div>
        </form>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((idea) => (
          <div
            key={idea.id}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                  {idea.category}
                </span>
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="text-stone-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                  title="Remove idea"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="font-editorial text-lg font-bold text-stone-900 mt-1 mb-2">
                {idea.title}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">{idea.description}</p>
            </div>

            {idea.tags && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-stone-100">
                {idea.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full"
                  >
                    <Tag className="w-2.5 h-2.5 text-stone-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
