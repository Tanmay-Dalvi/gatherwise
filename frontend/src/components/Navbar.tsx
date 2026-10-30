import React from 'react';
import { Sparkles, Calendar, Plus, Database, Cpu } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  health: SystemHealth | null;
  onOpenCreateModal: () => void;
  onNavigateHome: () => void;
  isInsideWorkspace: boolean;
  eventTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onOpenCreateModal,
  onNavigateHome,
  isInsideWorkspace,
  eventTitle,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-amber-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-editorial text-2xl font-bold tracking-tight text-stone-900">
                GatherWise
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                AI Planner
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Celebration & Event Intelligence
            </p>
          </div>
        </div>

        {/* Center Breadcrumb if in workspace */}
        {isInsideWorkspace && eventTitle && (
          <div className="hidden md:flex items-center space-x-2 text-sm text-stone-600 truncate max-w-xs lg:max-w-md">
            <span
              onClick={onNavigateHome}
              className="hover:text-stone-900 cursor-pointer font-medium"
            >
              Dashboard
            </span>
            <span className="text-stone-400">/</span>
            <span className="text-stone-900 font-semibold truncate">{eventTitle}</span>
          </div>
        )}

        {/* Right Actions & Status */}
        <div className="flex items-center space-x-3">
          {/* Provider Status Pill */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-stone-50 border-stone-200 text-stone-700"
            title={
              health?.gemini_configured
                ? 'Gemini 2.5 API is connected and active'
                : 'Running in deterministic demo & offline fallback mode'
            }
          >
            {health?.gemini_configured ? (
              <>
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline text-emerald-800 font-semibold">Gemini AI Active</span>
                <span className="sm:hidden text-emerald-800">AI</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline text-amber-800">Demo / Offline Mode</span>
                <span className="sm:hidden text-amber-800">Demo</span>
              </>
            )}
          </div>

          {/* New Event Button */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Celebration</span>
          </button>
        </div>
      </div>
    </header>
  );
};
