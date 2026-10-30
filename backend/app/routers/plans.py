import re
from fastapi import APIRouter, HTTPException, Response
from backend.app.models import (
    EventPlan, PlanGenerateRequest, RegenerateSectionRequest,
    BudgetItemsUpdate, TimelineUpdate, ChecklistUpdate, IdeasUpdate,
    BudgetItem
)
from backend.app.crud import (
    get_event, get_event_plan, save_full_plan,
    save_budget_items, save_timeline_milestones, save_checklist_tasks, save_creative_ideas,
    get_budget_items, get_timeline_milestones, get_checklist_tasks, get_creative_ideas
)
from backend.app.services.ai_service import generate_full_event_plan, regenerate_section

router = APIRouter(prefix="/events/{event_id}", tags=["Event Plans"])

@router.get("/plan", response_model=EventPlan)
def get_plan(event_id: str):
    plan = get_event_plan(event_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Event plan not found")
    return plan

@router.post("/generate", response_model=EventPlan)
async def generate_plan(event_id: str, req: PlanGenerateRequest = PlanGenerateRequest()):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    budget_items, timeline, checklist, ideas, assumptions, source = await generate_full_event_plan(
        event, custom_prompt=req.custom_prompt or ""
    )

    save_full_plan(
        event_id=event.id,
        budget_items=budget_items,
        timeline=timeline,
        checklist=checklist,
        ideas=ideas,
        assumptions=assumptions,
        generation_source=source
    )

    plan = get_event_plan(event_id)
    if not plan:
        raise HTTPException(status_code=500, detail="Failed to retrieve generated plan")
    return plan

@router.post("/regenerate-section", response_model=EventPlan)
async def regenerate_event_section(event_id: str, req: RegenerateSectionRequest):
    """
    Regenerates a single targeted section without wiping out other sections.
    If preserve_manual_items is True, keeps user-customized lines and completed items.
    """
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing_plan = get_event_plan(event_id)
    if not existing_plan:
        raise HTTPException(status_code=404, detail="Event plan does not exist yet")

    new_items, source = await regenerate_section(event, req.section, req.user_prompt or "")

    if req.section == "budget":
        if req.preserve_manual_items:
            # Preserve items that the user customized (is_custom == True) or already has recorded actual spend
            preserved = [item for item in existing_plan.budget_items if item.is_custom or item.actual_cost > 0]
            preserved_cats = {item.category.lower().strip() for item in preserved}
            # Only add newly generated items for categories that were not preserved to avoid duplicate rows
            new_additions = [item for item in new_items if item.category.lower().strip() not in preserved_cats]
            combined = preserved + new_additions
            save_budget_items(event_id, combined)
        else:
            save_budget_items(event_id, new_items)

    elif req.section == "timeline":
        if req.preserve_manual_items:
            # Preserve completed or in_progress milestones
            preserved = [m for m in existing_plan.timeline if m.status in ("completed", "in_progress")]
            combined = preserved + [m for m in new_items if not any(p.title.lower() == m.title.lower() for p in preserved)]
            save_timeline_milestones(event_id, combined)
        else:
            save_timeline_milestones(event_id, new_items)

    elif req.section == "checklist":
        if req.preserve_manual_items:
            # Preserve completed tasks
            preserved = [t for t in existing_plan.checklist if t.status == "done"]
            combined = preserved + [t for t in new_items if not any(p.title.lower() == t.title.lower() for p in preserved)]
            save_checklist_tasks(event_id, combined)
        else:
            save_checklist_tasks(event_id, new_items)

    elif req.section == "ideas":
        save_creative_ideas(event_id, new_items)

    updated_plan = get_event_plan(event_id)
    return updated_plan

@router.put("/budget-items", response_model=EventPlan)
def update_budget(event_id: str, payload: BudgetItemsUpdate):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Ensure all items have correct event_id
    sanitized_items = []
    for item in payload.items:
        item_dict = item.model_dump()
        item_dict["event_id"] = event_id
        sanitized_items.append(BudgetItem(**item_dict))

    save_budget_items(event_id, sanitized_items)
    return get_event_plan(event_id)

@router.put("/timeline-milestones", response_model=EventPlan)
def update_milestones(event_id: str, payload: TimelineUpdate):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for m in payload.milestones:
        m.event_id = event_id

    save_timeline_milestones(event_id, payload.milestones)
    return get_event_plan(event_id)

@router.put("/checklist-tasks", response_model=EventPlan)
def update_tasks(event_id: str, payload: ChecklistUpdate):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for t in payload.tasks:
        t.event_id = event_id

    save_checklist_tasks(event_id, payload.tasks)
    return get_event_plan(event_id)

@router.put("/ideas", response_model=EventPlan)
def update_ideas(event_id: str, payload: IdeasUpdate):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for idea in payload.ideas:
        idea.event_id = event_id

    save_creative_ideas(event_id, payload.ideas)
    return get_event_plan(event_id)

@router.get("/export/markdown")
def export_plan_markdown(event_id: str):
    plan = get_event_plan(event_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Event plan not found")

    e = plan.event
    s = plan.budget_summary

    lines = [
        f"# {e.title}",
        f"**Event Type:** {e.event_type.capitalize()} | **Date:** {e.event_date or 'Flexible / TBD'} | **Location:** {e.location}",
        f"**Guests:** {e.guest_count} | **Target Budget:** {e.budget:,.2f} {e.currency} | **Style:** {e.style}",
        "",
        "## Budget Summary",
        f"- **Target Budget:** {s.target_budget:,.2f} {e.currency}",
        f"- **Total Estimated:** {s.total_estimated:,.2f} {e.currency}",
        f"- **Total Actual Spent:** {s.total_actual:,.2f} {e.currency}",
        f"- **Remaining Budget:** {s.remaining_budget:,.2f} {e.currency}",
        f"- **Status:** {'⚠️ Over Budget' if s.is_over_budget else '✅ On Track'}",
        "",
        "### Itemized Budget Breakdown",
        "| Category | Description | Estimated | Actual | Notes |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ]
    for b in plan.budget_items:
        lines.append(f"| {b.category} | {b.description} | {b.estimated_cost:,.2f} {e.currency} | {b.actual_cost:,.2f} {e.currency} | {b.notes} |")

    lines.extend([
        "",
        "## Timeline & Milestones",
        "| Phase | Milestone | Target Date | Priority | Status | Notes |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for t in plan.timeline:
        lines.append(f"| {t.phase} | {t.title} | {t.target_date} | {t.priority.upper()} | {t.status.upper()} | {t.notes} |")

    lines.extend([
        "",
        "## Vendor & Task Checklist",
        "*(Note: Checklist items are logistical planning action items, not live reservations)*",
        "| Category | Task | Due Date | Owner | Status | Contact / Notes |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ])
    for c in plan.checklist:
        status_icon = "☑️" if c.status == "done" else "◻️"
        lines.append(f"| {c.category} | {c.title} | {c.due_date} | {c.assigned_to or 'Unassigned'} | {status_icon} {c.status} | {c.contact_info} - {c.notes} |")

    lines.extend([
        "",
        "## Creative Personalized Ideas & Tips"
    ])
    for idea in plan.ideas:
        lines.append(f"### {idea.title} ({idea.category})")
        lines.append(f"{idea.description}")
        if idea.tags:
            lines.append(f"*Tags: {', '.join(idea.tags)}*")
        lines.append("")

    lines.extend([
        "## Planning Assumptions & Disclaimers",
        "- All pricing entries represent estimated budgetary guidelines based on standard market rates.",
        "- Checklist entries represent internal operational steps and do not constitute confirmed vendor bookings or quotes."
    ])
    for a in plan.assumptions:
        lines.append(f"- {a}")

    md_content = "\n".join(lines)
    safe_id = re.sub(r'[^a-zA-Z0-9_-]', '', event_id)
    return Response(content=md_content, media_type="text/markdown", headers={
        "Content-Disposition": f'attachment; filename="gatherwise_plan_{safe_id}.md"'
    })

@router.get("/export/json")
def export_plan_json(event_id: str):
    plan = get_event_plan(event_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Event plan not found")
    return plan.model_dump()
