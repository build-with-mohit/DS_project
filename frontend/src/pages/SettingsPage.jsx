import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  Server,
  Layers,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTheme } from '../context/ThemeContext';
import api, { extractErrorMessage } from '../services/api';

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch catalog metrics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      const res = await api.resetDatabase();
      toast.success(res.message || 'Catalog reset to default seed records.');
      setShowResetModal(false);
      fetchStats();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to reset catalog.'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage application themes, verify linked-list memory health, and configure data exports.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance / Theme Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Interface Appearance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your preferred visual mode. Preference is saved to local storage.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Light Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Clean slate background</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Dark Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">High contrast night theme</p>
              </div>
            </button>
          </div>
        </div>

        {/* Catalog Diagnostics & Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Catalog Health & Memory Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Internal parameters of the Singly Linked List memory data structure
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active SLL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Total Node Count
              </span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats?.total_books ?? 0} Nodes
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Storage Engine
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                Atomic JSON Sync
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Concurrency Lock
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
                threading.RLock()
              </p>
            </div>
          </div>
        </div>

        {/* Data Export & Backup */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Export Catalog Snapshot
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
              Download the entire library catalog as a standardized CSV file with all node fields and borrower statuses.
            </p>
          </div>

          <a
            href={api.getExportCsvUrl()}
            download
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>

        {/* Reset Database Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-200/80 dark:border-red-950/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-500" />
              Reset Catalog to Standard Demo Dataset
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
              Clears custom added nodes and restores the standard Computer Science and IT seed book catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-900/60 active:scale-95 transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>

        {/* Project & College Information */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Project Specification
            </h4>
            <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
              LIBRIX v1.0.0
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Second-Year Information Technology Mini-Project on{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              "Library Catalog Management System Using Singly Linked List for Inserting, Deleting, and Searching Books by ISBN."
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span>Frontend: React + Vite + Tailwind CSS</span>
            <span>•</span>
            <span>Backend: Python 3 + FastAPI</span>
            <span>•</span>
            <span>Primary DS: Singly Linked List</span>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Reset Library Catalog?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will re-initialize the Singly Linked List with standard academic textbooks (CLRS, Clean Code, AI Modern Approach, etc.) and save the restored list to <code className="font-mono">books.json</code>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={resetting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
