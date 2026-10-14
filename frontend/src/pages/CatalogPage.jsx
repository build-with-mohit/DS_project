import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { StatusBadge, CategoryBadge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { BookModal } from '../components/BookModal';

const CATEGORIES = [
  'All',
  'Programming',
  'Computer Science',
  'Data Structures',
  'Artificial Intelligence',
  'Networking',
  'Database Management',
  'Mathematics',
  'Science',
  'Literature',
  'Other',
];

export const CatalogPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('title'); // 'title' | 'publication_year'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [modalBook, setModalBook] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [deleteBook, setDeleteBook] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getBooks({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setBooks(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to load catalog books.'));
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Debounced search on typing
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(books.length / itemsPerPage) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return books.slice(start, start + itemsPerPage);
  }, [books, currentPage]);

  // Actions
  const handleView = (book) => {
    setModalBook(book);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (book) => {
    setModalBook(book);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSaveBook = async (isbn, updatedFields) => {
    try {
      const updated = await api.updateBook(isbn, updatedFields);
      toast.success(`Book "${updated.title}" updated successfully!`);
      fetchBooks();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to update book.');
      toast.error(msg);
      throw err;
    }
  };

  const handleDeletePrompt = (book) => {
    setDeleteBook(book);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async (isbn) => {
    setIsDeleting(true);
    try {
      await api.deleteBook(isbn);
      toast.success('Book node removed from Singly Linked List.');
      setIsDeleteOpen(false);
      setDeleteBook(null);
      fetchBooks();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete book.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Book Catalog
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Internal Singly Linked List registry of all books stored in-memory and synced to storage.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={api.getExportCsvUrl()}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </a>
          <button
            onClick={() => fetchBooks(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/add-book')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Title, Author, or ISBN..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Issued">Issued Only</option>
            </select>
          </div>

          {/* Result count indicator */}
          <span className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
            {books.length} {books.length === 1 ? 'Book' : 'Books'}
          </span>
        </div>
      </div>

      {/* Main Catalog Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : books.length === 0 ? (
        <EmptyState
          title="No Books Found"
          description={
            searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
              ? 'No books in the Singly Linked List match your current search/filter settings.'
              : 'Your library catalog is currently empty. Add a new book to create the head node.'
          }
          actionLabel="Add New Book"
          actionPath="/add-book"
          secondaryActionLabel="Reset Filters"
          onSecondaryAction={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedStatus('All');
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    ISBN
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    <button
                      onClick={() => toggleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      Book Title
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Author
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Category
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    <button
                      onClick={() => toggleSort('publication_year')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                    >
                      Year
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Status
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedBooks.map((book) => (
                  <tr
                    key={book.isbn}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {book.isbn}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {book.title}
                      </p>
                      {book.publisher && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {book.publisher}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {book.author}
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={book.category} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {book.publication_year || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={book.availability_status} />
                        {book.issued_to && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate max-w-[120px]">
                            to {book.issued_to}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(book)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                          title="View Details"
                          aria-label={`View details of ${book.title}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                          title="Edit Book"
                          aria-label={`Edit ${book.title}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(book)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                          title="Delete Book"
                          aria-label={`Delete ${book.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {Math.min(currentPage * itemsPerPage, books.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-200">{books.length}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Details & Edit Modal */}
      <BookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        book={modalBook}
        initialMode={modalMode}
        onSave={handleSaveBook}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        book={deleteBook}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CatalogPage;
