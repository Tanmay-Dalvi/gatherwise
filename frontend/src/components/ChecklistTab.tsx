import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  Info,
  User,
  Phone
} from 'lucide-react';
import { ChecklistTask, Event } from '../types';

interface ChecklistTabProps {
  event: Event;
  checklist: ChecklistTask[];
  onSaveChecklist: (tasks: ChecklistTask[]) => Promise<void>;
  onOpenRegenerateModal: () => void;
  isSaving: boolean;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  event,
  checklist,
  onSaveChecklist,
  onOpenRegenerateModal,
  isSaving,
}) => {
  const [tasks, setTasks] = useState<ChecklistTask[]>(checklist);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New task form state
  const [newCategory, setNewCategory] = useState<string>('Venue & Logistics');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('2 Weeks Prior');
  const [newAssignedTo, setNewAssignedTo] = useState<string>('Lead Coordinator');
  const [newContactInfo, setNewContactInfo] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setTasks(checklist);
    }
  }, [checklist, hasUnsavedChanges]);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = t.status === 'done' ? 'todo' : 'done';
          return { ...t, status: next };
        }
        return t;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: ChecklistTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`,
      event_id: event.id,
      category: newCategory.trim(),
      title: newTitle.trim(),
      due_date: newDueDate.trim(),
      assigned_to: newAssignedTo.trim(),
      contact_info: newContactInfo.trim(),
      status: 'todo',
      notes: newNotes.trim(),
    };

    setTasks((prev) => [...prev, task]);
    setHasUnsavedChanges(true);
    setIsAddingNew(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleSaveAll = async () => {
    await onSaveChecklist(tasks);
    setHasUnsavedChanges(false);
  };

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'TODO') return t.status !== 'done';
    if (filter === 'DONE') return t.status === 'done';
    return true;
  });

  const categories = Array.from(new Set(tasks.map((t) => t.category)));

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-editorial text-xl font-bold text-stone-900">
            Vendor & Planning Checklist
          </h3>
          <p className="text-xs text-stone-500">
            {completedCount} of {tasks.length} tasks completed
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
              <span>{isSaving ? 'Saving...' : 'Save Checklist'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={onOpenRegenerateModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span>Regenerate Checklist</span>
          </button>
        </div>
      </div>

      {/* Explicit Disclaimer Banner per brief */}
      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Important Planning Notice:</strong> Checklist items and contacts are internal logistical action steps and vendor question prompts. They are not active bookings or contracted reservations.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            filter === 'ALL'
              ? 'bg-stone-900 border-stone-900 text-white font-medium'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('TODO')}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            filter === 'TODO'
              ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          To Do ({tasks.length - completedCount})
        </button>
        <button
          onClick={() => setFilter('DONE')}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            filter === 'DONE'
              ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Add New Task Form Box */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNewTask}
          className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Add New Checklist Action Item
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
              <input
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Catering, AV, Venue"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Task Description *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Schedule venue audio test and obtain power distribution map"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Target Due Date
              </label>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="e.g. 14 Days Prior"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Assigned Owner
              </label>
              <input
                type="text"
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value)}
                placeholder="e.g. Host, Coordinator, Bride"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Vendor / Contact Info
              </label>
              <input
                type="text"
                value={newContactInfo}
                onChange={(e) => setNewContactInfo(e.target.value)}
                placeholder="e.g. Park Ranger Office"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task List Grouped by Category */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catTasks = filteredTasks.filter((t) => t.category === cat);
          if (catTasks.length === 0) return null;

          return (
            <div key={cat} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 pb-2 border-b border-stone-100 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-[11px] font-normal text-stone-400">
                  {catTasks.filter((t) => t.status === 'done').length}/{catTasks.length} done
                </span>
              </h4>

              <div className="space-y-2">
                {catTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between p-3 rounded-lg border transition ${
                      task.status === 'done'
                        ? 'bg-stone-50/70 border-stone-200 opacity-75'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-stone-400 hover:text-emerald-600 transition"
                      >
                        {task.status === 'done' ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-300" />
                        )}
                      </button>

                      <div>
                        <span
                          className={`text-sm font-medium ${
                            task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-500">
                          {task.assigned_to && (
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{task.assigned_to}</span>
                            </span>
                          )}
                          {task.contact_info && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{task.contact_info}</span>
                            </span>
                          )}
                          {task.notes && <span>• {task.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {task.due_date && (
                        <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          {task.due_date}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-stone-300 hover:text-rose-600 p-1 rounded hover:bg-stone-100 transition"
                        title="Delete task"
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
