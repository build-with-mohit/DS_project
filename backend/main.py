"""
LIBRIX — Smart Library Catalog Management System
FastAPI Backend Application
Exposes REST APIs backed by a custom Singly Linked List and persistent JSON storage.
"""

import io
import csv
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from linked_list import validate_isbn
from models import (
    BookCreate,
    BookUpdate,
    BookResponse,
    IssueRequest,
    SearchResponse,
    DashboardStatsResponse,
    ReportsResponse,
    ApiResponse,
)
from storage import storage_manager, _storage_lock, SEED_BOOKS

app = FastAPI(
    title="LIBRIX API",
    description="Smart Library Catalog Management System using Singly Linked List Data Structure",
    version="1.0.0",
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": "LIBRIX", "version": "1.0.0"}


@app.get("/api/books", response_model=List[BookResponse])
def get_all_books(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by availability status"),
    search: Optional[str] = Query(None, description="Quick search term"),
    sort_by: Optional[str] = Query("title", description="Sort by field: title or year"),
    sort_order: Optional[str] = Query("asc", description="Sort order: asc or desc"),
):
    """
    Returns all books traversed from the Singly Linked List.
    Client can optionally filter or sort for presentation purposes.
    """
    with _storage_lock:
        raw_books = storage_manager.linked_list.display_books()

    # Presentation filtering
    filtered = raw_books
    if category and category != "All":
        filtered = [b for b in filtered if b.get("category", "").lower() == category.lower()]
    if status_filter and status_filter != "All":
        filtered = [b for b in filtered if b.get("availability_status", "").lower() == status_filter.lower()]
    if search:
        s = search.strip().lower()
        filtered = [
            b for b in filtered
            if s in b.get("title", "").lower()
            or s in b.get("author", "").lower()
            or s in b.get("isbn", "").lower()
            or s in b.get("category", "").lower()
        ]

    # Presentation sorting
    if sort_by == "publication_year" or sort_by == "year":
        filtered.sort(key=lambda x: x.get("publication_year", 0), reverse=(sort_order == "desc"))
    else:
        filtered.sort(key=lambda x: str(x.get("title", "")).lower(), reverse=(sort_order == "desc"))

    return filtered


@app.post("/api/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_new_book(book_in: BookCreate):
    """
    Validates ISBN (format & checksum), ensures uniqueness,
    instantiates a new BookNode, appends to the Singly Linked List,
    and atomically persists the list to JSON storage.
    """
    is_valid, cleaned_isbn, error_msg = validate_isbn(book_in.isbn)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ISBN Validation Error: {error_msg}"
        )

    book_dict = book_in.model_dump()
    book_dict["isbn"] = cleaned_isbn
    book_dict["availability_status"] = "Available"
    book_dict["issued_to"] = ""
    book_dict["added_at"] = datetime.now(timezone.utc).isoformat()

    with _storage_lock:
        try:
            node = storage_manager.linked_list.insert_book(book_dict)
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_added",
                details=f"Added '{node.title}' (ISBN: {cleaned_isbn}) to catalog.",
                isbn=cleaned_isbn,
            )
            return node.to_dict()
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to persist book: {str(e)}")


@app.get("/api/books/search", response_model=SearchResponse)
def search_books(
    q: str = Query(..., min_length=1, description="Search query"),
    type: str = Query("all", description="Search type: isbn, title, author, category, or all"),
):
    """
    Performs search using linked list traversal.
    For type='isbn', returns step-by-step traversal path matching the linked list algorithm.
    """
    q_clean = q.strip()
    with _storage_lock:
        if type == "isbn":
            # Direct linked list ISBN search algorithm
            node, steps, path = storage_manager.linked_list.search_book(q_clean)
            results = [node.to_dict()] if node else []
            return {
                "query": q_clean,
                "search_type": "isbn",
                "steps_taken": steps,
                "traversal_path": path,
                "results": results,
                "total_found": len(results),
            }
        else:
            matches = storage_manager.linked_list.search_by_query(q_clean, search_type=type)
            return {
                "query": q_clean,
                "search_type": type,
                "steps_taken": storage_manager.linked_list.count_books(),
                "traversal_path": [],
                "results": matches,
                "total_found": len(matches),
            }


@app.get("/api/books/export")
def export_books_csv():
    """
    Exports the current Singly Linked List library catalog as a downloadable CSV.
    Must be defined before parameterized /api/books/{isbn} route.
    """
    with _storage_lock:
        books = storage_manager.linked_list.display_books()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ISBN",
        "Title",
        "Author",
        "Category",
        "Publication Year",
        "Publisher",
        "Availability Status",
        "Issued To",
        "Added Date",
        "Description",
    ])

    for b in books:
        writer.writerow([
            b.get("isbn", ""),
            b.get("title", ""),
            b.get("author", ""),
            b.get("category", ""),
            b.get("publication_year", ""),
            b.get("publisher", ""),
            b.get("availability_status", ""),
            b.get("issued_to", ""),
            b.get("added_at", ""),
            b.get("description", ""),
        ])

    csv_data = output.getvalue()
    filename = f"librix_catalog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/books/{isbn}", response_model=BookResponse)
