"""
LIBRIX — Smart Library Catalog Management System
Module: linked_list.py
Technical Core: Singly Linked List Implementation for Library Books
"""

from datetime import datetime, timezone
from typing import Optional, Tuple, List, Dict, Any


def validate_isbn(isbn: str) -> Tuple[bool, str, str]:
    """
    Validates ISBN-10 or ISBN-13 format including official checksums and prefixes.
    - ISBN-13: Exactly 13 digits, must begin with 978 or 979, valid mod 10 checksum.
    - ISBN-10: Exactly 10 characters, first 9 are digits, 10th is a digit or 'X' (value 10), valid mod 11 checksum.
    Returns: (is_valid: bool, cleaned_isbn: str, error_message: str)
    """
    if not isbn:
        return False, "", "ISBN cannot be empty."

    cleaned = str(isbn).strip().replace("-", "").replace(" ", "").upper()

    if len(cleaned) == 10:
        # First 9 characters must be digits
        if not cleaned[:9].isdigit():
            return False, cleaned, "ISBN-10 must contain 9 digits followed by a digit or 'X'."
        # 10th character can be a digit or 'X'
        last_char = cleaned[9]
        if not (last_char.isdigit() or last_char == "X"):
            return False, cleaned, "The check character of an ISBN-10 must be a digit or 'X'."

        # Compute official checksum for ISBN-10:
        # (10*d1 + 9*d2 + 8*d3 + ... + 2*d9 + 1*d10) mod 11 == 0
        total = 0
        for i in range(9):
            total += int(cleaned[i]) * (10 - i)
        total += 10 if last_char == "X" else int(last_char)

        if total % 11 == 0:
            return True, cleaned, ""

        sum_first_9 = sum(int(cleaned[i]) * (10 - i) for i in range(9))
        check_remainder = (11 - (sum_first_9 % 11)) % 11
        expected_check = "X" if check_remainder == 10 else str(check_remainder)
        return False, cleaned, f"Invalid ISBN-10 checksum (expected check digit '{expected_check}', got '{last_char}')."

    elif len(cleaned) == 13:
        if not cleaned.isdigit():
            return False, cleaned, "ISBN-13 must contain only digits."

        # Must begin with 978 or 979
        if not (cleaned.startswith("978") or cleaned.startswith("979")):
            return False, cleaned, f"ISBN-13 must begin with '978' or '979' prefix (got '{cleaned[:3]}')."

        # Compute official checksum for ISBN-13:
        # Sum(d_i * (1 if i % 2 == 0 else 3)) mod 10 == 0
        total = 0
        for i in range(12):
            weight = 1 if i % 2 == 0 else 3
            total += int(cleaned[i]) * weight
        check_digit = (10 - (total % 10)) % 10

        if int(cleaned[12]) == check_digit:
            return True, cleaned, ""
        return False, cleaned, f"Invalid ISBN-13 checksum (expected check digit {check_digit}, got {cleaned[12]})."

    else:
        return False, cleaned, f"ISBN must be exactly 10 or 13 digits (excluding hyphens/spaces). Current length: {len(cleaned)}."


