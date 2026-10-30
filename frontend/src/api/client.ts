import {
  Event,
  EventCreate,
  EventPlan,
  BudgetItem,
  TimelineMilestone,
  ChecklistTask,
  CreativeIdea,
  SystemHealth
} from '../types';

// Configurable backend API base URL for production deployment (e.g. Render)
// When VITE_API_BASE_URL is not set (local development), defaults to '/api/v1' using the Vite proxy.
const rawBase = import.meta.env.VITE_API_BASE_URL ? String(import.meta.env.VITE_API_BASE_URL).trim() : '';
export const API_BASE = rawBase
  ? `${rawBase.replace(/\/+$/, '')}${rawBase.endsWith('/api/v1') ? '' : '/api/v1'}`
  : '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected server error occurred';
    try {
      const data = await res.json();
      errorDetail = data.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // System Health
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<SystemHealth>(res);
  },

  // Events CRUD
  async listEvents(): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/events`);
    return handleResponse<Event[]>(res);
  },

  async createEvent(event: EventCreate): Promise<Event> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return handleResponse<Event>(res);
  },

  async getEvent(id: string): Promise<Event> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return handleResponse<Event>(res);
  },

  async updateEvent(id: string, updates: Partial<EventCreate>): Promise<Event> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Event>(res);
  },

  async deleteEvent(id: string): Promise<{ status: string; id: string }> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ status: string; id: string }>(res);
  },

  async seedDemoEvents(): Promise<{ status: string; count: number; events: Event[] }> {
    const res = await fetch(`${API_BASE}/events/seed-demo`, {
      method: 'POST',
    });
    return handleResponse<{ status: string; count: number; events: Event[] }>(res);
  },

  // Plan Generation & Regeneration
  async getPlan(eventId: string): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/plan`);
    return handleResponse<EventPlan>(res);
  },

  async generatePlan(eventId: string, customPrompt: string = ''): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_prompt: customPrompt }),
    });
    return handleResponse<EventPlan>(res);
  },

  async regenerateSection(
    eventId: string,
    section: 'budget' | 'timeline' | 'checklist' | 'ideas',
    userPrompt: string = '',
    preserveManualItems: boolean = true
  ): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/regenerate-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section,
        user_prompt: userPrompt,
        preserve_manual_items: preserveManualItems,
      }),
    });
    return handleResponse<EventPlan>(res);
  },

  // Section Updates
  async updateBudgetItems(eventId: string, items: BudgetItem[]): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/budget-items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return handleResponse<EventPlan>(res);
  },

  async updateTimeline(eventId: string, milestones: TimelineMilestone[]): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/timeline-milestones`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestones }),
    });
    return handleResponse<EventPlan>(res);
  },

  async updateChecklist(eventId: string, tasks: ChecklistTask[]): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/checklist-tasks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });
    return handleResponse<EventPlan>(res);
  },

  async updateIdeas(eventId: string, ideas: CreativeIdea[]): Promise<EventPlan> {
    const res = await fetch(`${API_BASE}/events/${eventId}/ideas`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas }),
    });
    return handleResponse<EventPlan>(res);
  },

  // Export URLs
  getMarkdownExportUrl(eventId: string): string {
    return `${API_BASE}/events/${eventId}/export/markdown`;
  },

  getJSONExportUrl(eventId: string): string {
    return `${API_BASE}/events/${eventId}/export/json`;
  },
};
