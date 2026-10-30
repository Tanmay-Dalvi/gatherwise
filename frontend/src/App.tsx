import React, { useState, useEffect } from 'react';
import { Event, EventPlan, SystemHealth, EventCreate } from './types';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { EventDashboard } from './components/EventDashboard';
import { EventWorkspace } from './components/EventWorkspace';
import { EventFormModal } from './components/EventFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<EventPlan | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlanLoading, setIsPlanLoading] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [healthRes, eventsRes] = await Promise.all([
          api.getHealth().catch(() => null),
          api.listEvents().catch(() => []),
        ]);
        if (healthRes) setHealth(healthRes);
        setEvents(eventsRes);
      } catch (err: any) {
        showToast('error', 'Failed to connect to GatherWise backend.');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load plan when activeEventId changes
  const loadActivePlan = async (id: string) => {
    setIsPlanLoading(true);
    try {
      let plan: EventPlan;
      try {
        plan = await api.getPlan(id);
      } catch {
        // If plan not yet generated, trigger generation
        plan = await api.generatePlan(id);
      }
      setCurrentPlan(plan);
      setActiveEventId(id);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load celebration plan.');
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleSelectEvent = (id: string) => {
    loadActivePlan(id);
  };

  const handleRefreshPlan = async (updatedPlan?: EventPlan) => {
    if (updatedPlan) {
      setCurrentPlan(updatedPlan);
    } else if (activeEventId) {
      await loadActivePlan(activeEventId);
    }
  };

  const handleBackToDashboard = async () => {
    setActiveEventId(null);
    setCurrentPlan(null);
    // Refresh events list
    try {
      const refreshed = await api.listEvents();
      setEvents(refreshed);
    } catch {}
  };

  const handleCreateEvent = async (data: EventCreate) => {
    try {
      // 1. Create event
      const created = await api.createEvent(data);
      showToast('info', 'Celebration initialized! Generating custom plan...');
      // 2. Generate plan
      const plan = await api.generatePlan(created.id);
      setCurrentPlan(plan);
      setActiveEventId(created.id);
      showToast('success', 'Custom celebration plan ready!');
      // Update list
      const refreshed = await api.listEvents();
      setEvents(refreshed);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to create celebration.');
      throw err;
    }
  };

  const handleSeedDemoEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.seedDemoEvents();
      showToast('success', `Loaded ${res.count} curated celebrations ready for inspection!`);
      const refreshed = await api.listEvents();
      setEvents(refreshed);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to seed demo events.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    try {
      await api.deleteEvent(deleteModal.id);
      showToast('success', 'Celebration deleted.');
      if (activeEventId === deleteModal.id) {
        setActiveEventId(null);
        setCurrentPlan(null);
      }
      const refreshed = await api.listEvents();
      setEvents(refreshed);
      setDeleteModal({ isOpen: false, id: '', title: '' });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete celebration.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Top Navigation */}
      <Navbar
        health={health}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onNavigateHome={handleBackToDashboard}
        isInsideWorkspace={Boolean(activeEventId && currentPlan)}
        eventTitle={currentPlan?.event?.title}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-stone-600">
              GatherWise is connecting to local celebration intelligence...
            </p>
          </div>
        ) : isPlanLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-stone-600">
              Synthesizing customized budget, milestones, and action items...
            </p>
          </div>
        ) : activeEventId && currentPlan ? (
          <EventWorkspace
            plan={currentPlan}
            onBackToDashboard={handleBackToDashboard}
            onRefreshPlan={handleRefreshPlan}
            showToast={showToast}
          />
        ) : (
          <EventDashboard
            events={events}
            onSelectEvent={handleSelectEvent}
            onOpenCreateModal={() => setIsCreateOpen(true)}
            onSeedDemoEvents={handleSeedDemoEvents}
            onDeleteEvent={(id, title) => setDeleteModal({ isOpen: true, id, title })}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Modals & Feedback */}
      <EventFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateEvent}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.title}
        isDeleting={false}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
export default App;
