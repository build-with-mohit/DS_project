"""
LIBRIX — Smart Library Catalog Management System
Module: storage.py
Thread-safe persistent storage using atomic JSON file updates and optional database synchronization.
Reconstructs the Singly Linked List on startup.
Supports serverless deployment environments (e.g. Vercel) where the deployment directory is read-only.
"""

import json
import os
import sys
import tempfile
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# Ensure backend root is in module search path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from linked_list import LibraryLinkedList, BookNode

BASE_DIR = Path(__file__).resolve().parent
BUNDLED_DATA_DIR = BASE_DIR / "data"
BUNDLED_BOOKS_FILE = BUNDLED_DATA_DIR / "books.json"
BUNDLED_ACTIVITIES_FILE = BUNDLED_DATA_DIR / "activities.json"

# Global re-entrant lock for thread-safe operations on data structures & persistence
_storage_lock = threading.RLock()

# Initial high-quality seed books for IT / Computer Science students
SEED_BOOKS = [
    {
        "isbn": "9780262033848",
        "title": "Introduction to Algorithms (CLRS)",
        "author": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
        "category": "Data Structures",
        "publication_year": 2009,
        "publisher": "MIT Press",
        "description": "Comprehensive reference covering dynamic programming, graph algorithms, and linked list structures.",
        "availability_status": "Available",
        "issued_to": "",
        "added_at": "2026-09-01T10:00:00Z",
    },
    {
        "isbn": "9780132350884",
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "category": "Programming",
        "publication_year": 2008,
        "publisher": "Prentice Hall",
        "description": "Essential principles, patterns, and practices of writing clean, maintainable software.",
        "availability_status": "Issued",
        "issued_to": "Aarav Sharma",
        "added_at": "2026-09-05T11:30:00Z",
    },
    {
        "isbn": "9780135957059",
        "title": "The Pragmatic Programmer: 20th Anniversary Edition",
        "author": "David Thomas, Andrew Hunt",
        "category": "Programming",
        "publication_year": 2019,
        "publisher": "Addison-Wesley",
        "description": "Classic software development guide on career mastery, refactoring, and clean architecture.",
        "availability_status": "Available",
        "issued_to": "",
        "added_at": "2026-09-10T09:15:00Z",
    },
    {
        "isbn": "9780201633610",
        "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
        "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        "category": "Computer Science",
        "publication_year": 1994,
        "publisher": "Addison-Wesley Professional",
        "description": "Foundational Gang of Four catalogue of 23 object-oriented software design patterns.",
        "availability_status": "Available",
        "issued_to": "",
        "added_at": "2026-09-12T14:20:00Z",
    },
    {
        "isbn": "9780134610993",
        "title": "Artificial Intelligence: A Modern Approach",
        "author": "Stuart Russell, Peter Norvig",
        "category": "Artificial Intelligence",
        "publication_year": 2020,
        "publisher": "Pearson",
        "description": "The leading textbook in AI covering search algorithms, machine learning, and probabilistic reasoning.",
        "availability_status": "Issued",
        "issued_to": "Ananya Desai",
        "added_at": "2026-09-15T16:45:00Z",
    },
    {
        "isbn": "9780132126953",
        "title": "Computer Networks: Principles and Protocols",
        "author": "Andrew S. Tanenbaum, David J. Wetherall",
        "category": "Networking",
        "publication_year": 2011,
        "publisher": "Pearson Education",
        "description": "Definitive guide to OSI and TCP/IP protocol stacks, wireless networking, and routing.",
        "availability_status": "Available",
        "issued_to": "",
        "added_at": "2026-09-18T10:00:00Z",
    },
    {
        "isbn": "9780078022159",
        "title": "Database System Concepts",
        "author": "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
        "category": "Database Management",
        "publication_year": 2019,
        "publisher": "McGraw-Hill",
        "description": "Covers relational algebra, SQL optimization, transaction isolation, and NoSQL systems.",
        "availability_status": "Available",
        "issued_to": "",
        "added_at": "2026-09-20T12:00:00Z",
    },
    {
        "isbn": "9781259676512",
        "title": "Discrete Mathematics and Its Applications",
        "author": "Kenneth H. Rosen",
        "category": "Mathematics",
        "publication_year": 2019,
        "publisher": "McGraw-Hill Education",
        "description": "Mathematical structures for computer science, graph theory, combinatorics, and logic.",
        "availability_status": "Available",
        "issued_to": "",
        "added_at": "2026-09-22T08:30:00Z",
    },
]


