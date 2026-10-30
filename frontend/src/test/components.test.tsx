import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventDashboard } from '../components/EventDashboard';
import { EventFormModal } from '../components/EventFormModal';
import { BudgetTab } from '../components/BudgetTab';
import { TimelineTab } from '../components/TimelineTab';
import { ChecklistTab } from '../components/ChecklistTab';
import { ExportModal } from '../components/ExportModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Event, BudgetItem, TimelineMilestone, ChecklistTask, BudgetSummary, EventPlan } from '../types';

describe('GatherWise Frontend Components', () => {
  const mockEvent: Event = {
    id: 'ev-1',
    title: 'Sophie & Liam Wedding',
    event_type: 'wedding',
    event_date: '2027-08-14',
    location: 'Coastal Cliffs, Carmel, CA',
    guest_count: 90,
    budget: 25000,
    currency: 'USD',
    style: 'Coastal Elegance',
    priorities: ['Photography', 'Great Food'],
    constraints: ['Outdoor wind contingency'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockBudgetSummary: BudgetSummary = {
    total_estimated: 24500,
    total_actual: 5000,
    target_budget: 25000,
    remaining_budget: 20000,
    variance: 0,
    is_over_budget: false,
    category_breakdown: {
      'Venue & Rentals': { estimated: 8000, actual: 5000, percentage_of_budget: 32.0 },
    },
  };

  const mockBudgetItems: BudgetItem[] = [
    {
      id: 'b-1',
      event_id: 'ev-1',
      category: 'Venue & Rentals',
      description: 'Ceremony Cliffside & Reception Lawn',
      estimated_cost: 8000,
      actual_cost: 5000,
      notes: 'Includes tenting',
      is_custom: false,
    },
  ];

  const mockTimeline: TimelineMilestone[] = [
    {
      id: 'm-1',
      event_id: 'ev-1',
      phase: 'Booking Phase',
      title: 'Secure Cliffside Venue',
      target_date: '6 Months Prior',
      priority: 'high',
      status: 'completed',
      notes: 'Deposit paid',
    },
  ];

  const mockChecklist: ChecklistTask[] = [
    {
      id: 'c-1',
      event_id: 'ev-1',
      category: 'Venue',
      title: 'Obtain sound permit for outdoor music',
      due_date: '30 Days Prior',
      assigned_to: 'Coordinator',
      contact_info: 'County Parks',
      status: 'todo',
      notes: 'Sound curfew 22:00',
    },
  ];

  describe('EventDashboard', () => {
    it('renders empty state when no events exist', () => {
      render(
        <EventDashboard
          events={[]}
          onSelectEvent={vi.fn()}
          onOpenCreateModal={vi.fn()}
          onSeedDemoEvents={vi.fn()}
          onDeleteEvent={vi.fn()}
          isLoading={false}
        />
      );
      expect(screen.getByText(/No celebrations found/i)).toBeInTheDocument();
      expect(screen.getByText(/Load 3 Sample Events/i)).toBeInTheDocument();
    });

    it('renders event cards correctly', () => {
      render(
        <EventDashboard
          events={[mockEvent]}
          onSelectEvent={vi.fn()}
          onOpenCreateModal={vi.fn()}
          onSeedDemoEvents={vi.fn()}
          onDeleteEvent={vi.fn()}
          isLoading={false}
        />
      );
      expect(screen.getByText('Sophie & Liam Wedding')).toBeInTheDocument();
      expect(screen.getByText(/Coastal Cliffs, Carmel, CA/i)).toBeInTheDocument();
      expect(screen.getByText(/90 Guests/i)).toBeInTheDocument();
    });
  });

  describe('EventFormModal', () => {
    it('validates empty and whitespace title', async () => {
      const mockSubmit = vi.fn();
      render(
        <EventFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={mockSubmit}
        />
      );

      const titleInput = screen.getByPlaceholderText(/Maya & Julian's Coastal Wedding/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const form = titleInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Please provide a name or title/i)).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('BudgetTab', () => {
    it('displays itemized budget and summary metrics', () => {
      render(
        <BudgetTab
          event={mockEvent}
          budgetSummary={mockBudgetSummary}
          budgetItems={mockBudgetItems}
          onSaveBudgetItems={vi.fn()}
          onOpenRegenerateModal={vi.fn()}
          isSaving={false}
        />
      );

      expect(screen.getByText('Ceremony Cliffside & Reception Lawn')).toBeInTheDocument();
      expect(screen.getByText(/Itemized Celebration Budget/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Custom Expense/i })).toBeInTheDocument();
    });

    it('adds a custom expense row', async () => {
      render(
        <BudgetTab
          event={mockEvent}
          budgetSummary={mockBudgetSummary}
          budgetItems={mockBudgetItems}
          onSaveBudgetItems={vi.fn()}
          onOpenRegenerateModal={vi.fn()}
          isSaving={false}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Add Custom Expense/i }));
      const descInput = screen.getByPlaceholderText(/Artisanal Gelato Cart/i);
      fireEvent.change(descInput, { target: { value: 'Artisan Gelato Cart' } });
      fireEvent.click(screen.getByRole('button', { name: /Add to Budget/i }));

      expect(await screen.findByText('Artisan Gelato Cart')).toBeInTheDocument();
      expect(screen.getByText(/Save Budget Changes/i)).toBeInTheDocument();
    });
  });

  describe('TimelineTab', () => {
    it('cycles milestone status on click', () => {
      render(
        <TimelineTab
          event={mockEvent}
          timeline={mockTimeline}
          onSaveTimeline={vi.fn()}
          onOpenRegenerateModal={vi.fn()}
          isSaving={false}
        />
      );

      expect(screen.getByText('Secure Cliffside Venue')).toBeInTheDocument();
      const statusBtn = screen.getByTitle(/Click to cycle status: completed/i);
      fireEvent.click(statusBtn);
      expect(screen.getByText(/Save Timeline/i)).toBeInTheDocument();
    });
  });

  describe('ChecklistTab', () => {
    it('displays mandatory planning disclaimer banner', () => {
      render(
        <ChecklistTab
          event={mockEvent}
          checklist={mockChecklist}
          onSaveChecklist={vi.fn()}
          onOpenRegenerateModal={vi.fn()}
          isSaving={false}
        />
      );

      expect(screen.getByText(/Important Planning Notice:/i)).toBeInTheDocument();
      expect(screen.getByText(/internal logistical action steps/i)).toBeInTheDocument();
      expect(screen.getByText('Obtain sound permit for outdoor music')).toBeInTheDocument();
    });
  });

  describe('DeleteConfirmModal', () => {
    it('handles confirm and cancel actions', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      const { rerender } = render(
        <DeleteConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Sophie & Liam Wedding"
          isDeleting={false}
        />
      );

      expect(screen.getByText(/Delete Celebration\?/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onClose).toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /Delete Permanently/i }));
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe('ExportModal', () => {
    it('triggers window.print when print option is clicked', () => {
      const originalPrint = window.print;
      window.print = vi.fn();

      const mockPlan: EventPlan = {
        event: mockEvent,
        budget_summary: mockBudgetSummary,
        budget_items: mockBudgetItems,
        timeline: mockTimeline,
        checklist: mockChecklist,
        ideas: [],
        assumptions: [],
        generation_source: 'gemini',
      };

      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          plan={mockPlan}
        />
      );

      expect(screen.getByText(/Export & Print Celebration Plan/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/Print or Save as PDF/i));
      expect(window.print).toHaveBeenCalled();

      window.print = originalPrint;
    });
  });
});
