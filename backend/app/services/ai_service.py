import json
import logging
import re
from typing import List, Tuple, Optional, Dict, Any
import httpx
from backend.app.config import GEMINI_API_KEY
from backend.app.models import (
    Event, BudgetItem, TimelineMilestone, ChecklistTask, CreativeIdea
)
from backend.app.services.fallback_service import generate_fallback_plan

logger = logging.getLogger("gatherwise.ai_service")

GEMINI_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-1.5-flash"
API_TIMEOUT_SECONDS = 35.0

def build_planning_prompt(event: Event, custom_prompt: str = "") -> str:
    priorities_str = ", ".join(event.priorities) if event.priorities else "Memorable experience, balanced budget"
    constraints_str = ", ".join(event.constraints) if event.constraints else "None specified"
    user_notes = f"\nUser Additional Notes: {event.notes}" if event.notes else ""
    custom_add = f"\nSpecial Instruction: {custom_prompt}" if custom_prompt else ""

    return f"""You are GatherWise, an expert celebration and event planning assistant.
Generate an event plan for:
Event Type: {event.event_type}
Title: {event.title}
Target Date: {event.event_date or "Flexible / To Be Determined"}
Location: {event.location}
Guest Count: {event.guest_count}
Target Budget: {event.budget} {event.currency}
Style / Vibe: {event.style}
Priorities: {priorities_str}
Constraints: {constraints_str}{user_notes}{custom_add}

CRITICAL RULES:
1. Return ONLY valid JSON matching the exact schema requested below.
2. The estimated_cost for all budget items must sum closely to the target budget of {event.budget} {event.currency}.
3. Include an emergency Contingency Buffer item (5-10% of budget).
4. Do NOT fabricate real vendor companies, personal phone numbers, or pretend that items are active reservations.
5. All budget costs must be non-negative numbers.

Return a JSON object with this exact structure:
{{
  "budget_items": [
    {{
      "category": "Venue & Rentals | Catering & Bar | Photography & Video | Decor & Florals | Music & Entertainment | Attire & Beauty | Stationery & Signage | Contingency Buffer",
      "description": "Item description",
      "estimated_cost": 1250.00,
      "notes": "Cost rationale or guidance"
    }}
  ],
  "timeline": [
    {{
      "phase": "e.g., 6+ Months Out, 2-3 Months Out, 1 Month Out, Week Of, Day-Of Run of Show, Post-Event",
      "title": "Milestone title",
      "target_date": "Date offset or time",
      "priority": "high | medium | low",
      "notes": "Guidance"
    }}
  ],
  "checklist": [
    {{
      "category": "Logistics category",
      "title": "Task title (e.g. Schedule venue walkthrough)",
      "due_date": "Due timeframe",
      "assigned_to": "Suggested role (e.g. Host, Coordinator)",
      "contact_info": "Role contact placeholder",
      "notes": "Questions to ask or key details"
    }}
  ],
  "ideas": [
    {{
      "category": "Theme & Aesthetic | Food & Beverage | Entertainment & Activities | Personal Touches | Logistics & Savings",
      "title": "Creative concept title",
      "description": "Detailed creative concept tailored to the style and location",
      "tags": ["tag1", "tag2"]
    }}
  ],
  "assumptions": [
    "Assumption regarding local cost base, weather, or lead times"
  ]
}}
"""

