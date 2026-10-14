import React, { useState } from 'react';
import {
  Search as SearchIcon,
  Book,
  Calendar,
  Layers,
  ArrowRight,
  GitCommit,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { StatusBadge, CategoryBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { BookModal } from '../components/BookModal';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('isbn'); // 'isbn' | 'title' | 'author' | 'category' | 'all'
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // View Modal state
  const [modalBook, setModalBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanQ = query.trim();
    if (!cleanQ) {
      toast.error('Please enter a search term.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.searchBooks(cleanQ, searchType);
      setSearchResponse(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Search operation failed.'));
      setSearchResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickIsbn = (isbn) => {
    setQuery(isbn);
    setSearchType('isbn');
    // Trigger immediate search
    setTimeout(() => {
      api.searchBooks(isbn, 'isbn')
        .then((data) => {
          setSearchResponse(data);
          setHasSearched(true);
        })
        .catch((err) => toast.error(extractErrorMessage(err)));
    }, 50);
  };

  const handleSaveBook = async (isbn, updatedFields) => {
    const updated = await api.updateBook(isbn, updatedFields);
    toast.success(`Book "${updated.title}" updated.`);
    handleSearch();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Find Your Next Book
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Traverse the Singly Linked List in Python to locate books by ISBN, title, or author.
        </p>
      </div>

      {/* Prominent Search Bar & Type Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        {/* Radio Type Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {[
            { id: 'isbn', label: 'ISBN (SLL Pointer Traversal)' },
            { id: 'title', label: 'Book Title' },
            { id: 'author', label: 'Author' },
            { id: 'category', label: 'Category' },
            { id: 'all', label: 'All Fields' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSearchType(type.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                searchType === type.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={
                searchType === 'isbn'
                  ? 'Enter exact or partial ISBN (e.g. 9780262033848)...'
                  : `Search catalog by ${searchType}...`
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Traversing...</span>
              </>
            ) : (
              <>
                <SearchIcon className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Quick ISBN Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span className="font-medium">Try ISBN:</span>
          {['9780262033848', '9780132350884', '9780135957059', '9780201633610'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleQuickIsbn(sample)}
              className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Traversal Metadata Banner (Viva / Demonstration Proof) */}
      {searchResponse && searchResponse.search_type === 'isbn' && (
        <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-indigo-950 dark:text-indigo-200">
                Singly Linked List Traversal Verification
              </p>
              <p className="text-indigo-700 dark:text-indigo-400 mt-0.5">
                Target ISBN: <span className="font-mono font-semibold">{searchResponse.query}</span> • Steps Traversed:{' '}
                <span className="font-bold">{searchResponse.steps_taken}</span> • Time Complexity: <span className="font-mono font-bold">O(n)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {searchResponse.total_found > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" /> Node Located
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-semibold text-[11px]">
                <XCircle className="w-3.5 h-3.5" /> Reached NULL (Not Found)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Search Results ({searchResponse ? searchResponse.total_found : 0})
            </h3>
            {searchResponse && (
              <span className="text-xs text-slate-400">
                Query: "{searchResponse.query}"
              </span>
            )}
          </div>

          {!searchResponse || searchResponse.total_found === 0 ? (
            <EmptyState
              title="No matching books found."
              description={`We traversed the entire Singly Linked List, but no books matched "${query}". Please check the ISBN or spelling.`}
              actionLabel="Add This Book to Catalog"
              actionPath="/add-book"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResponse.results.map((book) => (
                <div
                  key={book.isbn}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-900">
                          ISBN: {book.isbn}
                        </span>
                        <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {book.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          By <span className="font-semibold text-slate-800 dark:text-slate-200">{book.author}</span>
                        </p>
                      </div>
                      <StatusBadge status={book.availability_status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <CategoryBadge category={book.category} />
                      {book.publication_year && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {book.publication_year}
                        </span>
                      )}
                      {book.publisher && (
                        <span className="text-xs text-slate-400 truncate max-w-[150px]">
                          • {book.publisher}
                        </span>
                      )}
                    </div>

                    {book.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {book.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {book.availability_status === 'Issued' ? `Borrowed by: ${book.issued_to}` : 'Available for issue'}
                    </span>
                    <button
                      onClick={() => {
                        setModalBook(book);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <BookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        book={modalBook}
        initialMode="view"
        onSave={handleSaveBook}
      />
    </div>
  );
};

export default SearchPage;
