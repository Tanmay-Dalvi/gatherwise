import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { TimelineMilestone, Event } from '../types';

interface TimelineTabProps {
  event: Event;
  timeline: TimelineMilestone[];
  onSaveTimeline: (milestones: TimelineMilestone[]) => Promise<void>;
  onOpenRegenerateModal: () => void;
  isSaving: boolean;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  event,
  timeline,
  onSaveTimeline,
  onOpenRegenerateModal,
  isSaving,
}) => {
  const [milestones, setMilestones] = useState<TimelineMilestone[]>(timeline);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New milestone form state
  const [newPhase, setNewPhase] = useState<string>('Planning Phase (3-6 Months Out)');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTargetDate, setNewTargetDate] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('medium');
  const [newNotes, setNewNotes] = useState<string>('');

  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setMilestones(timeline);
    }
  }, [timeline, hasUnsavedChanges]);

  // Group milestones by phase
  const phases = useMemo(() => Array.from(new Set(milestones.map((m) => m.phase))), [milestones]);

  const handleStatusToggle = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus =
            m.status === 'completed'
              ? 'pending'
              : m.status === 'pending'
              ? 'in_progress'
              : 'completed';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleDelete = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item: TimelineMilestone = {
      id: crypto.randomUUID ? crypto.randomUUID() : `milestone-${Date.now()}`,
      event_id: event.id,
      phase: newPhase,
      title: newTitle.trim(),
      target_date: newTargetDate.trim(),
      priority: newPriority,
      status: 'pending',
      notes: newNotes.trim(),
    };

    setMilestones((prev) => [...prev, item]);
    setHasUnsavedChanges(true);
    setIsAddingNew(false);
    setNewTitle('');
    setNewTargetDate('');
    setNewNotes('');
  };

  const handleSaveAll = async () => {
    await onSaveTimeline(milestones);
    setHasUnsavedChanges(false);
  };

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const pct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-editorial text-xl font-bold text-stone-900">
            Chronological Timeline & Run of Show
          </h3>
          <p className="text-xs text-stone-500">
            {completedCount} of {milestones.length} milestones reached ({pct}% completed)
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
              <span>{isSaving ? 'Saving...' : 'Save Timeline'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>

          <button
            onClick={onOpenRegenerateModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span>Regenerate Timeline</span>
          </button>
        </div>
      </div>

      {/* Add New Box */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNew}
          className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Add New Milestone
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
                Phase Name
              </label>
              <input
                type="text"
                required
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
                placeholder="e.g. Day-Of Run of Show"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Milestone Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Finalize seating chart & caterer headcount"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Target Date / Time Offset
              </label>
              <input
                type="text"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                placeholder="e.g. 3 Weeks Prior or 16:30"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Add Milestone
            </button>
          </div>
        </form>
      )}

      {/* Phased Timeline Cards */}
      <div className="space-y-6">
        {phases.map((phase) => {
          const phaseItems = milestones.filter((m) => m.phase === phase);
          return (
            <div key={phase} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <h4 className="font-editorial text-base font-bold text-stone-900 mb-3 pb-2 border-b border-stone-100 flex items-center justify-between">
                <span>{phase}</span>
                <span className="text-xs font-normal text-stone-400">
                  {phaseItems.length} milestone{phaseItems.length > 1 ? 's' : ''}
                </span>
              </h4>

              <div className="space-y-2.5">
                {phaseItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between p-3 rounded-lg border transition ${
                      item.status === 'completed'
                        ? 'bg-stone-50/80 border-stone-200 opacity-80'
                        : item.status === 'in_progress'
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleStatusToggle(item.id)}
                        className="mt-0.5 text-stone-400 hover:text-emerald-600 transition"
                        title={`Click to cycle status: ${item.status}`}
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              item.status === 'in_progress'
                                ? 'border-amber-500 bg-amber-100 text-amber-700 font-bold text-[10px]'
                                : 'border-stone-300'
                            }`}
                          >
                            {item.status === 'in_progress' && '•'}
                          </div>
                        )}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-semibold ${
                              item.status === 'completed'
                                ? 'line-through text-stone-500'
                                : 'text-stone-900'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                              item.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : item.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-stone-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded">
                        {item.target_date || 'Flexible'}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-stone-300 hover:text-rose-600 p-1 rounded hover:bg-stone-100 transition"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
