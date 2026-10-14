"""
LIBRIX — Smart Library Catalog Management System
Module: storage.py
Thread-safe persistent storage using atomic JSON file updates.
Reconstructs the Singly Linked List on startup.
"""

import json
import os
import tempfile
import threading
from pathlib import Path
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone

from linked_list import LibraryLinkedList, BookNode

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
BOOKS_FILE = DATA_DIR / "books.json"
ACTIVITIES_FILE = DATA_DIR / "activities.json"

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
        "added_at": "2026-09-01T10:00:00Z"
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
        "added_at": "2026-09-05T11:30:00Z"
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
        "added_at": "2026-09-10T09:15:00Z"
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
        "added_at": "2026-09-12T14:20:00Z"
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
        "added_at": "2026-09-15T16:45:00Z"
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
        "added_at": "2026-09-18T10:00:00Z"
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
        "added_at": "2026-09-20T12:00:00Z"
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
        "added_at": "2026-09-22T08:30:00Z"
    }
]


class StorageManager:
    """
    Manages persistence between the in-memory Singly Linked List and the JSON storage.
    Enforces atomic write replacements to ensure zero data corruption.
    """

    def __init__(self, data_path: Path = BOOKS_FILE, activities_path: Path = ACTIVITIES_FILE):
        self.data_path = data_path
        self.activities_path = activities_path
        self.linked_list = LibraryLinkedList()
        self.activities: List[Dict[str, Any]] = []
        self._ensure_storage_ready()
        self.load_from_storage()

    def _ensure_storage_ready(self) -> None:
        """Creates data directory if missing."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def load_from_storage(self) -> None:
        """
        Reconstructs the Singly Linked List from books.json.
        If file does not exist, seeds it with initial books without overwriting existing data.
        """
        with _storage_lock:
            self.linked_list.clear()

            if not self.data_path.exists():
                # Seed with initial records
                records = SEED_BOOKS
                self._save_raw_records(records)
                self._log_activity_internal("system", "Initialized library database with standard catalog.")
            else:
                try:
                    with open(self.data_path, "r", encoding="utf-8") as f:
                        records = json.load(f)
                        if not isinstance(records, list):
                            records = []
                except Exception as e:
                    print(f"[StorageManager] Error reading JSON: {e}. Reverting to seed data.")
                    records = SEED_BOOKS
                    self._save_raw_records(records)

            # Reconstruct linked list in order
            for item in records:
                try:
                    self.linked_list.insert_book(item)
                except Exception as e:
                    print(f"[StorageManager] Skipping corrupted record: {e}")

            # Load activities
            if self.activities_path.exists():
                try:
                    with open(self.activities_path, "r", encoding="utf-8") as f:
                        self.activities = json.load(f)
                except Exception:
                    self.activities = []

    def _save_raw_records(self, records: List[Dict[str, Any]]) -> None:
        """
        Performs atomic write using a temporary file in the same directory,
        then replaces the target file via os.replace.
        """
        temp_dir = self.data_path.parent
        fd, temp_file_path = tempfile.mkstemp(dir=temp_dir, prefix="librix_temp_", suffix=".json")
        try:
            with open(fd, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
            os.replace(temp_file_path, self.data_path)
        except Exception:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise

    def persist_linked_list(self) -> None:
        """
        Traverses the current Singly Linked List, serializes each node,
        and safely writes to the JSON storage file.
        Must be called whenever the linked list state changes.
        """
        books_data = self.linked_list.display_books()
        self._save_raw_records(books_data)

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
            fd, temp_file = tempfile.mkstemp(dir=temp_dir, prefix="act_temp_", suffix=".json")
            with open(fd, "w", encoding="utf-8") as f:
                json.dump(self.activities, f, indent=2)
            os.replace(temp_file, self.activities_path)
        except Exception:
            pass

    def get_activities(self) -> List[Dict[str, Any]]:
        with _storage_lock:
            return list(self.activities)


# Shared singleton instance
storage_manager = StorageManager()
