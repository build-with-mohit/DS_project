"""
Unit tests for Library Singly Linked List Data Structure.
Tests all edge cases:
- Insertion (empty list, sequential insertion, duplicate prevention)
- Deletion (head, middle, tail, empty list, not found, issued book prevention)
- Search by ISBN (head, middle, tail, not found)
- Issue and Return mechanics
- Visualization data structure validation
"""

import pytest
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from linked_list import LibraryLinkedList, BookNode, validate_isbn


@pytest.fixture
def empty_list():
    return LibraryLinkedList()


@pytest.fixture
def populated_list():
    ll = LibraryLinkedList()
    ll.insert_book({
        "isbn": "9780262033848",
        "title": "Introduction to Algorithms",
        "author": "Cormen et al.",
        "category": "Data Structures",
        "publication_year": 2009,
    })
    ll.insert_book({
        "isbn": "9780132350884",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "category": "Programming",
        "publication_year": 2008,
    })
    ll.insert_book({
        "isbn": "9780135957059",
        "title": "The Pragmatic Programmer",
        "author": "David Thomas",
        "category": "Programming",
        "publication_year": 2019,
    })
    return ll


def test_isbn_validation():
    # Valid ISBN-10 with numeric check digit
    valid, cleaned, _ = validate_isbn("0-201-63361-2")
    assert valid is True
    assert cleaned == "0201633612"

    # Valid ISBN-10 with 'X' check digit (uppercase & lowercase support)
    valid_x, cleaned_x, _ = validate_isbn("0-8044-2957-X")
    assert valid_x is True
    assert cleaned_x == "080442957X"

    valid_x_lower, cleaned_x_lower, _ = validate_isbn("080442957x")
    assert valid_x_lower is True
    assert cleaned_x_lower == "080442957X"

    # Invalid ISBN-10 checksum
    invalid_10, _, msg_10 = validate_isbn("0201633615")
    assert invalid_10 is False
    assert "Invalid ISBN-10 checksum" in msg_10

    # Valid ISBN-13 with '978' prefix
    valid_13_978, cleaned_13_978, _ = validate_isbn("978-0-262-03384-8")
    assert valid_13_978 is True
    assert cleaned_13_978 == "9780262033848"

    # Valid ISBN-13 with '979' prefix
    valid_13_979, cleaned_13_979, _ = validate_isbn("979-10-90636-07-1")
    assert valid_13_979 is True
    assert cleaned_13_979 == "9791090636071"

    # Invalid ISBN-13 without 978 or 979 prefix
    invalid_prefix, _, msg_prefix = validate_isbn("9801234567894")
    assert invalid_prefix is False
    assert "must begin with '978' or '979'" in msg_prefix

    # Invalid ISBN-13 checksum
    valid_bad_sum, _, msg_bad_sum = validate_isbn("978-0-262-03384-9")
    assert valid_bad_sum is False
    assert "Invalid ISBN-13 checksum" in msg_bad_sum

    # Invalid length
    valid_len, _, msg_len = validate_isbn("12345")
    assert valid_len is False
    assert "exactly 10 or 13" in msg_len


def test_insert_book(empty_list):
    # Scenario 1: Insert a valid book
    node = empty_list.insert_book({
        "isbn": "9780262033848",
        "title": "Algorithms",
        "author": "Cormen",
        "category": "CS",
        "publication_year": 2009,
    })
    assert empty_list.head is not None
    assert empty_list.head.isbn == "9780262033848"
    assert empty_list.count_books() == 1

    # Insert second book
    node2 = empty_list.insert_book({
        "isbn": "9780132350884",
        "title": "Clean Code",
        "author": "Martin",
        "category": "CS",
        "publication_year": 2008,
    })
    assert empty_list.head.next is not None
    assert empty_list.head.next.isbn == "9780132350884"
    assert empty_list.count_books() == 2


