from backend.app.models import Event
from backend.app.services.fallback_service import generate_fallback_plan

def test_fallback_wedding_generation():
    event = Event(
        title="Sample Wedding",
        event_type="wedding",
        location="Napa Valley",
        guest_count=100,
        budget=20000.0,
        currency="USD",
        style="Rustic Elegant",
        priorities=["Food", "Photos"],
        constraints=["Outdoor"]
    )
    b, t, c, i, a = generate_fallback_plan(event)

    assert len(b) >= 6
    assert len(t) >= 5
    assert len(c) >= 5
    assert len(i) >= 3
    assert len(a) >= 2

    # Check sum of budget items <= budget
    total_est = sum(item.estimated_cost for item in b)
    assert total_est <= event.budget
    assert total_est >= event.budget * 0.90 # closely matches budget

def test_fallback_birthday_generation():
    event = Event(
        title="Milestone 40th",
        event_type="birthday",
        location="Brooklyn, NY",
        guest_count=50,
        budget=5000.0,
        currency="USD",
        style="Retro Disco"
    )
    b, t, c, i, a = generate_fallback_plan(event)
    assert any("Venue" in item.category for item in b)
    assert any("cake" in item.title.lower() or "cake" in item.category.lower() for item in c)

def test_fallback_community_generation():
    event = Event(
        title="Neighborhood Block Party",
        event_type="community",
        location="City Park",
        guest_count=200,
        budget=4000.0,
        currency="USD",
        style="Festive"
    )
    b, t, c, i, a = generate_fallback_plan(event)
    assert any("Permit" in item.category for item in b)
