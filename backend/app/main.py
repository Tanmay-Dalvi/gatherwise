from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from backend.app.config import CORS_ORIGINS, ENVIRONMENT
from backend.app.database import init_db
from backend.app.routers import health, events, plans

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield

app = FastAPI(
    title="GatherWise API",
    description="Intelligent celebration & event planning API with deterministic budget logic and GenAI generation.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Input validation error",
            "errors": jsonable_encoder(exc.errors()),
            "error_code": "VALIDATION_ERROR"
        }
    )

# Include Routers under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(plans.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "name": "GatherWise Celebration Planner API",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api")
def api_root():
    return {
        "status": "active",
        "version": "1.0.0",
        "endpoints": ["/api/v1/health", "/api/v1/events"]
    }
