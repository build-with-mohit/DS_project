import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Book,
  User,
  Calendar,
  Building,
  Tag,
  FileText,
  KeyRound,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { validateIsbn } from '../utils/isbnValidator';

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

export const AddBookPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Programming',
    publication_year: new Date().getFullYear(),
    publisher: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [isbnFeedback, setIsbnFeedback] = useState(null);

  // Client-side quick ISBN checksum validation using shared validator
  const validateIsbnClient = (val) => {
    if (!val || !val.trim()) return null;
    return validateIsbn(val);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'isbn') {
      setIsbnFeedback(validateIsbnClient(value));
    }
  };

  const handleClear = () => {
    setFormData({
      isbn: '',
      title: '',
      author: '',
      category: 'Programming',
      publication_year: new Date().getFullYear(),
      publisher: '',
      description: '',
    });
    setIsbnFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.isbn.trim()) {
      toast.error('ISBN identifier is required.');
      return;
    }

    const isbnCheck = validateIsbn(formData.isbn);
    if (!isbnCheck.valid) {
      toast.error(isbnCheck.message);
      setIsbnFeedback(isbnCheck);
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Book title cannot be empty.');
      return;
    }
    if (!formData.author.trim()) {
      toast.error('Author name cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        publication_year: parseInt(formData.publication_year, 10),
      };

      const result = await api.addBook(payload);
      toast.success('Book added successfully!', {
        description: `"${result.title}" was appended as a new node to the Singly Linked List.`,
      });
      navigate('/catalog');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to add book.');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to load sample book for instant demonstration
  const handleLoadSample = (sample) => {
    setFormData(sample);
    setIsbnFeedback(validateIsbnClient(sample.isbn));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <button
            onClick={() => navigate('/catalog')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Add New Book
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create a new BookNode and append it to the tail of the Singly Linked List.
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleLoadSample({
                isbn: '9780131103627',
                title: 'The C Programming Language (2nd Edition)',
                author: 'Brian W. Kernighan, Dennis M. Ritchie',
                category: 'Programming',
                publication_year: 1988,
                publisher: 'Prentice Hall',
                description: 'The definitive classic reference for the C programming language.',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-900 transition-all"
            title="Auto-fill with sample valid book"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Book</span>
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* ISBN Field with Live Validation Indicator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-500" />
                ISBN (International Standard Book Number)
                <span className="text-red-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400 normal-case">
                Supports ISBN-10 or ISBN-13
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="isbn"
                required
                placeholder="e.g. 9780262033848 or 0201633612"
                value={formData.isbn}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl text-sm font-mono bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border transition-colors focus:outline-none focus:ring-2 ${
                  isbnFeedback
                    ? isbnFeedback.valid
                      ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20'
                      : 'border-red-400 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                }`}
              />
            </div>
            {isbnFeedback && (
              <p
                className={`mt-1.5 text-xs font-medium ${
                  isbnFeedback.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                }`}
              >
                {isbnFeedback.message}
              </p>
            )}
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Book className="w-4 h-4 text-indigo-500" />
                Book Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Structure and Interpretation of Computer Programs"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                Author Name(s) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="author"
                required
                placeholder="e.g. Harold Abelson, Gerald Jay Sussman"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-500" />
                Category / Genre
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Publication Year
              </label>
              <input
                type="number"
                name="publication_year"
                min="1000"
                max="2100"
                value={formData.publication_year}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Publisher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-500" />
              Publisher
            </label>
            <input
              type="text"
              name="publisher"
              placeholder="e.g. MIT Press, Addison-Wesley, Pearson"
              value={formData.publisher}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              Short Description / Synopsis
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief summary of the subject matter, key themes, or target audience..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Form
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Back to Catalog
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Appending Node...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Add Book
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookPage;
