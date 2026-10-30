# GatherWise API Contract

Base URL: `/api/v1`

## Health & System
- `GET /api/v1/health`
  - Response `200 OK`:
    ```json
    {
      "status": "ok",
      "version": "1.0.0",
      "database": "connected",
      "ai_provider": "gemini" | "demo_fallback",
      "gemini_configured": boolean
    }
    ```

## Events CRUD
- `GET /api/v1/events`
  - Returns list of summary events.
- `POST /api/v1/events`
  - Request: `EventCreate` schema
  - Response `201 Created`: `Event` schema
- `GET /api/v1/events/{event_id}`
  - Response `200 OK`: `Event`
  - Response `404 Not Found`
- `PUT /api/v1/events/{event_id}`
  - Request: `EventUpdate` schema
  - Response `200 OK`: `Event`
- `DELETE /api/v1/events/{event_id}`
  - Cascading delete of all associated budget items, milestones, tasks, and ideas.
  - Response `200 OK`: `{"status": "deleted", "id": "..."}`

## Event Plan & Generation
- `GET /api/v1/events/{event_id}/plan`
  - Returns full aggregated `EventPlan` (with deterministic budget calculations)
- `POST /api/v1/events/{event_id}/generate`
  - Generates full plan using Gemini structured output or deterministic fallback.
  - Persists generated budget items, timeline, checklist, ideas.
  - Request Body: Optional custom instructions `{"custom_prompt": "string"}`
  - Response `200 OK`: `EventPlan`
- `POST /api/v1/events/{event_id}/regenerate-section`
  - Targeted regeneration of a SINGLE section (`budget` | `timeline` | `checklist` | `ideas`) without touching other sections or wiping out manual edits elsewhere.
  - Request Body:
    ```json
    {
      "section": "budget" | "timeline" | "checklist" | "ideas",
      "user_prompt": "Optional adjustments e.g. 'Cut catering by 15% and reallocate to music'",
      "preserve_manual_items": true
    }
    ```
  - Response `200 OK`: Updated section items & recalculation

## Section Items Mutation
- `PUT /api/v1/events/{event_id}/budget-items`
  - Updates list of budget items (estimates, actuals, descriptions, categories)
  - Re-evaluates deterministic totals, returns updated items and summary
- `PUT /api/v1/events/{event_id}/timeline-milestones`
  - Updates milestone list (status, dates, titles, priorities)
- `PUT /api/v1/events/{event_id}/checklist-tasks`
  - Updates checklist items (status, assignees, notes)
- `PUT /api/v1/events/{event_id}/ideas`
  - Updates ideas list

## Export Endpoints
- `GET /api/v1/events/{event_id}/export/markdown`
  - Returns sanitized formatted Markdown document for the event plan.
- `GET /api/v1/events/{event_id}/export/json`
  - Returns full sanitized JSON backup file.

## Error Schema
Standard error response across all endpoints:
```json
{
  "detail": "Descriptive error message",
  "error_code": "VALIDATION_ERROR | NOT_FOUND | AI_PROVIDER_ERROR | RATE_LIMIT",
  "status_code": 400 | 404 | 422 | 500
}
```
