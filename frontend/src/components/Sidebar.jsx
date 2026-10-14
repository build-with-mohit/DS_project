import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Search,
  ArrowLeftRight,
  GitCommit,
  BarChart3,
  Settings,
  X,
  Layers,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Book Catalog', path: '/catalog', icon: BookOpen },
  { name: 'Add New Book', path: '/add-book', icon: PlusCircle },
  { name: 'Search Books', path: '/search', icon: Search },
  { name: 'Issue / Return', path: '/issue-return', icon: ArrowLeftRight },
  { name: 'Linked List Visualizer', path: '/visualizer', icon: GitCommit, highlight: true },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const LibrixLogo = ({ className = 'w-8 h-8' }) => (
  <div className="relative flex items-center justify-center">
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="36" rx="9" fill="url(#brandGrad)" />
      {/* Book spine & pages */}
      <path
        d="M8 9.5C8 8.12 9.12 7 10.5 7H24C25.38 7 26.5 8.12 26.5 9.5V25.5C26.5 26.88 25.38 28 24 28H10.5C9.12 28 8 26.88 8 25.5V9.5Z"
        fill="#1E1B4B"
        fillOpacity="0.3"
      />
      <path
        d="M10 10.5C10 9.67 10.67 9 11.5 9H25C25.83 9 26.5 9.67 26.5 10.5V25C26.5 25.83 25.83 26.5 25 26.5H11.5C10.67 26.5 10 25.83 10 25V10.5Z"
        fill="#FFFFFF"
      />
      {/* Linked List pointer nodes overlay */}
      <circle cx="15" cy="15" r="2" fill="#4F46E5" />
      <circle cx="21" cy="15" r="2" fill="#6366F1" />
      <line x1="17" y1="15" x2="19" y2="15" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M13 20H23M13 23H19"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#0F172A] text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <LibrixLogo className="w-9 h-9" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">LIBRIX</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  SLL
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-tight">Library Management</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data Structure Sub-badge */}
        <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Singly Linked List Core</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive: active }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {item.highlight && (
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-300">LIBRIX Engine</span>
            </div>
            <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              v1.0
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">In-Memory SLL • Atomic JSON</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