def resolve_writable_data_dir() -> Path:
    """
    Determines an appropriate writable directory for persistent files.
    - If explicit DATA_DIR env var is set, uses it.
    - On Vercel or AWS Lambda (read-only filesystem), automatically routes to /tmp/librix_data.
    - On standard development machines, tests if backend/data is writable; if not, falls back to /tmp/librix_data.
    """
    custom_dir = os.environ.get("DATA_DIR")
    if custom_dir:
        target = Path(custom_dir)
        target.mkdir(parents=True, exist_ok=True)
        return target

    # Vercel and AWS Lambda execution environments have a strictly read-only codebase directory
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_dir = Path(tempfile.gettempdir()) / "librix_data"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        return tmp_dir

    # In local development, check if the bundled data dir is writable
    try:
        BUNDLED_DATA_DIR.mkdir(parents=True, exist_ok=True)
        test_file = BUNDLED_DATA_DIR / f".write_test_{os.getpid()}"
        test_file.write_text("ok", encoding="utf-8")
        test_file.unlink()
        return BUNDLED_DATA_DIR
    except (OSError, PermissionError):
        tmp_dir = Path(tempfile.gettempdir()) / "librix_data"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        return tmp_dir


class StorageManager:
    """
    Manages persistence between the in-memory Singly Linked List and persistent storage.
    Enforces atomic write replacements to ensure zero data corruption.
    Supports optional external database persistence (PostgreSQL / Supabase / Neon / SQLite)
    via the DATABASE_URL environment variable.
    """

    def __init__(
        self,
        data_path: Optional[Path] = None,
        activities_path: Optional[Path] = None,
        database_url: Optional[str] = None,
    ):
        self.active_dir = resolve_writable_data_dir()
        self.data_path = Path(data_path) if data_path else (self.active_dir / "books.json")
        self.activities_path = Path(activities_path) if activities_path else (self.active_dir / "activities.json")

        self.database_url = database_url or os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
        self.storage_mode = "database" if self.database_url else "json_file"

        self.linked_list = LibraryLinkedList()
        self.activities: List[Dict[str, Any]] = []
        self._last_mtime: float = 0.0

        self._ensure_storage_ready()
        self.load_from_storage()

    def _ensure_storage_ready(self) -> None:
        """Creates target directory if missing."""
        try:
            self.data_path.parent.mkdir(parents=True, exist_ok=True)
        except (OSError, PermissionError):
            pass

    def load_from_storage(self) -> None:
        """
        Reconstructs the Singly Linked List from the storage backend (Database or JSON).
        If database is configured, loads from SQL table.
        Otherwise loads from books.json, seeding from bundled data or SEED_BOOKS if needed.
        """
        with _storage_lock:
            self.linked_list.clear()

            # Attempt database load if configured
            if self.database_url:
                db_success = self._load_from_database()
                if db_success:
                    return
                print("[StorageManager] Database load failed or unavailable. Falling back to JSON storage.")
                self.storage_mode = "json_file"

            # File-based load
            records = self._load_file_records()

            # Reconstruct linked list in order
            for item in records:
                try:
                    self.linked_list.insert_book(item)
                except Exception as e:
                    print(f"[StorageManager] Skipping invalid record: {e}")

            # Update mtime tracking
            if self.data_path.exists():
                try:
                    self._last_mtime = self.data_path.stat().st_mtime
                except OSError:
                    pass

            # Load activities
            self._load_activities_from_file()

    def _load_file_records(self) -> List[Dict[str, Any]]:
        """Loads records from the JSON file, initializing with seed data if file is absent."""
        if not self.data_path.exists():
            records = self._get_initial_seed_records()
            try:
                self._save_raw_records(records)
                self._log_activity_internal("system", "Initialized library database with standard catalog.")
            except Exception as e:
                print(f"[StorageManager] Warning: Could not write initial seed to {self.data_path}: {e}")
            return records

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                records = json.load(f)
                if isinstance(records, list):
                    return records
                return []
        except Exception as e:
            print(f"[StorageManager] Error reading JSON: {e}. Reverting to seed data.")
            records = self._get_initial_seed_records()
            try:
                self._save_raw_records(records)
            except Exception:
                pass
            return records

    def _get_initial_seed_records(self) -> List[Dict[str, Any]]:
        """Reads initial records from the bundled data file if present, else SEED_BOOKS."""
        if BUNDLED_BOOKS_FILE.exists() and self.data_path != BUNDLED_BOOKS_FILE:
            try:
                with open(BUNDLED_BOOKS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        return data
            except Exception:
                pass
        return list(SEED_BOOKS)

    def _load_activities_from_file(self) -> None:
        """Loads activities from JSON file or bundled seed file."""
        if self.activities_path.exists():
            try:
                with open(self.activities_path, "r", encoding="utf-8") as f:
                    self.activities = json.load(f)
                    if not isinstance(self.activities, list):
                        self.activities = []
                    return
            except Exception:
                self.activities = []
        elif BUNDLED_ACTIVITIES_FILE.exists() and self.activities_path != BUNDLED_ACTIVITIES_FILE:
            try:
                with open(BUNDLED_ACTIVITIES_FILE, "r", encoding="utf-8") as f:
                    self.activities = json.load(f)
                    if isinstance(self.activities, list):
                        return
            except Exception:
                pass
        self.activities = []

    def _save_raw_records(self, records: List[Dict[str, Any]]) -> None:
        """
        Performs atomic write using a temporary file in the target directory,
        then replaces the target file via os.replace.
        Guarantees zero file corruption.
        """
        temp_dir = self.data_path.parent
        temp_dir.mkdir(parents=True, exist_ok=True)
        fd, temp_file_path = tempfile.mkstemp(dir=temp_dir, prefix="librix_temp_", suffix=".json")
        try:
            with open(fd, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
            os.replace(temp_file_path, self.data_path)
            try:
                self._last_mtime = self.data_path.stat().st_mtime
            except OSError:
                pass
        except Exception:
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except OSError:
                    pass
            raise

    def persist_linked_list(self) -> None:
        """
        Traverses the current Singly Linked List, serializes each node,
        and safely writes to the JSON storage file and database if configured.
        Must be called whenever the linked list state changes.
        """
        with _storage_lock:
            books_data = self.linked_list.display_books()
            # Persist to JSON file
            self._save_raw_records(books_data)

            # Persist to database if configured
            if self.database_url:
                try:
                    self._persist_to_database(books_data)
                except Exception as e:
                    print(f"[StorageManager] Database sync error: {e}")

    def sync_if_needed(self) -> None:
        """
        Checks if the storage file has been updated by another process/serverless instance.
        If file modification time changed, reloads the Singly Linked List in memory.
        """
        if self.database_url:
            return

        with _storage_lock:
            if not self.data_path.exists():
                return
            try:
                current_mtime = self.data_path.stat().st_mtime
                if current_mtime > self._last_mtime:
                    self.load_from_storage()
            except OSError:
                pass

    def log_activity(self, action: str, details: str, isbn: str = "") -> None:
        """Records an event in the activity stream."""
        with _storage_lock:
            self._log_activity_internal(action, details, isbn)

    def _log_activity_internal(self, action: str, details: str, isbn: str = "") -> None:
        entry = {
            "id": len(self.activities) + 1,
            "action": action,
            "details": details,
            "isbn": isbn,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.activities.insert(0, entry)
        # Keep latest 50 activities
        self.activities = self.activities[:50]
        try:
            temp_dir = self.activities_path.parent
            temp_dir.mkdir(parents=True, exist_ok=True)
            fd, temp_file = tempfile.mkstemp(dir=temp_dir, prefix="act_temp_", suffix=".json")
            with open(fd, "w", encoding="utf-8") as f:
                json.dump(self.activities, f, indent=2)
            os.replace(temp_file, self.activities_path)
        except Exception:
            pass

    def get_activities(self) -> List[Dict[str, Any]]:
        with _storage_lock:
            return list(self.activities)

    # -------------------------------------------------------------------------
    # Optional Database Support (PostgreSQL / Supabase / Neon / SQLite)
    # -------------------------------------------------------------------------
    def _get_db_connection(self):
        """Returns a database connection based on self.database_url."""
        if not self.database_url:
            return None

        url = self.database_url.strip()
        if url.startswith("sqlite"):
            import sqlite3
            path = url.replace("sqlite:///", "").replace("sqlite://", "")
            return sqlite3.connect(path or ":memory:")

        if url.startswith("postgres://") or url.startswith("postgresql://"):
            try:
                import psycopg2
                # Handle postgres:// vs postgresql:// prefix
                fixed_url = url
                if fixed_url.startswith("postgres://"):
                    fixed_url = "postgresql://" + fixed_url[len("postgres://"):]
                return psycopg2.connect(fixed_url)
            except Exception as e:
                print(f"[StorageManager] PostgreSQL connection error: {e}")
                return None

        return None

    def _load_from_database(self) -> bool:
        """Loads catalog records from database table."""
        conn = None
        try:
            conn = self._get_db_connection()
            if not conn:
                return False

            cursor = conn.cursor()
            # Ensure tables exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS librix_books (
                    isbn VARCHAR(30) PRIMARY KEY,
                    title TEXT NOT NULL,
                    author TEXT NOT NULL,
                    category TEXT NOT NULL,
                    publication_year INTEGER NOT NULL,
                    publisher TEXT DEFAULT '',
                    description TEXT DEFAULT '',
                    availability_status VARCHAR(30) DEFAULT 'Available',
                    issued_to TEXT DEFAULT '',
                    added_at TEXT NOT NULL
                );
            """)
            conn.commit()

            cursor.execute("""
                SELECT isbn, title, author, category, publication_year,
                       publisher, description, availability_status, issued_to, added_at
                FROM librix_books
            """)
            rows = cursor.fetchall()

            if not rows:
                # Seed database with initial catalog
                seed_records = self._get_initial_seed_records()
                for b in seed_records:
                    cursor.execute("""
                        INSERT INTO librix_books (
                            isbn, title, author, category, publication_year,
                            publisher, description, availability_status, issued_to, added_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """ if not self.database_url.startswith("sqlite") else """
                        INSERT INTO librix_books (
                            isbn, title, author, category, publication_year,
                            publisher, description, availability_status, issued_to, added_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        b.get("isbn", ""),
                        b.get("title", ""),
                        b.get("author", ""),
                        b.get("category", "Other"),
                        int(b.get("publication_year", 2024)),
                        b.get("publisher", ""),
                        b.get("description", ""),
                        b.get("availability_status", "Available"),
                        b.get("issued_to", ""),
                        b.get("added_at", datetime.now(timezone.utc).isoformat()),
                    ))
                conn.commit()
                for b in seed_records:
                    self.linked_list.insert_book(b)
            else:
                for row in rows:
                    book_dict = {
                        "isbn": row[0],
                        "title": row[1],
                        "author": row[2],
                        "category": row[3],
                        "publication_year": row[4],
                        "publisher": row[5] or "",
                        "description": row[6] or "",
                        "availability_status": row[7] or "Available",
                        "issued_to": row[8] or "",
                        "added_at": row[9] or datetime.now(timezone.utc).isoformat(),
                    }
                    self.linked_list.insert_book(book_dict)

            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"[StorageManager] Error initializing database: {e}")
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass
            return False

    def _persist_to_database(self, books_data: List[Dict[str, Any]]) -> None:
        """Mirrors the current linked-list state into the database table."""
        conn = self._get_db_connection()
        if not conn:
            return

        try:
            cursor = conn.cursor()
            is_pg = not self.database_url.startswith("sqlite")
            ph = "%s" if is_pg else "?"

            # Clear and repopulate or upsert
            cursor.execute("DELETE FROM librix_books")
            for b in books_data:
                cursor.execute(f"""
                    INSERT INTO librix_books (
                        isbn, title, author, category, publication_year,
                        publisher, description, availability_status, issued_to, added_at
                    ) VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
                """, (
                    b.get("isbn", ""),
                    b.get("title", ""),
                    b.get("author", ""),
                    b.get("category", "Other"),
                    int(b.get("publication_year", 2024)),
                    b.get("publisher", ""),
                    b.get("description", ""),
                    b.get("availability_status", "Available"),
                    b.get("issued_to", ""),
                    b.get("added_at", datetime.now(timezone.utc).isoformat()),
                ))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"[StorageManager] Error persisting to database: {e}")
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass


# Shared singleton instance
storage_manager = StorageManager()
