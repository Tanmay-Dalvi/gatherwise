from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.models import Event, EventCreate, EventUpdate
from backend.app.crud import (
    create_event, get_event, list_events, update_event, delete_event,
    save_full_plan
)
from backend.app.services.fallback_service import generate_fallback_plan

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("", response_model=List[Event])
def get_all_events():
    return list_events()

@router.post("", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_new_event(event_in: EventCreate):
    return create_event(event_in)

@router.get("/{event_id}", response_model=Event)
def get_single_event(event_id: str):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=Event)
def update_existing_event(event_id: str, updates: EventUpdate):
    event = update_event(event_id, updates)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.delete("/{event_id}")
def delete_single_event(event_id: str):
    success = delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted", "id": event_id}

@router.post("/seed-demo", status_code=status.HTTP_201_CREATED)
def seed_demo_events():
    """
    Creates rich sample events for testing and immediate demo evaluation:
    1. Rustic Vineyard Wedding
    2. 30th Neon Milestone Birthday
    3. Community Spring Maker & Harvest Fair
    """
    samples = [
        EventCreate(
            title="Elena & Mateo's Vineyard Wedding",
            event_type="wedding",
            event_date="2027-06-18",
            location="Sonoma Valley, CA (Outdoor Vineyard & Barn)",
            guest_count=110,
            budget=28500.0,
            currency="USD",
            style="Rustic Wine Country Romance",
            priorities=["Unforgettable Farm-to-Table Food", "Sunset Photography", "Live Acoustic Duo"],
            constraints=["Outdoor summer heat (needs shaded pavilion)", "Vegetarian & gluten-free options"],
            notes="Couple wants warm earthen tones, candlelit barrels, and an unhurried family-style dinner."
        ),
        EventCreate(
            title="Kai's 30th Milestone Neon Retro Bash",
            event_type="birthday",
            event_date="2027-04-10",
            location="Industrial Loft Lounge, Austin, TX",
            guest_count=65,
            budget=6200.0,
            currency="USD",
            style="90s Retro Neon & Synthwave",
            priorities=["Craft Signature Cocktails", "High-Energy DJ Set", "Focal Photo Wall"],
            constraints=["Sound curfew at 01:00 AM", "No open flame candles allowed by venue"],
            notes="Guests encouraged to wear bold vibrant 90s streetwear; late night taco delivery planned."
        ),
        EventCreate(
            title="Riverside Community Earth Day Fair",
            event_type="community",
            event_date="2027-04-22",
            location="Riverfront Public Commons, Seattle, WA",
            guest_count=350,
            budget=11500.0,
            currency="USD",
            style="Eco-Friendly & Family Vibrant",
            priorities=["Zero-Waste Hydration Stations", "Local Artisan Maker Booths", "Children's Seed Planting Workshop"],
            constraints=["Municipal park sound amplification limit 85dB", "Rain backup canopies required"],
            notes="Open to all neighborhood families. Supported by neighborhood volunteer committees."
        )
    ]

    created = []
    for sample in samples:
        event = create_event(sample)
        # Generate and save pre-computed high quality plans so demo mode is 100% instantly interactive
        b, t, c, i, a = generate_fallback_plan(event)
        save_full_plan(event.id, b, t, c, i, a, "demo_fallback")
        created.append(event)

    return {"status": "seeded", "count": len(created), "events": created}
