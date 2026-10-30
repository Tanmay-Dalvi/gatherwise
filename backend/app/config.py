import os
from pathlib import Path
from typing import List

# Read .env if present in root or current dir
def load_dotenv_file(filepath: Path):
    if filepath.exists() and filepath.is_file():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key not in os.environ:
                        os.environ[key] = val
        except Exception:
            pass

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv_file(ROOT_DIR / ".env")
load_dotenv_file(Path(".env"))

raw_key = os.environ.get("GEMINI_API_KEY", "").strip()
if raw_key.startswith("PAIza"):
    raw_key = raw_key[1:]
# If key is placeholder or empty, treat as not configured
if not raw_key or "PASTE_YOUR" in raw_key or "YOUR_GEMINI" in raw_key:
    GEMINI_API_KEY = None
else:
    GEMINI_API_KEY = raw_key

HOST = os.environ.get("HOST", "0.0.0.0" if os.environ.get("RENDER") else "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")

# Restricted CORS origins with normalized trailing-slash stripping
raw_cors = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000")
CORS_ORIGINS: List[str] = [origin.strip().rstrip("/") for origin in raw_cors.split(",") if origin.strip()]

DATABASE_PATH = os.environ.get("DATABASE_PATH", str(ROOT_DIR / "gatherwise.db"))
