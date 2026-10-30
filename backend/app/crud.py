import json
from typing import List, Optional
from datetime import datetime
from backend.app.database import get_db
from backend.app.models import (
    Event, EventCreate, EventUpdate,
    BudgetItem, TimelineMilestone, ChecklistTask, CreativeIdea,
    EventPlan, utc_now_iso
)
from backend.app.services.budget_calculator import calculate_budget_summary

def event_row_to_model(row) -> Event:
    return Event(
        id=row["id"],
        title=row["title"],
        event_type=row["event_type"],
        event_date=row["event_date"] or "",
        location=row["location"],
        guest_count=row["guest_count"],
        budget=row["budget"],
        currency=row["currency"],
        style=row["style"],
        priorities=json.loads(row["priorities"]),
        constraints=json.loads(row["constraints"]),
        notes=row["notes"] or "",
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

def create_event(event_data: EventCreate) -> Event:
    now = utc_now_iso()
    event = Event(
        title=event_data.title,
        event_type=event_data.event_type,
        event_date=event_data.event_date or "",
        location=event_data.location,
        guest_count=event_data.guest_count,
        budget=event_data.budget,
        currency=event_data.currency,
        style=event_data.style,
        priorities=event_data.priorities,
        constraints=event_data.constraints,
        notes=event_data.notes or "",
        created_at=now,
        updated_at=now
    )
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO events (id, title, event_type, event_date, location, guest_count, budget, currency, style, priorities, constraints, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.id, event.title, event.event_type, event.event_date,
            event.location, event.guest_count, event.budget, event.currency,
            event.style, json.dumps(event.priorities), json.dumps(event.constraints),
            event.notes, event.created_at, event.updated_at
        ))
        conn.commit()
    return event

def get_event(event_id: str) -> Optional[Event]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return event_row_to_model(row)

def list_events() -> List[Event]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        return [event_row_to_model(r) for r in rows]

