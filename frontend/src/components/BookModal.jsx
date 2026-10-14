import React, { useState, useEffect } from 'react';
import {
  X,
  Book,
  User,
  Calendar,
  Building,
  Tag,
  FileText,
  Edit3,
  CheckCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { StatusBadge, CategoryBadge } from './Badge';

const CATEGORIES = [
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

export const BookModal = ({
  isOpen,
  onClose,
  book,
  initialMode = 'view',
  onSave,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        category: book.category || 'Other',
        publication_year: book.publication_year || new Date().getFullYear(),
        publisher: book.publisher || '',
        description: book.description || '',
      });
      setMode(initialMode);
      setFormError('');
    }
  }, [book, initialMode, isOpen]);

  if (!isOpen || !book) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Book title cannot be empty.');
      return;
    }
    if (!formData.author.trim()) {
      setFormError('Author name cannot be empty.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSave(book.isbn, {
        ...formData,
        publication_year: parseInt(formData.publication_year, 10),
      });
      setMode('view');
    } catch (err) {
      setFormError(err.message || 'Failed to update book.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Edit Book Details' : 'Book Specification'}
              </h3>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                ISBN: {book.isbn}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/50">
              {formError}
            </div>
          )}

          {mode === 'view' ? (
            /* VIEW MODE */
            <div className="space-y-6">
              {/* Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {book.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    By <span className="font-semibold text-slate-900 dark:text-white">{book.author}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={book.availability_status} />
                  <CategoryBadge category={book.category} />
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Publication Year
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {book.publication_year || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
                  <Building className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Publisher
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {book.publisher || 'Not Specified'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
                  <User className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Current Borrower
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {book.issued_to ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{book.issued_to}</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic">None (In Library)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
                  <Tag className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Data Structure Node
                    </span>
                    <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      SLL Node [ISBN: {book.isbn.slice(-4)}]
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Book Description / Synopsis
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {book.description || 'No description provided for this catalog entry.'}
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form id="edit-book-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Immutable ISBN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  ISBN (Node Key - Immutable)
                  <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="text"
                  disabled
                  value={book.isbn}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed font-mono"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Book Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Author Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  required
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    name="publication_year"
                    min="1000"
                    max="2100"
                    value={formData.publication_year}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Publisher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Publisher
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Synopsis
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          {mode === 'view' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Edit Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode('view')}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-book-form"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Node...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookModal;
