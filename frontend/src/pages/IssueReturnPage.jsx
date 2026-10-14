import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  BookCheck,
  RotateCcw,
  User,
  KeyRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { StatusBadge, CategoryBadge } from '../components/Badge';

export const IssueReturnPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Issue Form State
  const [issueIsbn, setIssueIsbn] = useState('');
  const [studentName, setStudentName] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Return Form State
  const [returnIsbn, setReturnIsbn] = useState('');
  const [returning, setReturning] = useState(false);

  const fetchBooks = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch catalog.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueIsbn.trim()) {
      toast.error('Please enter the ISBN of the book to issue.');
      return;
    }
    if (!studentName.trim()) {
      toast.error('Please enter the borrower / student name.');
      return;
    }

    setIssuing(true);
    try {
      const updated = await api.issueBook(issueIsbn.trim(), studentName.trim());
      toast.success(`Book "${updated.title}" successfully issued to ${studentName.trim()}!`);
      setIssueIsbn('');
      setStudentName('');
      fetchBooks();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to issue book.'));
    } finally {
      setIssuing(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnIsbn.trim()) {
      toast.error('Please enter the ISBN of the book to return.');
      return;
    }

    setReturning(true);
    try {
      const updated = await api.returnBook(returnIsbn.trim());
      toast.success(`Book "${updated.title}" successfully returned to shelves!`);
      setReturnIsbn('');
      fetchBooks();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to return book.'));
    } finally {
      setReturning(false);
    }
  };

  // Quick Action Handlers from tables
  const handleQuickIssueSelect = (isbn) => {
    setIssueIsbn(isbn);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickReturn = async (isbn, title) => {
    setReturning(true);
    try {
      await api.returnBook(isbn);
      toast.success(`"${title}" returned to shelves.`);
      fetchBooks();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setReturning(false);
    }
  };

  // Group books into Issued vs Available
  const issuedBooks = books.filter(
    (b) => String(b.availability_status).toLowerCase() === 'issued'
  );
  const availableBooks = books.filter(
    (b) => String(b.availability_status).toLowerCase() === 'available'
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Issue & Return Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Check out books to students or process returns, immediately mutating the Singly Linked List nodes.
          </p>
        </div>
        <button
          onClick={fetchBooks}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Lists</span>
        </button>
      </div>

      {/* Dual Operation Forms: Issue (Left) & Return (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Book Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Issue Book to Student
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update node status from 'Available' to 'Issued'
                </p>
              </div>
            </div>

            <form onSubmit={handleIssueSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  Book ISBN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9780262033848"
                  value={issueIsbn}
                  onChange={(e) => setIssueIsbn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Student / Borrower Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma (Roll No: IT-204)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={issuing}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-98 disabled:opacity-50 transition-all"
                >
                  {issuing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Issuing Book...
                    </>
                  ) : (
                    <>
                      <BookCheck className="w-4 h-4" />
                      Confirm Book Issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Prevents duplicate checkouts on already-issued items.</span>
          </div>
        </div>

        {/* Return Book Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Return Issued Book
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reset node status to 'Available' and clear borrower
                </p>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                  Book ISBN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9780132350884"
                  value={returnIsbn}
                  onChange={(e) => setReturnIsbn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Return Policy:</p>
                <p>When returned, the linked list node is updated in O(n) traversal, borrower is cleared, and persistence is updated atomically.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={returning}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 active:scale-98 disabled:opacity-50 transition-all"
                >
                  {returning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Return...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Confirm Book Return
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Book immediately becomes eligible for subsequent student checkouts.</span>
          </div>
        </div>
      </div>

      {/* Two Live Sections: Currently Issued Books & Available Books */}
      <div className="space-y-8">
        {/* Section 1: Currently Issued Books */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Currently Issued Books ({issuedBooks.length})
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
              Active Loans
            </span>
          </div>

          {issuedBooks.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No books are currently issued. All library books are available on shelves.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issuedBooks.map((book) => (
                <div
                  key={book.isbn}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {book.isbn}
                      </span>
                      <StatusBadge status="Issued" />
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {book.author}
                    </p>

                    <div className="mt-4 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Issued To:</span>
                      <p className="font-bold text-amber-800 dark:text-amber-300 truncate">
                        {book.issued_to}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <CategoryBadge category={book.category} />
                    <button
                      onClick={() => handleQuickReturn(book.isbn, book.title)}
                      disabled={returning}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Return Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Available Books */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Available Books Ready for Issue ({availableBooks.length})
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
              On Shelves
            </span>
          </div>

          {availableBooks.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              All books are currently issued.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBooks.slice(0, 9).map((book) => (
                <div
                  key={book.isbn}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {book.isbn}
                      </span>
                      <StatusBadge status="Available" />
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {book.author}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <CategoryBadge category={book.category} />
                    <button
                      onClick={() => handleQuickIssueSelect(book.isbn)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
                    >
                      <BookCheck className="w-3.5 h-3.5" />
                      Select to Issue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueReturnPage;