def update_event(event_id: str, updates: EventUpdate) -> Optional[Event]:
    existing = get_event(event_id)
    if not existing:
        return None

    now = utc_now_iso()
    updated_fields = existing.model_dump()
    for field, val in updates.model_dump(exclude_unset=True).items():
        if val is not None:
            updated_fields[field] = val
    updated_fields["updated_at"] = now
    updated_event = Event(**updated_fields)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE events SET
                title = ?, event_type = ?, event_date = ?, location = ?,
                guest_count = ?, budget = ?, currency = ?, style = ?,
                priorities = ?, constraints = ?, notes = ?, updated_at = ?
            WHERE id = ?
        """, (
            updated_event.title, updated_event.event_type, updated_event.event_date,
            updated_event.location, updated_event.guest_count, updated_event.budget,
            updated_event.currency, updated_event.style,
            json.dumps(updated_event.priorities), json.dumps(updated_event.constraints),
            updated_event.notes, updated_event.updated_at, event_id
        ))
        conn.commit()
    return updated_event

def delete_event(event_id: str) -> bool:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_budget_items(event_id: str) -> List[BudgetItem]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM budget_items WHERE event_id = ? ORDER BY category, estimated_cost DESC", (event_id,))
        rows = cursor.fetchall()
        return [
            BudgetItem(
                id=r["id"],
                event_id=r["event_id"],
                category=r["category"],
                description=r["description"],
                estimated_cost=r["estimated_cost"],
                actual_cost=r["actual_cost"],
                notes=r["notes"] or "",
                is_custom=bool(r["is_custom"])
            )
            for r in rows
        ]

def get_timeline_milestones(event_id: str) -> List[TimelineMilestone]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM timeline_milestones WHERE event_id = ?", (event_id,))
        rows = cursor.fetchall()
        return [
            TimelineMilestone(
                id=r["id"],
                event_id=r["event_id"],
                phase=r["phase"],
                title=r["title"],
                target_date=r["target_date"] or "",
                priority=r["priority"],
                status=r["status"],
                notes=r["notes"] or ""
            )
            for r in rows
        ]

def get_checklist_tasks(event_id: str) -> List[ChecklistTask]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM checklist_tasks WHERE event_id = ? ORDER BY category, due_date", (event_id,))
        rows = cursor.fetchall()
        return [
            ChecklistTask(
                id=r["id"],
                event_id=r["event_id"],
                category=r["category"],
                title=r["title"],
                due_date=r["due_date"] or "",
                assigned_to=r["assigned_to"] or "",
                contact_info=r["contact_info"] or "",
                status=r["status"],
                notes=r["notes"] or ""
            )
            for r in rows
        ]

def get_creative_ideas(event_id: str) -> List[CreativeIdea]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM creative_ideas WHERE event_id = ? ORDER BY category", (event_id,))
        rows = cursor.fetchall()
        return [
            CreativeIdea(
                id=r["id"],
                event_id=r["event_id"],
                category=r["category"],
                title=r["title"],
                description=r["description"],
                tags=json.loads(r["tags"])
            )
            for r in rows
        ]

def get_event_plan(event_id: str) -> Optional[EventPlan]:
    event = get_event(event_id)
    if not event:
        return None

    budget_items = get_budget_items(event_id)
    timeline = get_timeline_milestones(event_id)
    checklist = get_checklist_tasks(event_id)
    ideas = get_creative_ideas(event_id)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT assumptions, generation_source FROM plan_metadata WHERE event_id = ?", (event_id,))
        meta_row = cursor.fetchone()
        if meta_row:
            assumptions = json.loads(meta_row["assumptions"])
            gen_source = meta_row["generation_source"]
        else:
            assumptions = []
            gen_source = "not_generated"

    budget_summary = calculate_budget_summary(event.budget, budget_items)

    return EventPlan(
        event=event,
        budget_summary=budget_summary,
        budget_items=budget_items,
        timeline=timeline,
        checklist=checklist,
        ideas=ideas,
        assumptions=assumptions,
        generation_source=gen_source
    )

def save_full_plan(
    event_id: str,
    budget_items: List[BudgetItem],
    timeline: List[TimelineMilestone],
    checklist: List[ChecklistTask],
    ideas: List[CreativeIdea],
    assumptions: List[str],
    generation_source: str
):
    with get_db() as conn:
        cursor = conn.cursor()
        # Clean existing items for full overwrite or initial save
        cursor.execute("DELETE FROM budget_items WHERE event_id = ?", (event_id,))
        cursor.execute("DELETE FROM timeline_milestones WHERE event_id = ?", (event_id,))
        cursor.execute("DELETE FROM checklist_tasks WHERE event_id = ?", (event_id,))
        cursor.execute("DELETE FROM creative_ideas WHERE event_id = ?", (event_id,))

        for item in budget_items:
            cursor.execute("""
                INSERT INTO budget_items (id, event_id, category, description, estimated_cost, actual_cost, notes, is_custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (item.id, event_id, item.category, item.description, item.estimated_cost, item.actual_cost, item.notes, int(item.is_custom)))

        for m in timeline:
            cursor.execute("""
                INSERT INTO timeline_milestones (id, event_id, phase, title, target_date, priority, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (m.id, event_id, m.phase, m.title, m.target_date, m.priority, m.status, m.notes))

        for t in checklist:
            cursor.execute("""
                INSERT INTO checklist_tasks (id, event_id, category, title, due_date, assigned_to, contact_info, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (t.id, event_id, t.category, t.title, t.due_date, t.assigned_to, t.contact_info, t.status, t.notes))

        for idea in ideas:
            cursor.execute("""
                INSERT INTO creative_ideas (id, event_id, category, title, description, tags)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (idea.id, event_id, idea.category, idea.title, idea.description, json.dumps(idea.tags)))

        cursor.execute("""
            INSERT OR REPLACE INTO plan_metadata (event_id, assumptions, generation_source, updated_at)
            VALUES (?, ?, ?, ?)
        """, (event_id, json.dumps(assumptions), generation_source, utc_now_iso()))

        # Mark event updated
        cursor.execute("UPDATE events SET updated_at = ? WHERE id = ?", (utc_now_iso(), event_id))

        conn.commit()

def save_budget_items(event_id: str, items: List[BudgetItem]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM budget_items WHERE event_id = ?", (event_id,))
        for item in items:
            cursor.execute("""
                INSERT INTO budget_items (id, event_id, category, description, estimated_cost, actual_cost, notes, is_custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (item.id, event_id, item.category, item.description, item.estimated_cost, item.actual_cost, item.notes, int(item.is_custom)))
        cursor.execute("UPDATE events SET updated_at = ? WHERE id = ?", (utc_now_iso(), event_id))
        conn.commit()

def save_timeline_milestones(event_id: str, milestones: List[TimelineMilestone]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM timeline_milestones WHERE event_id = ?", (event_id,))
        for m in milestones:
            cursor.execute("""
                INSERT INTO timeline_milestones (id, event_id, phase, title, target_date, priority, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (m.id, event_id, m.phase, m.title, m.target_date, m.priority, m.status, m.notes))
        cursor.execute("UPDATE events SET updated_at = ? WHERE id = ?", (utc_now_iso(), event_id))
        conn.commit()

def save_checklist_tasks(event_id: str, tasks: List[ChecklistTask]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM checklist_tasks WHERE event_id = ?", (event_id,))
        for t in tasks:
            cursor.execute("""
                INSERT INTO checklist_tasks (id, event_id, category, title, due_date, assigned_to, contact_info, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (t.id, event_id, t.category, t.title, t.due_date, t.assigned_to, t.contact_info, t.status, t.notes))
        cursor.execute("UPDATE events SET updated_at = ? WHERE id = ?", (utc_now_iso(), event_id))
        conn.commit()

def save_creative_ideas(event_id: str, ideas: List[CreativeIdea]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM creative_ideas WHERE event_id = ?", (event_id,))
        for idea in ideas:
            cursor.execute("""
                INSERT INTO creative_ideas (id, event_id, category, title, description, tags)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (idea.id, event_id, idea.category, idea.title, idea.description, json.dumps(idea.tags)))
        cursor.execute("UPDATE events SET updated_at = ? WHERE id = ?", (utc_now_iso(), event_id))
        conn.commit()
