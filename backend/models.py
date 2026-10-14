"""
LIBRIX — Smart Library Catalog Management System
Module: models.py
Pydantic schemas for request validation and response serialization.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    isbn: str = Field(..., description="Unique ISBN-10 or ISBN-13 identifier")
    title: str = Field(..., min_length=1, description="Book title")
    author: str = Field(..., min_length=1, description="Author full name")
    category: str = Field("Other", description="Book category/genre")
    publication_year: int = Field(..., ge=1000, le=2100, description="Year of publication")
    publisher: Optional[str] = Field("", description="Publisher name")
    description: Optional[str] = Field("", description="Synopsis or summary")


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    author: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    publication_year: Optional[int] = Field(None, ge=1000, le=2100)
    publisher: Optional[str] = None
    description: Optional[str] = None


class BookResponse(BaseModel):
    isbn: str
    title: str
    author: str
    category: str
    publication_year: int
    publisher: str
    description: str
    availability_status: str
    issued_to: str
    added_at: str


class IssueRequest(BaseModel):
    student_name: str = Field(..., min_length=1, description="Name of student / borrower")


class SearchResponse(BaseModel):
    query: str
    search_type: str
    steps_taken: int
    traversal_path: List[Dict[str, Any]]
    results: List[BookResponse]
    total_found: int


class DashboardStatsResponse(BaseModel):
    total_books: int
    available_books: int
    issued_books: int
    total_categories: int
    category_distribution: Dict[str, int]
    recent_books: List[BookResponse]
    recent_activities: List[Dict[str, Any]]


class ReportsResponse(BaseModel):
    total_books: int
    available_books: int
    issued_books: int
    total_categories: int
    unique_authors_count: int
    availability_percentage: float
    category_distribution: Dict[str, int]
    recent_books: List[BookResponse]


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
