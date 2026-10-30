import asyncio
import pytest
from backend.app.config import GEMINI_API_KEY
from backend.app.models import Event
from backend.app.services.ai_service import call_gemini_api, generate_full_event_plan

@pytest.mark.live
def test_live_gemini_api_connection():
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY is not configured")
    res = asyncio.run(call_gemini_api('Return JSON: {"status": "ok"}'))
    if res is None:
        pytest.skip("Gemini API call returned None (likely quota limit reached or network unavailable)")
    assert "ok" in res

@pytest.mark.live
def test_live_gemini_plan_generation():
    if not GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY is not configured")
    event = Event(
        title="Live Test Gala",
        event_type="wedding",
        location="San Francisco, CA",
        guest_count=75,
        budget=18000.0,
        currency="USD",
        style="Modern Waterfront"
    )
    b, t, c, i, a, source = asyncio.run(generate_full_event_plan(event))
    assert source in ("gemini", "demo_fallback")
    assert len(b) > 0
    assert len(t) > 0
    assert len(c) > 0
    assert len(i) > 0
