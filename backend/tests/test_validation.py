import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, get_db

@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    test_db = str(tmp_path / "test_val_gatherwise.db")
    monkeypatch.setattr("backend.app.config.DATABASE_PATH", test_db)
    monkeypatch.setattr("backend.app.database.DATABASE_PATH", test_db)
    monkeypatch.setattr("backend.app.services.ai_service.GEMINI_API_KEY", None)
    init_db()

@pytest.fixture
def client():
    return TestClient(app)

def test_whitespace_only_title_rejected(client):
    res = client.post("/api/v1/events", json={
        "title": "    ",
        "event_type": "wedding",
        "location": "Napa Valley",
        "guest_count": 50,
        "budget": 5000.0
    })
    assert res.status_code == 422
    assert "VALIDATION_ERROR" in res.text

def test_whitespace_only_location_rejected(client):
    res = client.post("/api/v1/events", json={
        "title": "Valid Wedding",
        "event_type": "wedding",
        "location": "     ",
        "guest_count": 50,
        "budget": 5000.0
    })
    assert res.status_code == 422

def test_invalid_guest_counts_rejected(client):
    # Guest count = 0
    res = client.post("/api/v1/events", json={
        "title": "Valid Wedding",
        "event_type": "wedding",
        "location": "Park",
        "guest_count": 0,
        "budget": 5000.0
    })
    assert res.status_code == 422

    # Negative guest count
    res2 = client.post("/api/v1/events", json={
        "title": "Valid Wedding",
        "event_type": "wedding",
        "location": "Park",
        "guest_count": -10,
        "budget": 5000.0
    })
    assert res2.status_code == 422

    # Excessively large guest count
    res3 = client.post("/api/v1/events", json={
        "title": "Valid Wedding",
        "event_type": "wedding",
        "location": "Park",
        "guest_count": 200000,
        "budget": 5000.0
    })
    assert res3.status_code == 422

def test_malformed_event_date_rejected(client):
    res = client.post("/api/v1/events", json={
        "title": "Valid Title",
        "event_type": "wedding",
        "event_date": "not-a-valid-date",
        "location": "San Francisco",
        "guest_count": 50,
        "budget": 5000.0
    })
    assert res.status_code == 422

def test_valid_iso_date_accepted(client):
    res = client.post("/api/v1/events", json={
        "title": "Valid Title",
        "event_type": "wedding",
        "event_date": "2027-09-15",
        "location": "San Francisco",
        "guest_count": 50,
        "budget": 5000.0
    })
    assert res.status_code == 201

def test_unknown_event_id_endpoints(client):
    fake_id = "nonexistent-uuid-99999"
    assert client.get(f"/api/v1/events/{fake_id}").status_code == 404
    assert client.get(f"/api/v1/events/{fake_id}/plan").status_code == 404
    assert client.put(f"/api/v1/events/{fake_id}", json={"title": "New"}).status_code == 404
    assert client.delete(f"/api/v1/events/{fake_id}").status_code == 404
    assert client.post(f"/api/v1/events/{fake_id}/generate").status_code == 404
    assert client.post(f"/api/v1/events/{fake_id}/regenerate-section", json={"section": "budget"}).status_code == 404
    assert client.get(f"/api/v1/events/{fake_id}/export/markdown").status_code == 404
    assert client.get(f"/api/v1/events/{fake_id}/export/json").status_code == 404

def test_invalid_regenerate_section_name(client):
    # First create an event and generate plan
    ev = client.post("/api/v1/events", json={
        "title": "Test Regen",
        "event_type": "birthday",
        "location": "Miami",
        "guest_count": 30,
        "budget": 2000.0
    }).json()
    client.post(f"/api/v1/events/{ev['id']}/generate")

    # Send invalid section
    res = client.post(f"/api/v1/events/{ev['id']}/regenerate-section", json={"section": "hack_section"})
    assert res.status_code == 422

def test_cascading_deletion_across_all_tables(client):
    # 1. Create event
    ev = client.post("/api/v1/events", json={
        "title": "Cascade Verification Celebration",
        "event_type": "community",
        "location": "Community Center",
        "guest_count": 100,
        "budget": 8000.0
    }).json()
    eid = ev["id"]

    # 2. Generate plan
    client.post(f"/api/v1/events/{eid}/generate")

    # 3. Check child tables populated
    with get_db() as conn:
        b_count = conn.execute("SELECT count(*) FROM budget_items WHERE event_id = ?", (eid,)).fetchone()[0]
        t_count = conn.execute("SELECT count(*) FROM timeline_milestones WHERE event_id = ?", (eid,)).fetchone()[0]
        c_count = conn.execute("SELECT count(*) FROM checklist_tasks WHERE event_id = ?", (eid,)).fetchone()[0]
        i_count = conn.execute("SELECT count(*) FROM creative_ideas WHERE event_id = ?", (eid,)).fetchone()[0]
        m_count = conn.execute("SELECT count(*) FROM plan_metadata WHERE event_id = ?", (eid,)).fetchone()[0]
        assert b_count > 0 and t_count > 0 and c_count > 0 and i_count > 0 and m_count > 0

    # 4. Delete event
    del_res = client.delete(f"/api/v1/events/{eid}")
    assert del_res.status_code == 200

    # 5. Verify 0 records left in all child tables
    with get_db() as conn:
        assert conn.execute("SELECT count(*) FROM budget_items WHERE event_id = ?", (eid,)).fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM timeline_milestones WHERE event_id = ?", (eid,)).fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM checklist_tasks WHERE event_id = ?", (eid,)).fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM creative_ideas WHERE event_id = ?", (eid,)).fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM plan_metadata WHERE event_id = ?", (eid,)).fetchone()[0] == 0

def test_export_filename_header_sanitization(client):
    # Test path traversal injection in event_id parameter
    ev = client.post("/api/v1/events", json={
        "title": "Export Test Event",
        "event_type": "birthday",
        "location": "Denver",
        "guest_count": 25,
        "budget": 3000.0
    }).json()
    client.post(f"/api/v1/events/{ev['id']}/generate")

    res = client.get(f"/api/v1/events/{ev['id']}/export/markdown")
    assert res.status_code == 200
    disp = res.headers.get("Content-Disposition", "")
    assert "attachment; filename=\"gatherwise_plan_" in disp
    assert not any(bad in disp for bad in ("..", "/", "\\", "\r", "\n"))