def get_book_by_isbn(isbn: str):
    """
    Finds an individual book by traversing the Singly Linked List for the ISBN.
    """
    with _storage_lock:
        node, steps, _ = storage_manager.linked_list.search_book(isbn.strip())
        if not node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Book with ISBN '{isbn}' not found in catalog."
            )
        return node.to_dict()


@app.put("/api/books/{isbn}", response_model=BookResponse)
def update_book(isbn: str, update_in: BookUpdate):
    """
    Updates book details in its Singly Linked List node and persists changes.
    """
    with _storage_lock:
        try:
            update_data = {k: v for k, v in update_in.model_dump().items() if v is not None}
            node = storage_manager.linked_list.update_book(isbn.strip(), update_data)
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_updated",
                details=f"Updated details for '{node.title}' (ISBN: {isbn}).",
                isbn=isbn,
            )
            return node.to_dict()
        except KeyError as ke:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.delete("/api/books/{isbn}", response_model=ApiResponse)
def delete_book(isbn: str):
    """
    Deletes a book node from the Singly Linked List.
    Re-wires next pointers (handles head, middle, and tail nodes).
    Refuses deletion if the book is currently issued.
    """
    with _storage_lock:
        try:
            deleted_info = storage_manager.linked_list.delete_book(isbn.strip())
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_deleted",
                details=f"Removed '{deleted_info.get('title')}' (ISBN: {isbn}) from library catalog.",
                isbn=isbn,
            )
            return {
                "success": True,
                "message": f"Successfully deleted book '{deleted_info.get('title')}' (ISBN: {isbn}).",
                "data": deleted_info,
            }
        except KeyError as ke:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/api/books/{isbn}/issue", response_model=BookResponse)
def issue_book(isbn: str, req: IssueRequest):
    """
    Marks a book as issued in its linked list node.
    Verifies book is currently available and saves borrower name.
    """
    with _storage_lock:
        try:
            node = storage_manager.linked_list.issue_book(isbn.strip(), req.student_name)
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_issued",
                details=f"Issued '{node.title}' to {req.student_name.strip()}.",
                isbn=isbn,
            )
            return node.to_dict()
        except KeyError as ke:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/api/books/{isbn}/return", response_model=BookResponse)
def return_book(isbn: str):
    """
    Returns an issued book, resetting status to 'Available' in its linked list node.
    """
    with _storage_lock:
        try:
            node = storage_manager.linked_list.return_book(isbn.strip())
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_returned",
                details=f"Returned '{node.title}' back to catalog shelves.",
                isbn=isbn,
            )
            return node.to_dict()
        except KeyError as ke:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/api/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats():
    """
    Computes real-time dashboard statistics directly from linked list traversal.
    No hardcoded values.
    """
    with _storage_lock:
        total = storage_manager.linked_list.count_books()
        available = storage_manager.linked_list.count_available_books()
        issued = storage_manager.linked_list.count_issued_books()
        categories = storage_manager.linked_list.get_categories()
        all_books = storage_manager.linked_list.display_books()
        activities = storage_manager.get_activities()

    # Recent books (last 5 added or displayed)
    recent = list(reversed(all_books))[:5]

    return {
        "total_books": total,
        "available_books": available,
        "issued_books": issued,
        "total_categories": len(categories),
        "category_distribution": categories,
        "recent_books": recent,
        "recent_activities": activities[:8],
    }


@app.get("/api/linked-list/visualize")
def get_linked_list_visualization():
    """
    Returns the real in-memory Singly Linked List sequence with pointers,
    HEAD marker, NULL tail marker, and algorithm time complexities.
    """
    with _storage_lock:
        return storage_manager.linked_list.get_visualization_data()


@app.get("/api/reports", response_model=ReportsResponse)
def get_reports_data():
    """
    Generates analytics report data directly from linked list traversals.
    """
    with _storage_lock:
        total = storage_manager.linked_list.count_books()
        available = storage_manager.linked_list.count_available_books()
        issued = storage_manager.linked_list.count_issued_books()
        categories = storage_manager.linked_list.get_categories()
        unique_authors = storage_manager.linked_list.get_unique_authors()
        all_books = storage_manager.linked_list.display_books()

    avail_pct = round((available / total * 100), 1) if total > 0 else 0.0

    return {
        "total_books": total,
        "available_books": available,
        "issued_books": issued,
        "total_categories": len(categories),
        "unique_authors_count": len(unique_authors),
        "availability_percentage": avail_pct,
        "category_distribution": categories,
        "recent_books": list(reversed(all_books))[:6],
    }



@app.post("/api/system/reset", response_model=ApiResponse)
def reset_database():
    """
    Resets the catalog back to initial standard seed data.
    Useful for demonstration and clean testing.
    """
    with _storage_lock:
        storage_manager.linked_list.clear()
        for b in SEED_BOOKS:
            storage_manager.linked_list.insert_book(b)
        storage_manager.persist_linked_list()
        storage_manager.log_activity("system_reset", "Catalog database reset to standard seed records.")
        return {
            "success": True,
            "message": "Library catalog has been reset to default demo dataset.",
            "data": {"count": storage_manager.linked_list.count_books()},
        }
