from fastapi import APIRouter
from backend.app.config import GEMINI_API_KEY
from backend.app.database import get_db

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def health_check():
    db_status = "error"
    try:
        with get_db() as conn:
            conn.execute("SELECT 1")
            db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {e}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "version": "1.0.0",
        "database": db_status,
        "ai_provider": "gemini" if bool(GEMINI_API_KEY) else "demo_fallback",
        "gemini_configured": bool(GEMINI_API_KEY)
    }