def build_section_prompt(event: Event, section: str, user_prompt: str = "") -> str:
    priorities_str = ", ".join(event.priorities) if event.priorities else "Memorable experience, balanced budget"
    constraints_str = ", ".join(event.constraints) if event.constraints else "None specified"
    custom_add = f"\nUser Specific Instructions for this section: {user_prompt}" if user_prompt else ""

    base_context = f"""You are GatherWise, refining the {section.upper()} for:
Event: {event.title} ({event.event_type})
Location: {event.location} | Guests: {event.guest_count} | Budget: {event.budget} {event.currency} | Style: {event.style}
Priorities: {priorities_str} | Constraints: {constraints_str}{custom_add}
Return ONLY valid JSON.
"""

    if section == "budget":
        return base_context + f"""
Return ONLY a JSON object with:
{{
  "budget_items": [
    {{
      "category": "Venue & Rentals | Catering & Bar | Photography & Video | Decor & Florals | Music & Entertainment | Attire & Beauty | Stationery & Signage | Contingency Buffer",
      "description": "Item description",
      "estimated_cost": 1200.0,
      "notes": "Cost rationale"
    }}
  ]
}}
Ensure estimated costs sum closely to {event.budget} {event.currency}.
"""
    elif section == "timeline":
        return base_context + """
Return ONLY a JSON object with:
{{
  "timeline": [
    {{
      "phase": "e.g., 6+ Months Out, 2-3 Months Out, 1 Month Out, Week Of, Day-Of Run of Show, Post-Event",
      "title": "Milestone title",
      "target_date": "Time offset or date",
      "priority": "high | medium | low",
      "notes": "Guidance"
    }}
  ]
}}
"""
    elif section == "checklist":
        return base_context + """
Return ONLY a JSON object with:
{{
  "checklist": [
    {{
      "category": "Logistics category",
      "title": "Task title",
      "due_date": "Timeframe",
      "assigned_to": "Suggested role",
      "contact_info": "Contact role note",
      "notes": "Questions to ask"
    }}
  ]
}}
"""
    elif section == "ideas":
        return base_context + """
Return ONLY a JSON object with:
{{
  "ideas": [
    {{
      "category": "Theme & Aesthetic | Food & Beverage | Entertainment & Activities | Personal Touches | Logistics & Savings",
      "title": "Concept title",
      "description": "Creative details tailored to the event",
      "tags": ["tag1", "tag2"]
    }}
  ]
}}
"""
    return build_planning_prompt(event, user_prompt)

