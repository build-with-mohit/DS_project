import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Overview of catalog statistics and linked list health' },
  '/catalog': { title: 'Book Catalog', subtitle: 'Explore, sort, filter, and manage library books' },
  '/add-book': { title: 'Add New Book', subtitle: 'Append a new node to the Singly Linked List' },
  '/search': { title: 'Search Books', subtitle: 'Traverse the linked list by ISBN, title, or author' },
  '/issue-return': { title: 'Issue / Return', subtitle: 'Manage student loans and book check-ins' },
  '/visualizer': { title: 'Linked List Visualizer', subtitle: 'Real-time internal node memory & pointer traversal' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Visual charts, category breakdown, and catalog export' },
  '/settings': { title: 'Settings', subtitle: 'System preferences, database status, and diagnostics' },
};

export const Navbar = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const currentInfo = pageTitles[location.pathname] || {
    title: 'LIBRIX Library',
    subtitle: 'Smart Library Catalog Management System',
  };

  // Format today's date
  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Search, Date, Theme Toggle, Admin Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Shortcut */}
        <button
          onClick={() => navigate('/search')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-all"
          title="Quick Search (ISBN or Title)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick ISBN Search</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-500 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
            /
          </kbd>
        </button>

        {/* Current Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>{todayStr}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
          aria-label="Toggle Theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-indigo-500/20">
              AD
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Admin</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Library Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
