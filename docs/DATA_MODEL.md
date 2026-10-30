# GatherWise Data Model Specification

## Domain Entities

### 1. Event
Represents the celebration instance.
```json
{
  "id": "string (UUID)",
  "title": "string (1-120 chars)",
  "event_type": "wedding | birthday | community | custom",
  "event_date": "string (YYYY-MM-DD or null/empty for flexible date)",
  "location": "string (1-200 chars)",
  "guest_count": "integer (>= 1, <= 100000)",
  "budget": "float (>= 0, <= 100000000)",
  "currency": "string (USD, EUR, GBP, CAD, INR, AUD, etc.)",
  "style": "string (1-100 chars, e.g., 'Rustic Boho', 'Formal Gala', 'Modern Vibrant')",
  "priorities": ["string"],
  "constraints": ["string"],
  "notes": "string (optional)",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

### 2. BudgetItem
Represents a deterministic line item in the financial plan.
```json
{
  "id": "string (UUID)",
  "event_id": "string (UUID)",
  "category": "string (Venue, Catering, Photography, Music/Entertainment, Decor, Attire, Stationery, Rentals, Logistics, Contingency)",
  "description": "string (1-255 chars)",
  "estimated_cost": "float (>= 0)",
  "actual_cost": "float (>= 0, default 0.0)",
  "notes": "string (optional)",
  "is_custom": "boolean (true if user added)"
}
```

### 3. TimelineMilestone
Represents a chronological milestone or run-of-show item.
```json
{
  "id": "string (UUID)",
  "event_id": "string (UUID)",
  "phase": "string (e.g., '6+ Months Out', '2-3 Months Out', '1 Month Out', '1 Week Out', 'Day-Of Schedule', 'Post-Event')",
  "title": "string (1-255 chars)",
  "target_date": "string (YYYY-MM-DD or offset like 'Day-of 14:00')",
  "priority": "high | medium | low",
  "status": "pending | in_progress | completed",
  "notes": "string (optional)"
}
```

### 4. ChecklistTask
Represents vendor tasks, action items, or logistical preparations.
*(Explicit disclaimer: A checklist item is an internal action item, not a live booking or quote).*
```json
{
  "id": "string (UUID)",
  "event_id": "string (UUID)",
  "category": "string (Venue & Permitting, Catering & Bar, Media, Decor, Entertainment, Logistics)",
  "title": "string (1-255 chars)",
  "due_date": "string (YYYY-MM-DD or relative offset)",
  "assigned_to": "string (optional)",
  "contact_info": "string (optional)",
  "status": "todo | in_progress | done",
  "notes": "string (optional)"
}
```

### 5. CreativeIdea
Represents AI-suggested or user-curated personalized concepts.
```json
{
  "id": "string (UUID)",
  "event_id": "string (UUID)",
  "category": "Theme & Aesthetic | Food & Beverage | Entertainment & Activities | Personal Touches | Logistics & Savings",
  "title": "string (1-150 chars)",
  "description": "string",
  "tags": ["string"]
}
```

### 6. EventPlan (Aggregated Snapshot)
Aggregates the event details, calculated budget summaries, milestones, checklist, creative ideas, and explicit assumptions.
```json
{
  "event": Event,
  "budget_summary": {
    "total_estimated": "float",
    "total_actual": "float",
    "target_budget": "float",
    "remaining_budget": "float",
    "variance": "float (actual - estimated)",
    "is_over_budget": "boolean",
    "category_breakdown": {
      "CategoryName": {
        "estimated": "float",
        "actual": "float",
        "percentage_of_budget": "float"
      }
    }
  },
  "budget_items": [BudgetItem],
  "timeline": [TimelineMilestone],
  "checklist": [ChecklistTask],
  "ideas": [CreativeIdea],
  "assumptions": ["string"],
  "generation_source": "gemini | demo_fallback | user_modified"
}
```
