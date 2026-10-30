import pytest
import os
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db

@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    test_db = str(tmp_path / "test_gatherwise.db")
    monkeypatch.setattr("backend.app.config.DATABASE_PATH", test_db)
    monkeypatch.setattr("backend.app.database.DATABASE_PATH", test_db)
    # Unit tests run in deterministic fallback mode to avoid consuming API quota
    monkeypatch.setattr("backend.app.services.ai_service.GEMINI_API_KEY", None)
    init_db()

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "ai_provider" in data
    assert "gemini_configured" in data

def test_event_crud_lifecycle(client):
    # 1. Create event
    create_payload = {
        "title": "Summer Garden Wedding",
        "event_type": "wedding",
        "event_date": "2027-07-20",
        "location": "Botanical Conservatory",
        "guest_count": 80,
        "budget": 15000.0,
        "currency": "USD",
        "style": "Romantic Garden",
        "priorities": ["Photography", "Live Music"],
        "constraints": ["Indoor weather contingency"]
    }
    res = client.post("/api/v1/events", json=create_payload)
    assert res.status_code == 201
    event = res.json()
    event_id = event["id"]
    assert event["title"] == "Summer Garden Wedding"
    assert event["budget"] == 15000.0

    # 2. Get single event
    res = client.get(f"/api/v1/events/{event_id}")
    assert res.status_code == 200
    assert res.json()["id"] == event_id

    # 3. List events
    res = client.get("/api/v1/events")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 4. Generate plan
    res = client.post(f"/api/v1/events/{event_id}/generate", json={"custom_prompt": "Include acoustic guitarist"})
    assert res.status_code == 200
    plan = res.json()
    assert len(plan["budget_items"]) > 0
    assert len(plan["timeline"]) > 0
    assert len(plan["checklist"]) > 0
    assert len(plan["ideas"]) > 0
    assert plan["budget_summary"]["target_budget"] == 15000.0

    # 5. Targeted regeneration preserving manual items
    # First, add actual cost to one item
    plan["budget_items"][0]["actual_cost"] = 800.0
    client.put(f"/api/v1/events/{event_id}/budget-items", json={"items": plan["budget_items"]})

    # Regenerate budget section
    res = client.post(f"/api/v1/events/{event_id}/regenerate-section", json={
        "section": "budget",
        "user_prompt": "Shift more budget to live music",
        "preserve_manual_items": True
    })
    assert res.status_code == 200
    updated_plan = res.json()
    # The item with actual_cost 800.0 should be preserved
    assert any(item["actual_cost"] == 800.0 for item in updated_plan["budget_items"])

    # 6. Export markdown
    res = client.get(f"/api/v1/events/{event_id}/export/markdown")
    assert res.status_code == 200
    assert "Summer Garden Wedding" in res.text
    assert "Itemized Budget Breakdown" in res.text

    # 7. Delete event
    res = client.delete(f"/api/v1/events/{event_id}")
    assert res.status_code == 200

    # 8. Verify deleted
    res = client.get(f"/api/v1/events/{event_id}")
    assert res.status_code == 404

def test_validation_rejects_negative_budget(client):
    invalid_payload = {
        "title": "Invalid Birthday",
        "event_type": "birthday",
        "location": "Park",
        "guest_count": 20,
        "budget": -500.0
    }
    res = client.post("/api/v1/events", json=invalid_payload)
    assert res.status_code == 422

def test_seed_demo_events(client):
    res = client.post("/api/v1/events/seed-demo")
    assert res.status_code == 201
    assert res.json()["count"] == 3
