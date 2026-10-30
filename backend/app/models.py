from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator
import math
import uuid
from datetime import datetime, timezone

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class BudgetItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    estimated_cost: float = Field(..., ge=0.0)
    actual_cost: float = Field(default=0.0, ge=0.0)
    notes: Optional[str] = Field(default="", max_length=500)
    is_custom: bool = Field(default=False)

    @field_validator("estimated_cost", "actual_cost")
    @classmethod
    def validate_finite_cost(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Cost must be a finite number")
        if v < 0:
            raise ValueError("Cost cannot be negative")
        return round(float(v), 2)

class TimelineMilestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    phase: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    target_date: Optional[str] = Field(default="", max_length=100)
    priority: str = Field(default="medium", max_length=20) # high, medium, low
    status: str = Field(default="pending", max_length=20) # pending, in_progress, completed
    notes: Optional[str] = Field(default="", max_length=500)

class ChecklistTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    category: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    due_date: Optional[str] = Field(default="", max_length=100)
    assigned_to: Optional[str] = Field(default="", max_length=100)
    contact_info: Optional[str] = Field(default="", max_length=200)
    status: str = Field(default="todo", max_length=20) # todo, in_progress, done
    notes: Optional[str] = Field(default="", max_length=500)

class CreativeIdea(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    category: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., min_length=1, max_length=1000)
    tags: List[str] = Field(default_factory=list)

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=1, max_length=120)
    event_type: str = Field(..., min_length=1, max_length=50) # wedding, birthday, community, custom
    event_date: Optional[str] = Field(default="", max_length=50)
    location: str = Field(..., min_length=1, max_length=200)
    guest_count: int = Field(..., ge=1, le=100000)
    budget: float = Field(..., ge=0.0, le=1000000000.0)
    currency: str = Field(default="USD", min_length=1, max_length=10)
    style: str = Field(default="Modern Elegant", min_length=1, max_length=100)
    priorities: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default="", max_length=2000)
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)

    @field_validator("budget")
    @classmethod
    def validate_budget_finite(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Budget must be a finite number")
        if v < 0:
            raise ValueError("Budget cannot be negative")
        return round(float(v), 2)

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    event_type: str = Field(..., min_length=1, max_length=50)
    event_date: Optional[str] = Field(default="", max_length=50)
    location: str = Field(..., min_length=1, max_length=200)
    guest_count: int = Field(..., ge=1, le=100000)
    budget: float = Field(..., ge=0.0, le=1000000000.0)
    currency: str = Field(default="USD", min_length=1, max_length=10)
    style: str = Field(default="Modern Elegant", min_length=1, max_length=100)
    priorities: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default="", max_length=2000)

    @field_validator("title", "location", "event_type", mode="before")
    @classmethod
    def strip_and_validate_non_empty(cls, v: str) -> str:
        if isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("Field cannot be empty or whitespace only")
            return stripped
        return v

    @field_validator("event_date")
    @classmethod
    def validate_event_date_format(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return ""
        v = v.strip()
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Event date must be a valid date in YYYY-MM-DD format, or empty for flexible date")
        return v

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v) or v < 0:
            raise ValueError("Budget must be a non-negative finite number")
        return round(float(v), 2)

class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    event_type: Optional[str] = Field(None, min_length=1, max_length=50)
    event_date: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    guest_count: Optional[int] = Field(None, ge=1, le=100000)
    budget: Optional[float] = Field(None, ge=0.0, le=1000000000.0)
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    style: Optional[str] = Field(None, min_length=1, max_length=100)
    priorities: Optional[List[str]] = None
    constraints: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("title", "location", "event_type", mode="before")
    @classmethod
    def strip_and_validate_opt_string(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("Field cannot be empty or whitespace only")
            return stripped
        return v

    @field_validator("event_date")
    @classmethod
    def validate_opt_event_date_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            try:
                datetime.strptime(v.strip(), "%Y-%m-%d")
            except ValueError:
                raise ValueError("Event date must be a valid date in YYYY-MM-DD format, or empty for flexible date")
            return v.strip()
        return "" if v is not None else None

    @field_validator("budget")
    @classmethod
    def validate_budget_opt(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if math.isnan(v) or math.isinf(v) or v < 0:
                raise ValueError("Budget must be a non-negative finite number")
            return round(float(v), 2)
        return v

class CategoryCostSummary(BaseModel):
    estimated: float
    actual: float
    percentage_of_budget: float

class BudgetSummary(BaseModel):
    total_estimated: float
    total_actual: float
    target_budget: float
    remaining_budget: float # target_budget - total_actual
    variance: float # total_actual - total_estimated
    is_over_budget: bool
    category_breakdown: Dict[str, CategoryCostSummary]

class EventPlan(BaseModel):
    event: Event
    budget_summary: BudgetSummary
    budget_items: List[BudgetItem]
    timeline: List[TimelineMilestone]
    checklist: List[ChecklistTask]
    ideas: List[CreativeIdea]
    assumptions: List[str]
    generation_source: str # "gemini", "demo_fallback", or "user_modified"

class PlanGenerateRequest(BaseModel):
    custom_prompt: Optional[str] = Field(default="", max_length=1000)

class RegenerateSectionRequest(BaseModel):
    section: str = Field(..., pattern="^(budget|timeline|checklist|ideas)$")
    user_prompt: Optional[str] = Field(default="", max_length=1000)
    preserve_manual_items: bool = Field(default=True)

class BudgetItemsUpdate(BaseModel):
    items: List[BudgetItem]

class TimelineUpdate(BaseModel):
    milestones: List[TimelineMilestone]

class ChecklistUpdate(BaseModel):
    tasks: List[ChecklistTask]

class IdeasUpdate(BaseModel):
    ideas: List[CreativeIdea]
