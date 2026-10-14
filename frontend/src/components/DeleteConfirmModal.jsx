import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  book,
  isDeleting = false,
}) => {
  if (!isOpen || !book) return null;

  const isIssued = String(book.availability_status).toLowerCase() === 'issued';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Delete Book Record?
        </h3>

        <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {book.title}
          </p>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ISBN: {book.isbn}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Author: {book.author}
          </p>
        </div>

        {isIssued ? (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
            <strong>Warning:</strong> This book is currently issued to{' '}
            <span className="font-semibold">{book.issued_to}</span>. Under library rules,
            issued books cannot be deleted until returned.
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This action will traverse the Singly Linked List in Python, unlink this node
            from its predecessor and successor pointers, and permanently persist the changes to storage.
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(book.isbn)}
            disabled={isDeleting || isIssued}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
              isIssued
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-red-600 hover:bg-red-700 shadow-red-500/20 active:scale-95'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unlinking Node...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Node
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
