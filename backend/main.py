"""
LIBRIX — Smart Library Catalog Management System
FastAPI Backend Application
Exposes REST APIs backed by a custom Singly Linked List and persistent storage.
Supports unified fullstack and decoupled serverless deployments on Vercel.
"""

import io
import os
import csv
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, status, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

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

# Configure CORS for local development, production Vercel deployment, and preview URLs
default_origins = [
    "https://ds-project-olive.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
env_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
allowed_origins = list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root_info():
    """Root service discovery endpoint."""
    return {
        "status": "ok",
        "app": "LIBRIX API",
        "description": "Smart Library Catalog Management System using Singly Linked List",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/api/health",
    }


# Router for core API endpoints
api_router = APIRouter()


@api_router.get("/health")
def health_check():
    """Health check endpoint."""
    with _storage_lock:
        storage_manager.sync_if_needed()
        book_count = storage_manager.linked_list.count_books()
    return {
        "status": "ok",
        "app": "LIBRIX",
        "version": "1.0.0",
        "storage_mode": getattr(storage_manager, "storage_mode", "json_file"),
        "total_books": book_count,
    }


@api_router.get("/books", response_model=List[BookResponse])
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
        storage_manager.sync_if_needed()
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


@api_router.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(book_in: BookCreate):
    """
    Appends a new book node to the tail of the Singly Linked List.
    Validates ISBN-10/13 checksum and uniqueness.
    Persists updated list to JSON storage.
    """
    # 1. Validate ISBN checksum
    is_valid, cleaned_isbn, err_msg = validate_isbn(book_in.isbn)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISBN: {err_msg}",
        )

    # 2. Synchronized list insertion
    with _storage_lock:
        storage_manager.sync_if_needed()
        # Check uniqueness by traversing linked list
        existing_node, _, _ = storage_manager.linked_list.search_book(cleaned_isbn)
        if existing_node is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Book with ISBN '{cleaned_isbn}' already exists in the catalog ('{existing_node.title}').",
            )

        book_dict = {
            "isbn": cleaned_isbn,
            "title": book_in.title.strip(),
            "author": book_in.author.strip(),
            "category": book_in.category.strip() or "Other",
            "publication_year": book_in.publication_year,
            "publisher": (book_in.publisher or "").strip(),
            "description": (book_in.description or "").strip(),
            "availability_status": "Available",
            "issued_to": "",
            "added_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            node = storage_manager.linked_list.insert_book(book_dict)
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_added",
                details=f"Appended '{node.title}' (ISBN: {node.isbn}) to Singly Linked List.",
                isbn=node.isbn,
            )
            return node.to_dict()
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to persist book: {str(e)}")


@api_router.get("/books/search", response_model=SearchResponse)
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
        storage_manager.sync_if_needed()
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
            # Multi-field search traversing entire list
            results, steps = storage_manager.linked_list.search_by_text(q_clean, field=type)
            return {
                "query": q_clean,
                "search_type": type,
                "steps_taken": steps,
                "traversal_path": [],
                "results": results,
                "total_found": len(results),
            }


@api_router.get("/books/export")
def export_books_csv():
    """
    Traverses the Singly Linked List and exports all books as standard CSV format.
    Streams directly to client.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
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
            b.get("description", "").replace("\n", " "),
        ])

    csv_content = output.getvalue()
    filename = f"librix_catalog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@api_router.get("/books/{isbn}", response_model=BookResponse)
def get_book_by_isbn(isbn: str):
    """
    Traverses linked list to find a single book by ISBN.
    Returns 404 if not found.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
        node, steps, _ = storage_manager.linked_list.search_book(isbn)
        if node is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Book with ISBN '{isbn}' was not found after traversing {steps} nodes in the list.",
            )
        return node.to_dict()


@api_router.put("/books/{isbn}", response_model=BookResponse)
def update_book(isbn: str, book_update: BookUpdate):
    """
    Updates mutable fields of a book node in place.
    ISBN cannot be changed to preserve node key integrity.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
        update_fields = {k: v for k, v in book_update.model_dump().items() if v is not None}
        try:
            node = storage_manager.linked_list.update_book(isbn, update_fields)
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_updated",
                details=f"Updated metadata for '{node.title}'.",
                isbn=isbn,
            )
            return node.to_dict()
        except KeyError as ke:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@api_router.delete("/books/{isbn}", response_model=ApiResponse)
def delete_book(isbn: str):
    """
    Unlinks a book node by rewiring previous.next = current.next (or head = head.next).
    CRITICAL: Rejects deletion if availability_status == 'Issued'.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
        try:
            deleted_result = storage_manager.linked_list.delete_book(isbn)
            deleted_title = deleted_result.get("title", str(deleted_result)) if isinstance(deleted_result, dict) else str(deleted_result)
            storage_manager.persist_linked_list()
            storage_manager.log_activity(
                action="book_deleted",
                details=f"Unlinked '{deleted_title}' (ISBN: {isbn}) from Singly Linked List.",
                isbn=isbn,
            )
            return {
                "success": True,
                "message": f"Successfully deleted '{deleted_title}' from the library catalog.",
                "data": {"isbn": isbn, "title": deleted_title},
            }
        except KeyError as ke:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@api_router.post("/books/{isbn}/issue", response_model=BookResponse)
def issue_book(isbn: str, req: IssueRequest):
    """
    Issues an available book to a student.
    Sets status to 'Issued' and records borrower's name on node.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
        try:
            node = storage_manager.linked_list.issue_book(isbn, req.student_name)
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


@api_router.post("/books/{isbn}/return", response_model=BookResponse)
def return_book(isbn: str):
    """
    Returns an issued book.
    Resets status to 'Available' and clears issued_to on node.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
        try:
            node = storage_manager.linked_list.return_book(isbn)
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


@api_router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats():
    """
    Computes real-time dashboard statistics directly from linked list traversal.
    No hardcoded values.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
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


@api_router.get("/linked-list/visualize")
def get_linked_list_visualization():
    """
    Returns the real in-memory Singly Linked List sequence with pointers,
    HEAD marker, NULL tail marker, and algorithm time complexities.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
        return storage_manager.linked_list.get_visualization_data()


@api_router.get("/reports", response_model=ReportsResponse)
def get_reports_data():
    """
    Generates analytics report data directly from linked list traversals.
    """
    with _storage_lock:
        storage_manager.sync_if_needed()
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


@api_router.post("/system/reset", response_model=ApiResponse)
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


# Mount API routes with /api prefix (primary) and without prefix (fallback alias for Vercel rewrites)
app.include_router(api_router, prefix="/api")
app.include_router(api_router, include_in_schema=False)
