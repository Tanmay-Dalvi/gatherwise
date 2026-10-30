import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection: 'budget' | 'timeline' | 'checklist' | 'ideas';
  onRegenerate: (
    section: 'budget' | 'timeline' | 'checklist' | 'ideas',
    userPrompt: string,
    preserveManualItems: boolean
  ) => Promise<void>;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  defaultSection,
  onRegenerate,
}) => {
  const [section, setSection] = useState<'budget' | 'timeline' | 'checklist' | 'ideas'>(defaultSection);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [preserveManual, setPreserveManual] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setSection(defaultSection);
  }, [defaultSection]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onRegenerate(section, userPrompt.trim(), preserveManual);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to regenerate section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionLabels = {
    budget: 'Budget & Cost Estimates',
    timeline: 'Timeline & Milestones',
    checklist: 'Vendor & Task Checklist',
    ideas: 'Creative Ideas & Advice',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regen-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 id="regen-title" className="font-editorial text-xl font-bold text-stone-900">
                Targeted Section Regeneration
              </h2>
              <p className="text-xs text-stone-500">
                Refine a single section without altering your work elsewhere.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Section Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Select Target Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as any)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 bg-white"
            >
              <option value="budget">Budget Breakdown</option>
              <option value="timeline">Timeline & Milestones</option>
              <option value="checklist">Vendor & Task Checklist</option>
              <option value="ideas">Creative Ideas</option>
            </select>
          </div>

          {/* User Custom Direction Prompt */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Custom Refinement Prompt (Optional)
            </label>
            <textarea
              rows={3}
              placeholder={
                section === 'budget'
                  ? "e.g. Cut catering by 20% and allocate more to live music and photography..."
                  : section === 'timeline'
                  ? "e.g. Compact schedule for a late-afternoon sunset ceremony..."
                  : "e.g. Add sustainable and eco-friendly vendor tasks..."
              }
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          {/* Preserve manual items checkbox */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start space-x-3">
            <input
              type="checkbox"
              id="preserveManual"
              checked={preserveManual}
              onChange={(e) => setPreserveManual(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="preserveManual" className="text-xs text-stone-700 cursor-pointer">
              <span className="font-semibold text-emerald-950 block">
                Preserve Manual Edits & Completed Items
              </span>
              <span className="text-stone-500 text-[11px]">
                Keeps your custom budget lines, recorded spending, and checked-off tasks intact.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:text-stone-900 font-medium hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Regenerating...' : `Regenerate ${sectionLabels[section]}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
