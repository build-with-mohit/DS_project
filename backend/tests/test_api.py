"""
Integration tests for FastAPI endpoints in LIBRIX.
Tests scenarios:
- API CRUD operations
- Duplicate ISBN rejection via API
- Issue / Return flow via API
- Prevent deletion of issued book via API
- Persistence across reload
- Dashboard statistics calculation
- Linked list visualizer API
- CSV export API
"""

import sys
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app
from storage import StorageManager, SEED_BOOKS

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_catalog():
    """Ensures each test starts and finishes with a clean standard catalog state."""
    client.post("/api/system/reset")
    yield
    client.post("/api/system/reset")


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_api_get_books():
    res = client.get("/api/books")
    assert res.status_code == 200
    books = res.json()
    assert isinstance(books, list)
    assert len(books) >= 1


def test_api_add_and_get_book():
    # Valid ISBN-13
    payload = {
        "isbn": "9780321573513",  # Algorithms 4th Edition
        "title": "Algorithms 4th Edition",
        "author": "Robert Sedgewick, Kevin Wayne",
        "category": "Data Structures",
        "publication_year": 2011,
        "publisher": "Addison-Wesley",
        "description": "Essential textbook on algorithms and data structures in Java.",
    }
    # Add book
    res = client.post("/api/books", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["isbn"] == "9780321573513"
    assert data["availability_status"] == "Available"

    # Get by ISBN
    res_get = client.get("/api/books/9780321573513")
    assert res_get.status_code == 200
    assert res_get.json()["title"] == "Algorithms 4th Edition"

    # Duplicate insertion must fail
    res_dup = client.post("/api/books", json=payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]


def test_api_issue_and_return():
    isbn = "9780321573513"
    # Ensure book is present
    client.post("/api/books", json={
        "isbn": isbn,
        "title": "Algorithms 4th Edition",
        "author": "Robert Sedgewick",
        "category": "Data Structures",
        "publication_year": 2011,
        "publisher": "Addison-Wesley",
        "description": "Essential textbook on algorithms.",
    })
    # Issue to student
    res_issue = client.post(f"/api/books/{isbn}/issue", json={"student_name": "Kavita Rao"})
    assert res_issue.status_code == 200
    assert res_issue.json()["availability_status"] == "Issued"
    assert res_issue.json()["issued_to"] == "Kavita Rao"

    # Try to issue again (must fail)
    res_issue_again = client.post(f"/api/books/{isbn}/issue", json={"student_name": "Rahul Verma"})
    assert res_issue_again.status_code == 400

    # Try to delete while issued (must fail)
    res_del_fail = client.delete(f"/api/books/{isbn}")
    assert res_del_fail.status_code == 400
    assert "currently issued" in res_del_fail.json()["detail"]

    # Return book
    res_ret = client.post(f"/api/books/{isbn}/return")
    assert res_ret.status_code == 200
    assert res_ret.json()["availability_status"] == "Available"
    assert res_ret.json()["issued_to"] == ""

    # Now deletion must succeed
    res_del = client.delete(f"/api/books/{isbn}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True


def test_api_dashboard_stats():
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_books" in stats
    assert "available_books" in stats
    assert "issued_books" in stats
    assert "total_categories" in stats
    assert stats["total_books"] == stats["available_books"] + stats["issued_books"]


def test_api_linked_list_visualize():
    res = client.get("/api/linked-list/visualize")
    assert res.status_code == 200
    vis = res.json()
    assert "nodes" in vis
    assert "total_nodes" in vis
    assert vis["data_structure"] == "Singly Linked List"
    if vis["total_nodes"] > 0:
        assert vis["nodes"][0]["is_head"] is True
        assert vis["nodes"][-1]["is_tail"] is True


def test_api_search_isbn():
    res = client.get("/api/books/search?q=9780262033848&type=isbn")
    assert res.status_code == 200
    data = res.json()
    assert data["search_type"] == "isbn"
    assert data["total_found"] == 1
    assert data["results"][0]["isbn"] == "9780262033848"
    assert len(data["traversal_path"]) >= 1


def test_api_export_csv():
    res = client.get("/api/books/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "ISBN,Title,Author" in res.text


def test_persistence_reload():
    # Create isolated temp files
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_books = Path(tmpdir) / "test_books.json"
        tmp_acts = Path(tmpdir) / "test_acts.json"

        # Manager 1 saves a new book
        m1 = StorageManager(data_path=tmp_books, activities_path=tmp_acts)
        m1.linked_list.insert_book({
            "isbn": "9780131103627",
            "title": "The C Programming Language",
            "author": "Brian W. Kernighan, Dennis M. Ritchie",
            "category": "Programming",
            "publication_year": 1988,
        })
        m1.persist_linked_list()

        # Manager 2 reloads from disk
        m2 = StorageManager(data_path=tmp_books, activities_path=tmp_acts)
        found, _, _ = m2.linked_list.search_book("9780131103627")
        assert found is not None
        assert found.title == "The C Programming Language"
