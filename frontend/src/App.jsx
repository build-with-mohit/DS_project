import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { DashboardPage } from './pages/DashboardPage';
import { CatalogPage } from './pages/CatalogPage';
import { AddBookPage } from './pages/AddBookPage';
import { SearchPage } from './pages/SearchPage';
import { IssueReturnPage } from './pages/IssueReturnPage';
import { VisualizerPage } from './pages/VisualizerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Toast Notifications */}
      <Toaster
        theme={theme === 'dark' ? 'dark' : 'light'}
        richColors
        position="top-right"
        closeButton
      />

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/add-book" element={<AddBookPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/issue-return" element={<IssueReturnPage />} />
            <Route path="/visualizer" element={<VisualizerPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Professional Footer */}
        <footer className="py-6 px-4 md:px-8 border-t border-slate-200 dark:border-slate-850 bg-white/50 dark:bg-slate-900/40 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong className="text-slate-800 dark:text-slate-200">LIBRIX</strong> — Smart Library Catalog Management System
            </p>
            <p className="text-[11px] text-slate-400">
              Second-Year IT Mini-Project • Singly Linked List Data Structure
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
};

export default App;
