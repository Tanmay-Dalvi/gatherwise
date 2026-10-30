import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Share2,
  RefreshCw,
  Edit3,
  DollarSign,
  Clock,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  Cpu,
  Database
} from 'lucide-react';
import { EventPlan, BudgetItem, TimelineMilestone, ChecklistTask, CreativeIdea, EventCreate } from '../types';
import { OverviewTab } from './OverviewTab';
import { BudgetTab } from './BudgetTab';
import { TimelineTab } from './TimelineTab';
import { ChecklistTab } from './ChecklistTab';
import { IdeasTab } from './IdeasTab';
import { RegenerateModal } from './RegenerateModal';
import { ExportModal } from './ExportModal';
import { EventFormModal } from './EventFormModal';
import { api } from '../api/client';
import { formatEventDate } from '../utils/format';

interface EventWorkspaceProps {
  plan: EventPlan;
  onBackToDashboard: () => void;
  onRefreshPlan: (updatedPlan?: EventPlan) => Promise<void> | void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const EventWorkspace: React.FC<EventWorkspaceProps> = ({
  plan,
  onBackToDashboard,
  onRefreshPlan,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'checklist' | 'ideas'>('overview');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isRegenOpen, setIsRegenOpen] = useState<boolean>(false);
  const [regenSection, setRegenSection] = useState<'budget' | 'timeline' | 'checklist' | 'ideas'>('budget');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { event } = plan;

  // Handlers for section saving
  const handleSaveBudgetItems = async (items: BudgetItem[]) => {
    setIsSaving(true);
    try {
      const updatedPlan = await api.updateBudgetItems(event.id, items);
      await onRefreshPlan(updatedPlan);
      showToast('success', 'Budget changes saved and totals recalculated!');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save budget changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTimeline = async (milestones: TimelineMilestone[]) => {
    setIsSaving(true);
    try {
      const updatedPlan = await api.updateTimeline(event.id, milestones);
      await onRefreshPlan(updatedPlan);
      showToast('success', 'Timeline milestones saved successfully!');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save timeline.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChecklist = async (tasks: ChecklistTask[]) => {
    setIsSaving(true);
    try {
      const updatedPlan = await api.updateChecklist(event.id, tasks);
      await onRefreshPlan(updatedPlan);
      showToast('success', 'Checklist items saved successfully!');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save checklist.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIdeas = async (ideas: CreativeIdea[]) => {
    setIsSaving(true);
    try {
      const updatedPlan = await api.updateIdeas(event.id, ideas);
      await onRefreshPlan(updatedPlan);
      showToast('success', 'Creative ideas saved successfully!');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save ideas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEventDetails = async (data: EventCreate) => {
    try {
      await api.updateEvent(event.id, data);
      await onRefreshPlan();
      showToast('success', 'Celebration details updated!');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update details.');
    }
  };

  const handleRegenerate = async (
    section: 'budget' | 'timeline' | 'checklist' | 'ideas',
    userPrompt: string,
    preserveManual: boolean
  ) => {
    try {
      const updatedPlan = await api.regenerateSection(event.id, section, userPrompt, preserveManual);
      await onRefreshPlan(updatedPlan);
      showToast('success', `Regenerated ${section} section while preserving your custom items!`);
    } catch (err: any) {
      showToast('error', err?.message || `Failed to regenerate ${section}.`);
      throw err;
    }
  };

  const openRegenerateForSection = (sec: 'budget' | 'timeline' | 'checklist' | 'ideas') => {
    setRegenSection(sec);
    setIsRegenOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Workspace Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200 no-print">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Celebrations</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 truncate">
              {event.title}
            </h1>
            <button
              onClick={() => setIsEditOpen(true)}
              className="text-stone-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-stone-100 transition"
              title="Edit event details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-stone-500">
            <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded capitalize">
              {event.event_type}
            </span>
            <span>•</span>
            <span>{event.location}</span>
            <span>•</span>
            <span>{event.guest_count} Guests</span>
            <span>•</span>
            <span>{formatEventDate(event.event_date)}</span>
            <span>•</span>
            <span className="text-stone-400">
              Source: {plan.generation_source === 'gemini' ? 'Gemini AI' : 'Deterministic Planner'}
            </span>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 text-xs font-semibold shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Export / Print</span>
          </button>

          <button
            onClick={() => openRegenerateForSection('budget')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Regenerate Section</span>
          </button>
        </div>
      </div>

      {/* Printable Title View (Only appears when printed) */}
      <div className="hidden print-only mb-6">
        <h1 className="text-3xl font-bold font-editorial text-stone-900">{event.title}</h1>
        <p className="text-sm text-stone-600 mt-1">
          {event.event_type.toUpperCase()} • {event.location} • {formatEventDate(event.event_date)} • {event.guest_count} Guests
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 space-x-1 sm:space-x-4 mb-6 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'budget'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Budget & Costs ({plan.budget_items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline ({plan.timeline.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Checklist ({plan.checklist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'ideas'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Ideas ({plan.ideas.length})</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            plan={plan}
            onNavigateTab={(t) => setActiveTab(t)}
            onOpenRegenerate={() => openRegenerateForSection('budget')}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            event={event}
            budgetSummary={plan.budget_summary}
            budgetItems={plan.budget_items}
            onSaveBudgetItems={handleSaveBudgetItems}
            onOpenRegenerateModal={() => openRegenerateForSection('budget')}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab
            event={event}
            timeline={plan.timeline}
            onSaveTimeline={handleSaveTimeline}
            onOpenRegenerateModal={() => openRegenerateForSection('timeline')}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistTab
            event={event}
            checklist={plan.checklist}
            onSaveChecklist={handleSaveChecklist}
            onOpenRegenerateModal={() => openRegenerateForSection('checklist')}
            isSaving={isSaving}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasTab
            event={event}
            ideas={plan.ideas}
            onSaveIdeas={handleSaveIdeas}
            onOpenRegenerateModal={() => openRegenerateForSection('ideas')}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Sub Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        plan={plan}
      />

      <RegenerateModal
        isOpen={isRegenOpen}
        onClose={() => setIsRegenOpen(false)}
        defaultSection={regenSection}
        onRegenerate={handleRegenerate}
      />

      <EventFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditEventDetails}
        initialData={{
          title: event.title,
          event_type: event.event_type,
          event_date: event.event_date,
          location: event.location,
          guest_count: event.guest_count,
          budget: event.budget,
          currency: event.currency,
          style: event.style,
          priorities: event.priorities,
          constraints: event.constraints,
          notes: event.notes,
        }}
        isEditing={true}
      />
    </div>
  );
};
