import React from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Sparkles,
  ArrowRight,
  Trash2,
  PartyPopper,
  HeartHandshake,
  Cake,
  FolderHeart
} from 'lucide-react';
import { Event } from '../types';
import { formatCurrency, formatEventDate, getCountdownDays } from '../utils/format';

interface EventDashboardProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
  onOpenCreateModal: () => void;
  onSeedDemoEvents: () => void;
  onDeleteEvent: (eventId: string, title: string) => void;
  isLoading: boolean;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({
  events,
  onSelectEvent,
  onOpenCreateModal,
  onSeedDemoEvents,
  onDeleteEvent,
  isLoading,
}) => {
  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wedding':
        return <FolderHeart className="w-4 h-4 text-rosewood-600" />;
      case 'birthday':
        return <Cake className="w-4 h-4 text-amber-600" />;
      case 'community':
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      default:
        return <PartyPopper className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wedding':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'birthday':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'community':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-2xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-amber-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Celebration & Gathering Intelligence</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Plan extraordinary celebrations with clarity and heart.
          </h1>
          <p className="text-stone-300 text-sm sm:text-base mb-6 leading-relaxed">
            Weddings, milestone birthdays, and community gatherings—orchestrated with
            deterministic budget calculations, granular timelines, vendor checklists, and creative ideas.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition shadow-lg shadow-amber-900/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create New Celebration</span>
            </button>
            <button
              onClick={onSeedDemoEvents}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-sm transition border border-white/20"
            >
              <span>{isLoading ? 'Loading Demo Data...' : 'Explore Demo Celebrations'}</span>
            </button>
          </div>
        </div>
        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Events Grid Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Your Celebrations</h2>
          <p className="text-sm text-stone-500">
            {events.length === 0
              ? 'No celebrations created yet'
              : `Managing ${events.length} planned celebration${events.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 && !isLoading && (
        <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
            <PartyPopper className="w-8 h-8" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-stone-900 mb-2">
            No celebrations found
          </h3>
          <p className="text-stone-600 text-sm mb-6 max-w-md mx-auto">
            Start by creating your own wedding, birthday, or community event, or load
            our curated demo celebrations to see budgets and timelines in action.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create First Celebration</span>
            </button>
            <button
              onClick={onSeedDemoEvents}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-100 text-amber-900 font-medium text-sm hover:bg-amber-200 transition"
            >
              <span>Load 3 Sample Events</span>
            </button>
          </div>
        </div>
      )}

      {/* Events Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const countdown = getCountdownDays(event.event_date);
          return (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                {/* Type and Countdown badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getEventTypeBadge(
                      event.event_type
                    )}`}
                  >
                    {getEventTypeIcon(event.event_type)}
                    <span className="capitalize">{event.event_type}</span>
                  </span>

                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                      countdown.isPast
                        ? 'bg-stone-100 text-stone-500'
                        : 'bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold'
                    }`}
                  >
                    {countdown.text}
                  </span>
                </div>

                {/* Event Title */}
                <h3
                  onClick={() => onSelectEvent(event.id)}
                  className="font-editorial text-xl font-bold text-stone-900 group-hover:text-amber-700 transition cursor-pointer mb-2 line-clamp-1"
                >
                  {event.title}
                </h3>

                {/* Style tag */}
                <p className="text-xs font-medium text-amber-700 bg-amber-50/70 inline-block px-2 py-0.5 rounded mb-4">
                  ✨ {event.style || 'Celebratory'}
                </p>

                {/* Metadata List */}
                <div className="space-y-2 text-sm text-stone-600 mb-4">
                  <div className="flex items-center space-x-2 truncate">
                    <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="truncate">{formatEventDate(event.event_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 truncate">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>{event.guest_count.toLocaleString()} Guests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(event.budget, event.currency)} Budget
                    </span>
                  </div>
                </div>

                {/* Priorities preview */}
                {event.priorities && event.priorities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-stone-100">
                    {event.priorities.slice(0, 2).map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                    {event.priorities.length > 2 && (
                      <span className="text-[11px] text-stone-400 self-center">
                        +{event.priorities.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => onDeleteEvent(event.id, event.title)}
                  className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                  title="Delete event"
                  aria-label={`Delete ${event.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectEvent(event.id)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-900 hover:text-amber-700 bg-white border border-stone-200 px-3.5 py-1.5 rounded-lg shadow-sm hover:border-amber-300 transition"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
