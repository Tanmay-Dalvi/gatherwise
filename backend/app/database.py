import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from backend.app.config import DATABASE_PATH

def init_db():
    Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")

        # Events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_date TEXT,
                location TEXT NOT NULL,
                guest_count INTEGER NOT NULL,
                budget REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                style TEXT NOT NULL DEFAULT 'Modern Elegant',
                priorities TEXT NOT NULL DEFAULT '[]',
                constraints TEXT NOT NULL DEFAULT '[]',
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # Budget items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budget_items (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                estimated_cost REAL NOT NULL,
                actual_cost REAL NOT NULL DEFAULT 0.0,
                notes TEXT DEFAULT '',
                is_custom INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
        """)

        # Timeline milestones table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS timeline_milestones (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                phase TEXT NOT NULL,
                title TEXT NOT NULL,
                target_date TEXT DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'medium',
                status TEXT NOT NULL DEFAULT 'pending',
                notes TEXT DEFAULT '',
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
        """)

        # Checklist tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS checklist_tasks (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                due_date TEXT DEFAULT '',
                assigned_to TEXT DEFAULT '',
                contact_info TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'todo',
                notes TEXT DEFAULT '',
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
        """)

        # Creative ideas table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS creative_ideas (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                tags TEXT NOT NULL DEFAULT '[]',
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
        """)

        # Plan metadata table (assumptions, generation source)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS plan_metadata (
                event_id TEXT PRIMARY KEY,
                assumptions TEXT NOT NULL DEFAULT '[]',
                generation_source TEXT NOT NULL DEFAULT 'demo_fallback',
                updated_at TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
        """)

        # Performance indexes for foreign key lookups and cascading operations
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON budget_items(event_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_timeline_milestones_event_id ON timeline_milestones(event_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_checklist_tasks_event_id ON checklist_tasks(event_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_creative_ideas_event_id ON creative_ideas(event_id);")

        # Concurrency & write efficiency optimizations
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")

        conn.commit()

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DATABASE_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()