def test_prevent_duplicate_isbn(populated_list):
    # Scenario 2: Insert a duplicate ISBN
    with pytest.raises(ValueError, match="already exists"):
        populated_list.insert_book({
            "isbn": "9780262033848",
            "title": "Duplicate Book",
            "author": "Nobody",
            "category": "CS",
            "publication_year": 2024,
        })


def test_search_existing_isbn(populated_list):
    # Scenario 3: Search for an existing ISBN
    node, steps, path = populated_list.search_book("9780132350884")
    assert node is not None
    assert node.title == "Clean Code"
    assert steps == 2
    assert len(path) == 2
    assert path[1]["matched"] is True


def test_search_nonexistent_isbn(populated_list):
    # Scenario 4: Search for a nonexistent ISBN
    node, steps, path = populated_list.search_book("9999999999999")
    assert node is None
    assert steps == 3
    assert all(not p["matched"] for p in path)


def test_delete_head_node(populated_list):
    # Scenario 5: Delete the first node (HEAD)
    initial_count = populated_list.count_books()
    deleted = populated_list.delete_book("9780262033848")
    assert deleted["isbn"] == "9780262033848"
    assert populated_list.head.isbn == "9780132350884"
    assert populated_list.count_books() == initial_count - 1


def test_delete_middle_node(populated_list):
    # Scenario 6: Delete a middle node
    initial_count = populated_list.count_books()
    deleted = populated_list.delete_book("9780132350884")
    assert deleted["isbn"] == "9780132350884"
    assert populated_list.head.isbn == "9780262033848"
    assert populated_list.head.next.isbn == "9780135957059"
    assert populated_list.count_books() == initial_count - 1


def test_delete_last_node(populated_list):
    # Scenario 7: Delete the last node (TAIL)
    initial_count = populated_list.count_books()
    deleted = populated_list.delete_book("9780135957059")
    assert deleted["isbn"] == "9780135957059"
    assert populated_list.head.next.next is None
    assert populated_list.count_books() == initial_count - 1


def test_delete_from_empty_list(empty_list):
    # Scenario 8: Delete from an empty list
    with pytest.raises(KeyError, match="empty"):
        empty_list.delete_book("9780262033848")


def test_update_book(populated_list):
    # Scenario 9: Update an existing book
    updated = populated_list.update_book("9780132350884", {
        "title": "Clean Code - Revised Edition",
        "publisher": "Prentice Hall Ed",
    })
    assert updated.title == "Clean Code - Revised Edition"
    assert updated.publisher == "Prentice Hall Ed"


def test_issue_and_return_book(populated_list):
    # Scenario 10: Issue an available book
    issued = populated_list.issue_book("9780262033848", "Rohan Mehta")
    assert issued.availability_status == "Issued"
    assert issued.issued_to == "Rohan Mehta"

    # Scenario 11: Attempt to issue an already-issued book
    with pytest.raises(ValueError, match="already issued"):
        populated_list.issue_book("9780262033848", "Priya Sharma")

    # Scenario 13: Prevent deletion of an issued book
    with pytest.raises(ValueError, match="currently issued"):
        populated_list.delete_book("9780262033848")

    # Scenario 12: Return an issued book
    returned = populated_list.return_book("9780262033848")
    assert returned.availability_status == "Available"
    assert returned.issued_to == ""

    # Attempt to return again (already available)
    with pytest.raises(ValueError, match="already Available"):
        populated_list.return_book("9780262033848")


def test_visualization_structure(populated_list):
    vis = populated_list.get_visualization_data()
    assert vis["total_nodes"] == 3
    assert vis["head_isbn"] == "9780262033848"
    assert vis["tail_isbn"] == "9780135957059"
    nodes = vis["nodes"]
    assert nodes[0]["is_head"] is True
    assert nodes[0]["is_tail"] is False
    assert nodes[0]["next_isbn"] == "9780132350884"
    assert nodes[2]["is_head"] is False
    assert nodes[2]["is_tail"] is True
    assert nodes[2]["next_isbn"] is None
