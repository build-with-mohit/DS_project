import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  Search,
  ArrowRight,
  GitCommit,
  RefreshCw,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge, CategoryBadge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

const PIE_COLORS = ['#10B981', '#F59E0B']; // Available (Emerald), Issued (Amber)

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch dashboard statistics.'));
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const hasBooks = stats && stats.total_books > 0;

  // Prepare chart data
  const pieData = stats
    ? [
        { name: 'Available Books', value: stats.available_books },
        { name: 'Issued Books', value: stats.issued_books },
      ]
    : [];

  const categoryBarData = stats?.category_distribution
    ? Object.entries(stats.category_distribution).map(([cat, count]) => ({
        name: cat,
        count: count,
      }))
    : [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Library Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage, organize, and explore your library collection powered by a Singly Linked List.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all"
            title="Refresh Real-time Statistics"
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

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          index={0}
          title="Total Books"
          value={stats?.total_books ?? 0}
          subtitle="Linked list nodes in memory"
          icon={BookOpen}
          variant="indigo"
        />
        <StatCard
          index={1}
          title="Available Books"
          value={stats?.available_books ?? 0}
          subtitle="Ready on library shelves"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          index={2}
          title="Issued Books"
          value={stats?.issued_books ?? 0}
          subtitle="Currently on loan to students"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          index={3}
          title="Total Categories"
          value={stats?.total_categories ?? 0}
          subtitle="Distinct genres registered"
          icon={Layers}
          variant="purple"
        />
      </div>

      {/* Quick Action Ribbon */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Frequently used operations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/add-book')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            Add Book
          </button>
          <button
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            Search ISBN
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            View Catalog
          </button>
          <button
            onClick={() => navigate('/visualizer')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all"
          >
            <GitCommit className="w-3.5 h-3.5 text-indigo-200" />
            Visualize Linked List
          </button>
        </div>
      </div>

      {!hasBooks ? (
        <EmptyState
          title="Catalog is Empty"
          description="There are currently no books in the Singly Linked List memory. Add your first book or restore standard seed data."
          actionLabel="Add First Book"
          actionPath="/add-book"
        />
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Availability Donut Chart */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Availability Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Available vs issued node status
                </p>
              </div>

              <div className="h-56 relative flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats?.total_books}
                  </span>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Total</p>
                </div>
              </div>

              <div className="flex items-center justify-around pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">Available ({stats?.available_books})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">Issued ({stats?.issued_books})</span>
                </div>
              </div>
            </div>

            {/* Books by Category Bar Chart */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Books by Category
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Distribution of literature and technical categories
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                  {stats?.total_categories} Categories
                </span>
              </div>

              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recently Added Books & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recently Added Books Table */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Recently Added Books
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Latest nodes appended to the Singly Linked List
                  </p>
                </div>
                <button
                  onClick={() => navigate('/catalog')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">ISBN</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Title</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Category</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {stats?.recent_books?.map((book) => (
                      <tr
                        key={book.isbn}
                        onClick={() => navigate('/catalog')}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {book.isbn}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {book.author}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <CategoryBadge category={book.category} />
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={book.availability_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Activity Stream
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time log of linked list operations
                </p>

                <div className="mt-4 space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                    stats.recent_activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                            {act.details}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No recorded activity yet.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Core Engine: Singly Linked List</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Synced to JSON</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
