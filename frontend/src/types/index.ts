export interface Event {
  id: string;
  title: string;
  event_type: 'wedding' | 'birthday' | 'community' | 'custom' | string;
  event_date: string;
  location: string;
  guest_count: number;
  budget: number;
  currency: string;
  style: string;
  priorities: string[];
  constraints: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  event_type: string;
  event_date?: string;
  location: string;
  guest_count: number;
  budget: number;
  currency?: string;
  style?: string;
  priorities?: string[];
  constraints?: string[];
  notes?: string;
}

export interface BudgetItem {
  id: string;
  event_id: string;
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
  notes?: string;
  is_custom: boolean;
}

export interface TimelineMilestone {
  id: string;
  event_id: string;
  phase: string;
  title: string;
  target_date?: string;
  priority: 'high' | 'medium' | 'low' | string;
  status: 'pending' | 'in_progress' | 'completed' | string;
  notes?: string;
}

export interface ChecklistTask {
  id: string;
  event_id: string;
  category: string;
  title: string;
  due_date?: string;
  assigned_to?: string;
  contact_info?: string;
  status: 'todo' | 'in_progress' | 'done' | string;
  notes?: string;
}

export interface CreativeIdea {
  id: string;
  event_id: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
}

export interface CategoryCostSummary {
  estimated: number;
  actual: number;
  percentage_of_budget: number;
}

export interface BudgetSummary {
  total_estimated: number;
  total_actual: number;
  target_budget: number;
  remaining_budget: number;
  variance: number;
  is_over_budget: boolean;
  category_breakdown: Record<string, CategoryCostSummary>;
}

export interface EventPlan {
  event: Event;
  budget_summary: BudgetSummary;
  budget_items: BudgetItem[];
  timeline: TimelineMilestone[];
  checklist: ChecklistTask[];
  ideas: CreativeIdea[];
  assumptions: string[];
  generation_source: 'gemini' | 'demo_fallback' | 'user_modified' | string;
}

export interface SystemHealth {
  status: string;
  version: string;
  database: string;
  ai_provider: string;
  gemini_configured: boolean;
}