def clean_json_response(raw_text: str) -> str:
    """Strips markdown code blocks if present."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()

async def call_gemini_api(prompt: str, model_name: str = GEMINI_MODEL) -> Optional[str]:
    """Calls Gemini REST API with timeout and single retry."""
    if not GEMINI_API_KEY:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "response_mime_type": "application/json"
        }
    }

    async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
        try:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
            elif response.status_code in (404, 400) and model_name != FALLBACK_MODEL:
                return await call_gemini_api(prompt, model_name=FALLBACK_MODEL)
            else:
                logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Gemini API request failed: {e}")
    return None

async def generate_full_event_plan(
    event: Event,
    custom_prompt: str = ""
) -> Tuple[List[BudgetItem], List[TimelineMilestone], List[ChecklistTask], List[CreativeIdea], List[str], str]:
    """
    Generates a full plan via Gemini structured output if configured,
    or falls back deterministically. Returns (budget_items, timeline, checklist, ideas, assumptions, source).
    """
    if GEMINI_API_KEY:
        prompt = build_planning_prompt(event, custom_prompt)
        raw_text = await call_gemini_api(prompt)
        if raw_text:
            try:
                cleaned = clean_json_response(raw_text)
                data = json.loads(cleaned)

                # Parse and validate items
                budget_items = [
                    BudgetItem(
                        event_id=event.id,
                        category=item.get("category", "General"),
                        description=item.get("description", "Budget item"),
                        estimated_cost=abs(float(item.get("estimated_cost", 0.0))),
                        actual_cost=0.0,
                        notes=item.get("notes", ""),
                        is_custom=False
                    )
                    for item in data.get("budget_items", [])
                ]

                timeline = [
                    TimelineMilestone(
                        event_id=event.id,
                        phase=item.get("phase", "General Phase"),
                        title=item.get("title", "Milestone"),
                        target_date=item.get("target_date", ""),
                        priority=item.get("priority", "medium").lower() if item.get("priority", "medium").lower() in ("high", "medium", "low") else "medium",
                        status="pending",
                        notes=item.get("notes", "")
                    )
                    for item in data.get("timeline", [])
                ]

                checklist = [
                    ChecklistTask(
                        event_id=event.id,
                        category=item.get("category", "General"),
                        title=item.get("title", "Task"),
                        due_date=item.get("due_date", ""),
                        assigned_to=item.get("assigned_to", ""),
                        contact_info=item.get("contact_info", ""),
                        status="todo",
                        notes=item.get("notes", "")
                    )
                    for item in data.get("checklist", [])
                ]

                ideas = [
                    CreativeIdea(
                        event_id=event.id,
                        category=item.get("category", "Inspiration"),
                        title=item.get("title", "Creative Idea"),
                        description=item.get("description", ""),
                        tags=item.get("tags", [])
                    )
                    for item in data.get("ideas", [])
                ]

                assumptions = data.get("assumptions", [
                    f"Plan estimated for {event.guest_count} guests with {event.budget} {event.currency} budget.",
                    "Estimated vendor costs are indicative market guidelines, not contractual guarantees."
                ])

                if budget_items and timeline:
                    return budget_items, timeline, checklist, ideas, assumptions, "gemini"
            except Exception as e:
                logger.error(f"Failed to parse Gemini structured response: {e}. Falling back to deterministic plan.")

    # Fallback path (Demo mode or provider error)
    b, t, c, i, a = generate_fallback_plan(event, custom_prompt)
    return b, t, c, i, a, "demo_fallback"


async def regenerate_section(
    event: Event,
    section: str,
    user_prompt: str = ""
) -> Tuple[Any, str]:
    """
    Regenerates ONLY one section (budget, timeline, checklist, or ideas)
    using targeted structured prompt for speed and efficiency, honoring user adjustments.
    """
    if GEMINI_API_KEY:
        prompt = build_section_prompt(event, section, user_prompt)
        raw_text = await call_gemini_api(prompt)
        if raw_text:
            try:
                cleaned = clean_json_response(raw_text)
                data = json.loads(cleaned)

                if section == "budget" and "budget_items" in data:
                    items = [
                        BudgetItem(
                            event_id=event.id,
                            category=item.get("category", "General"),
                            description=item.get("description", "Budget item"),
                            estimated_cost=abs(float(item.get("estimated_cost", 0.0))),
                            actual_cost=0.0,
                            notes=item.get("notes", ""),
                            is_custom=False
                        )
                        for item in data.get("budget_items", [])
                    ]
                    if items:
                        return items, "gemini"

                elif section == "timeline" and "timeline" in data:
                    milestones = [
                        TimelineMilestone(
                            event_id=event.id,
                            phase=item.get("phase", "General Phase"),
                            title=item.get("title", "Milestone"),
                            target_date=item.get("target_date", ""),
                            priority=item.get("priority", "medium").lower() if item.get("priority", "medium").lower() in ("high", "medium", "low") else "medium",
                            status="pending",
                            notes=item.get("notes", "")
                        )
                        for item in data.get("timeline", [])
                    ]
                    if milestones:
                        return milestones, "gemini"

                elif section == "checklist" and "checklist" in data:
                    tasks = [
                        ChecklistTask(
                            event_id=event.id,
                            category=item.get("category", "General"),
                            title=item.get("title", "Task"),
                            due_date=item.get("due_date", ""),
                            assigned_to=item.get("assigned_to", ""),
                            contact_info=item.get("contact_info", ""),
                            status="todo",
                            notes=item.get("notes", "")
                        )
                        for item in data.get("checklist", [])
                    ]
                    if tasks:
                        return tasks, "gemini"

                elif section == "ideas" and "ideas" in data:
                    ideas = [
                        CreativeIdea(
                            event_id=event.id,
                            category=item.get("category", "Inspiration"),
                            title=item.get("title", "Creative Idea"),
                            description=item.get("description", ""),
                            tags=item.get("tags", [])
                        )
                        for item in data.get("ideas", [])
                    ]
                    if ideas:
                        return ideas, "gemini"

            except Exception as e:
                logger.error(f"Failed to parse targeted Gemini section response: {e}. Falling back to deterministic generator.")

    # Fallback path if no key or parsing failed
    full_b, full_t, full_c, full_i, full_a = generate_fallback_plan(event, user_prompt)
    if section == "budget":
        return full_b, "demo_fallback"
    elif section == "timeline":
        return full_t, "demo_fallback"
    elif section == "checklist":
        return full_c, "demo_fallback"
    elif section == "ideas":
        return full_i, "demo_fallback"
    else:
        raise ValueError(f"Unknown section: {section}")
