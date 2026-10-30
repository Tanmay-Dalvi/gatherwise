import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { EventCreate } from '../types';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventCreate) => Promise<void>;
  initialData?: Partial<EventCreate>;
  isEditing?: boolean;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [eventType, setEventType] = useState(initialData?.event_type || 'wedding');
  const [eventDate, setEventDate] = useState(initialData?.event_date || '');
  const [isDateFlexible, setIsDateFlexible] = useState(!initialData?.event_date);
  const [location, setLocation] = useState(initialData?.location || '');
  const [guestCount, setGuestCount] = useState<number>(initialData?.guest_count || 75);
  const [budget, setBudget] = useState<number>(initialData?.budget || 15000);
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [style, setStyle] = useState(initialData?.style || 'Warm & Elegant');
  const [prioritiesText, setPrioritiesText] = useState(initialData?.priorities?.join(', ') || '');
  const [constraintsText, setConstraintsText] = useState(initialData?.constraints?.join(', ') || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const stylePresets = [
    'Rustic Elegance',
    'Modern Minimalist',
    'Bohemian Garden',
    'Black-Tie Gala',
    'Retro Neon',
    'Cozy Family Festival'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a name or title for your celebration.');
      return;
    }
    if (!location.trim()) {
      setError('Please provide a city, area, or venue description.');
      return;
    }
    if (guestCount < 1 || isNaN(guestCount)) {
      setError('Guest count must be at least 1 person.');
      return;
    }
    if (budget < 0 || isNaN(budget)) {
      setError('Budget cannot be negative.');
      return;
    }

    const priorities = prioritiesText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const constraints = constraintsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        event_type: eventType,
        event_date: isDateFlexible ? '' : eventDate,
        location: location.trim(),
        guest_count: Number(guestCount),
        budget: Number(budget),
        currency,
        style: style.trim(),
        priorities,
        constraints,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save celebration details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="font-editorial text-xl font-bold text-stone-900">
                {isEditing ? 'Edit Celebration Details' : 'Create a New Celebration'}
              </h2>
              <p className="text-xs text-stone-500">
                GatherWise will structure a customized budget, timeline, and vendor action plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Celebration Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maya & Julian's Coastal Wedding, Leo's 30th Birthday, Oakridge Earth Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
          </div>

          {/* Event Type & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Event Type *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 bg-white"
              >
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday Celebration</option>
                <option value="community">Community Gathering</option>
                <option value="custom">Gala / Custom Celebration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Aesthetic & Style
              </label>
              <input
                type="text"
                placeholder="e.g. Rustic Elegance, Neon 90s, Formal"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Preset style pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stylePresets.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setStyle(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  style === preset
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-medium'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Target Date
                </label>
                <label className="flex items-center space-x-1.5 text-xs text-stone-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDateFlexible}
                    onChange={(e) => setIsDateFlexible(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Flexible / TBD</span>
                </label>
              </div>
              <input
                type="date"
                disabled={isDateFlexible}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  isDateFlexible
                    ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                    : 'border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Location or Venue *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sonoma Valley, CA or Downtown Loft"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Guests, Budget & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Estimated Guests *
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Target Budget *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={budget}
                onChange={(e) => setBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          {/* Priorities & Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Key Priorities (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Delicious Food, Golden-Hour Photos, Live DJ"
                value={prioritiesText}
                onChange={(e) => setPrioritiesText(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Constraints / Preferences
              </label>
              <input
                type="text"
                placeholder="e.g. Rain contingency, vegan menu, sound curfew"
                value={constraintsText}
                onChange={(e) => setConstraintsText(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Personal Vision & Special Requests
            </label>
            <textarea
              rows={2}
              placeholder="Any specific thoughts, special traditions, or ideas you want GatherWise to incorporate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
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
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Generate Event Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
