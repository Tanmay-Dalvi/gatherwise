import React from 'react';
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { EventPlan } from '../types';
import { formatCurrency, formatEventDate, getCountdownDays } from '../utils/format';

interface OverviewTabProps {
  plan: EventPlan;
  onNavigateTab: (tab: 'budget' | 'timeline' | 'checklist' | 'ideas') => void;
  onOpenRegenerate: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  plan,
  onNavigateTab,
  onOpenRegenerate,
}) => {
  const { event, budget_summary, budget_items, timeline, checklist, ideas, assumptions } = plan;
  const countdown = getCountdownDays(event.event_date);

  const completedTasks = checklist.filter((t) => t.status === 'done').length;
  const taskCompletionPct = checklist.length > 0 ? Math.round((completedTasks / checklist.length) * 100) : 0;

  const completedMilestones = timeline.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Countdown */}
      <div className="bg-gradient-to-r from-stone-900 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold mb-2">
            <span>{event.event_type.toUpperCase()} PLAN</span>
            <span>•</span>
            <span>{event.style}</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold">{event.title}</h2>
          <p className="text-stone-300 text-sm mt-1">
            {event.location} • {event.guest_count.toLocaleString()} expected guests • {formatEventDate(event.event_date)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-5 py-3 text-center min-w-[160px] self-stretch md:self-auto flex md:flex-col justify-between items-center">
          <span className="text-xs uppercase tracking-wider text-amber-200/80 font-medium">Countdown</span>
          <span className="text-xl sm:text-2xl font-bold font-editorial text-white">{countdown.text}</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Budget */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('budget')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('budget');
            }
          }}
          aria-label="Target budget summary. Press to view budget."
          className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-amber-400 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Budget</span>
            <DollarSign className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {formatCurrency(budget_summary.target_budget, event.currency)}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {budget_items.length} itemized categories planned
          </p>
        </div>

        {/* Estimated vs Actual */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('budget')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('budget');
            }
          }}
          aria-label="Actual spent summary. Press to view budget."
          className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-amber-400 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Actual Spent</span>
            <DollarSign className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {formatCurrency(budget_summary.total_actual, event.currency)}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Estimated: {formatCurrency(budget_summary.total_estimated, event.currency)}
          </p>
        </div>

        {/* Remaining Budget */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('budget')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('budget');
            }
          }}
          aria-label="Remaining budget summary. Press to view budget."
          className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-amber-400 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining</span>
            {budget_summary.is_over_budget ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div
            className={`text-2xl font-bold ${
              budget_summary.is_over_budget ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(budget_summary.remaining_budget, event.currency)}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {budget_summary.is_over_budget ? 'Over budget target' : 'Within budget target'}
          </p>
        </div>

        {/* Task Completion */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('checklist')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('checklist');
            }
          }}
          aria-label="Checklist progress summary. Press to view checklist."
          className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-amber-400 transition cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Checklist Progress</span>
            <CheckCircle2 className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{taskCompletionPct}%</div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${taskCompletionPct}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {completedTasks} of {checklist.length} actions complete
          </p>
        </div>
      </div>

      {/* Two Column Section: Timeline Preview & Budget Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Milestones Preview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-editorial text-lg font-bold text-stone-900">Key Milestones</h3>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>View all ({timeline.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {timeline.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between p-3 rounded-xl bg-stone-50/70 border border-stone-100 text-sm"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.status === 'completed'
                          ? 'bg-emerald-500'
                          : m.status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-stone-300'
                      }`}
                    />
                    <span className="font-semibold text-stone-900">{m.title}</span>
                  </div>
                  <p className="text-xs text-stone-500 ml-4 mt-0.5">{m.phase}</p>
                </div>
                <span className="text-xs font-medium text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0">
                  {m.target_date || 'Flexible'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Categories Preview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h3 className="font-editorial text-lg font-bold text-stone-900">Budget Breakdown</h3>
            </div>
            <button
              onClick={() => onNavigateTab('budget')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>Manage Budget</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(budget_summary.category_breakdown)
              .slice(0, 5)
              .map(([catName, catData]) => (
                <div key={catName}>
                  <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                    <span className="truncate">{catName}</span>
                    <span className="font-semibold shrink-0">
                      {formatCurrency(catData.estimated, event.currency)} ({catData.percentage_of_budget}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, catData.percentage_of_budget)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Featured Creative Ideas */}
      {ideas.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="font-editorial text-lg font-bold text-stone-900">Curated Creative Ideas</h3>
            </div>
            <button
              onClick={() => onNavigateTab('ideas')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>Explore all ideas ({ideas.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.slice(0, 2).map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60"
              >
                <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {idea.category}
                </span>
                <h4 className="font-bold text-stone-900 text-sm mt-2">{idea.title}</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{idea.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions & Disclaimers Footer */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 text-xs text-stone-500 flex items-start space-x-3">
        <Info className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium text-stone-700">
            Planning Guidance & Estimates:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-stone-600">
            {assumptions.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