class BookNode:
    """
    Represents an individual node in the Singly Linked List.
    Contains book metadata, checkout status, and the next pointer.
    """

    def __init__(
        self,
        isbn: str,
        title: str,
        author: str,
        category: str,
        publication_year: int,
        publisher: str = "",
        description: str = "",
        availability_status: str = "Available",
        issued_to: str = "",
        added_at: Optional[str] = None,
    ):
        self.isbn: str = str(isbn).strip()
        self.title: str = str(title).strip()
        self.author: str = str(author).strip()
        self.category: str = str(category).strip()
        self.publication_year: int = int(publication_year)
        self.publisher: str = str(publisher).strip()
        self.description: str = str(description).strip()
        self.availability_status: str = str(availability_status).strip() or "Available"
        self.issued_to: str = str(issued_to).strip()
        self.added_at: str = added_at or datetime.now(timezone.utc).isoformat()
        self.next: Optional["BookNode"] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serializes node data to a clean dictionary."""
        return {
            "isbn": self.isbn,
            "title": self.title,
            "author": self.author,
            "category": self.category,
            "publication_year": self.publication_year,
            "publisher": self.publisher,
            "description": self.description,
            "availability_status": self.availability_status,
            "issued_to": self.issued_to,
            "added_at": self.added_at,
        }

    def __repr__(self) -> str:
        return f"<BookNode(isbn={self.isbn}, title='{self.title}', status='{self.availability_status}')>"


class LibraryLinkedList:
    """
    Singly Linked List managing the Library Catalog in-memory.
    Maintains self.head as the single pointer to the list start.
    All operations use standard linked list traversal with while loops.
    """

    def __init__(self):
        self.head: Optional[BookNode] = None

    def insert_book(self, book_data: Dict[str, Any]) -> BookNode:
        """
        Inserts a new book node at the end of the Singly Linked List.
        Time Complexity: O(n) traversal to tail.
        Enforces unique ISBN across the linked list.
        """
        isbn = str(book_data.get("isbn", "")).strip()
        if not isbn:
            raise ValueError("ISBN is required.")

        # Traverse to verify ISBN uniqueness
        current = self.head
        while current is not None:
            if current.isbn == isbn:
                raise ValueError(f"Book with ISBN '{isbn}' already exists in catalog ('{current.title}').")
            current = current.next

        # Instantiate new node
        new_node = BookNode(
            isbn=isbn,
            title=book_data.get("title", ""),
            author=book_data.get("author", ""),
            category=book_data.get("category", "Other"),
            publication_year=int(book_data.get("publication_year", datetime.now().year)),
            publisher=book_data.get("publisher", ""),
            description=book_data.get("description", ""),
            availability_status=book_data.get("availability_status", "Available"),
            issued_to=book_data.get("issued_to", ""),
            added_at=book_data.get("added_at"),
        )

        # Handle empty list
        if self.head is None:
            self.head = new_node
            return new_node

        # Traverse to last node
        current = self.head
        while current.next is not None:
            current = current.next

        # Append to tail
        current.next = new_node
        return new_node

    def delete_book(self, isbn: str) -> Dict[str, Any]:
        """
        Deletes a book by ISBN from the Singly Linked List.
        Handles:
          - Empty list
          - Head node deletion
          - Middle node deletion
          - Last node deletion
          - ISBN not found
          - Preventing deletion of currently issued books
        Time Complexity: O(n)
        """
        isbn = str(isbn).strip()

        # Handle empty linked list
        if self.head is None:
            raise KeyError("Cannot delete book: Library catalog is empty.")

        # Handle deletion of the HEAD node
        if self.head.isbn == isbn:
            if self.head.availability_status.lower() == "issued":
                raise ValueError(
                    f"Cannot delete book '{self.head.title}' (ISBN: {isbn}) because it is currently issued to '{self.head.issued_to}'. Please return the book first."
                )
            deleted_info = self.head.to_dict()
            self.head = self.head.next
            return deleted_info

        # Traverse to find the node and maintain prev pointer
        prev = self.head
        current = self.head.next

        while current is not None and current.isbn != isbn:
            prev = current
            current = current.next

        # ISBN not found
        if current is None:
            raise KeyError(f"Book with ISBN '{isbn}' was not found in the catalog.")

        # Prevent deletion if book is issued
        if current.availability_status.lower() == "issued":
            raise ValueError(
                f"Cannot delete book '{current.title}' (ISBN: {isbn}) because it is currently issued to '{current.issued_to}'. Please return the book first."
            )

        # Middle or last node deletion: re-wire pointers
        deleted_info = current.to_dict()
        prev.next = current.next
        return deleted_info

    def search_book(self, isbn: str) -> Tuple[Optional[BookNode], int, List[Dict[str, Any]]]:
        """
        Traverses the Singly Linked List to search for a book by ISBN.
        Returns:
          - Found BookNode or None
          - Steps taken (integer count)
          - Traversal path (list of traversed node summaries for visualization/viva proof)
        Time Complexity: O(n)
        """
        isbn = str(isbn).strip()
        current = self.head
        steps = 0
        traversal_path = []

        while current is not None:
            steps += 1
            traversal_path.append({
                "step": steps,
                "isbn": current.isbn,
                "title": current.title,
                "matched": current.isbn == isbn
            })
            if current.isbn == isbn:
                return current, steps, traversal_path
            current = current.next

        return None, steps, traversal_path

    def search_by_query(
        self,
        query: str,
        search_type: str = "all"
    ) -> List[Dict[str, Any]]:
        """
        Searches books by traversing linked list and checking title, author, category, or isbn.
        Time Complexity: O(n)
        """
        results = []
        q = query.strip().lower()
        if not q:
            return self.display_books()

        current = self.head
        while current is not None:
            match = False
            if search_type == "isbn" and q in current.isbn.lower():
                match = True
            elif search_type == "title" and q in current.title.lower():
                match = True
            elif search_type == "author" and q in current.author.lower():
                match = True
            elif search_type == "category" and q in current.category.lower():
                match = True
            elif search_type == "all":
                if (
                    q in current.isbn.lower()
                    or q in current.title.lower()
                    or q in current.author.lower()
                    or q in current.category.lower()
                    or q in current.publisher.lower()
                ):
                    match = True

            if match:
                results.append(current.to_dict())
            current = current.next

        return results

    def update_book(self, isbn: str, update_data: Dict[str, Any]) -> BookNode:
        """
        Updates metadata of an existing book node.
        Does not allow modifying the ISBN to maintain list integrity.
        Time Complexity: O(n)
        """
        isbn = str(isbn).strip()
        current = self.head
        while current is not None:
            if current.isbn == isbn:
                if "title" in update_data and update_data["title"]:
                    current.title = str(update_data["title"]).strip()
                if "author" in update_data and update_data["author"]:
                    current.author = str(update_data["author"]).strip()
                if "category" in update_data and update_data["category"]:
                    current.category = str(update_data["category"]).strip()
                if "publication_year" in update_data and update_data["publication_year"]:
                    current.publication_year = int(update_data["publication_year"])
                if "publisher" in update_data:
                    current.publisher = str(update_data["publisher"]).strip()
                if "description" in update_data:
                    current.description = str(update_data["description"]).strip()
                return current
            current = current.next

        raise KeyError(f"Book with ISBN '{isbn}' not found for update.")

    def issue_book(self, isbn: str, student_name: str) -> BookNode:
        """
        Issues a book to a student.
        Verifies availability, updates node status and borrower info.
        Time Complexity: O(n)
        """
        isbn = str(isbn).strip()
        student = str(student_name).strip()
        if not student:
            raise ValueError("Student / Borrower name is required to issue a book.")

        current = self.head
        while current is not None:
            if current.isbn == isbn:
                if current.availability_status.lower() == "issued":
                    raise ValueError(
                        f"Book '{current.title}' (ISBN: {isbn}) is already issued to '{current.issued_to}'."
                    )
                current.availability_status = "Issued"
                current.issued_to = student
                return current
            current = current.next

        raise KeyError(f"Book with ISBN '{isbn}' not found.")

    def return_book(self, isbn: str) -> BookNode:
        """
        Returns an issued book back to the library.
        Verifies it was issued, resets status to 'Available', clears borrower.
        Time Complexity: O(n)
        """
        isbn = str(isbn).strip()
        current = self.head
        while current is not None:
            if current.isbn == isbn:
                if current.availability_status.lower() == "available":
                    raise ValueError(
                        f"Book '{current.title}' (ISBN: {isbn}) is already Available in the library."
                    )
                current.availability_status = "Available"
                current.issued_to = ""
                return current
            current = current.next

        raise KeyError(f"Book with ISBN '{isbn}' not found.")

    def display_books(self) -> List[Dict[str, Any]]:
        """
        Traverses the linked list from head to tail and returns list of dictionaries.
        Time Complexity: O(n)
        """
        books = []
        current = self.head
        while current is not None:
            books.append(current.to_dict())
            current = current.next
        return books

    def count_books(self) -> int:
        """
        Counts total nodes in the Singly Linked List via manual traversal.
        Time Complexity: O(n)
        """
        count = 0
        current = self.head
        while current is not None:
            count += 1
            current = current.next
        return count

    def count_available_books(self) -> int:
        """
        Counts books with status 'Available' via manual traversal.
        Time Complexity: O(n)
        """
        count = 0
        current = self.head
        while current is not None:
            if current.availability_status.lower() == "available":
                count += 1
            current = current.next
        return count

    def count_issued_books(self) -> int:
        """
        Counts books with status 'Issued' via manual traversal.
        Time Complexity: O(n)
        """
        count = 0
        current = self.head
        while current is not None:
            if current.availability_status.lower() == "issued":
                count += 1
            current = current.next
        return count

    def get_categories(self) -> Dict[str, int]:
        """
        Traverses nodes and counts books per category.
        Time Complexity: O(n)
        """
        cat_counts: Dict[str, int] = {}
        current = self.head
        while current is not None:
            category = current.category or "Other"
            cat_counts[category] = cat_counts.get(category, 0) + 1
            current = current.next
        return cat_counts

    def get_unique_authors(self) -> List[str]:
        """
        Traverses nodes to collect unique authors.
        Time Complexity: O(n)
        """
        authors = set()
        current = self.head
        while current is not None:
            if current.author:
                authors.add(current.author)
            current = current.next
        return sorted(list(authors))

    def get_visualization_data(self) -> Dict[str, Any]:
        """
        Generates full linked list node representation for interactive visualization:
        Node list with pointers, HEAD flag, TAIL flag, next pointer ISBNs,
        and algorithmic complexity reference.
        """
        nodes: List[Dict[str, Any]] = []
        current = self.head
        idx = 0

        while current is not None:
            next_isbn = current.next.isbn if current.next is not None else None
            nodes.append({
                "index": idx,
                "isbn": current.isbn,
                "title": current.title,
                "author": current.author,
                "category": current.category,
                "publication_year": current.publication_year,
                "publisher": current.publisher,
                "availability_status": current.availability_status,
                "issued_to": current.issued_to,
                "next_isbn": next_isbn,
                "is_head": idx == 0,
                "is_tail": current.next is None,
            })
            idx += 1
            current = current.next

        return {
            "total_nodes": idx,
            "head_isbn": self.head.isbn if self.head else None,
            "tail_isbn": nodes[-1]["isbn"] if nodes else None,
            "nodes": nodes,
            "complexities": {
                "insert_at_end": "O(n)",
                "search_by_isbn": "O(n)",
                "delete_by_isbn": "O(n)",
                "display_all_books": "O(n)",
                "count_all_nodes": "O(n)",
            },
            "data_structure": "Singly Linked List",
            "node_schema": "BookNode(isbn, title, author, category, publication_year, publisher, description, availability_status, issued_to, next)",
        }

    def clear(self) -> None:
        """Empties the linked list."""
        self.head = None
