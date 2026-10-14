import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Percent,
  BookOpen,
  PieChart as PieIcon,
  RefreshCw,
  TrendingUp,
  Layers,
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
  Legend,
} from 'recharts';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge, CategoryBadge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';

const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];

export const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getReports();
      setReport(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to generate analytics report.'));
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const categoryData = report?.category_distribution
    ? Object.entries(report.category_distribution).map(([cat, count]) => ({
        category: cat,
        books: count,
      }))
    : [];

  const statusData = report
    ? [
        { name: 'Available Books', value: report.available_books },
        { name: 'Issued Books', value: report.issued_books },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time metric aggregations computed dynamically from Singly Linked List traversals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href={api.getExportCsvUrl()}
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Catalog (CSV)</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          index={0}
          title="Total Catalog Size"
          value={report?.total_books ?? 0}
          subtitle="Linked list nodes"
          icon={BookOpen}
          variant="indigo"
        />
        <StatCard
          index={1}
          title="Availability Rate"
          value={`${report?.availability_percentage ?? 0}%`}
          subtitle="Ready for checkout"
          icon={Percent}
          variant="emerald"
        />
        <StatCard
          index={2}
          title="Unique Authors"
          value={report?.unique_authors_count ?? 0}
          subtitle="Distinct literary creators"
          icon={Users}
          variant="purple"
        />
        <StatCard
          index={3}
          title="Total Categories"
          value={report?.total_categories ?? 0}
          subtitle="Subject domains"
          icon={Layers}
          variant="amber"
        />
      </div>

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Volume of books across IT & technical subjects
            </p>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="category"
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
                <Bar dataKey="books" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Ratio Donut Chart */}
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Available vs Issued Ratio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live ratio of active student loans
            </p>
          </div>

          <div className="h-72 mt-4 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
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
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Catalog Acquisition Order Table */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Recent Catalog Additions
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Last books linked to the Singly Linked List memory
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">ISBN</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Title</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Author</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Category</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Year</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {report?.recent_books?.map((book) => (
                <tr key={book.isbn} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {book.isbn}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                    {book.title}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {book.author}
                  </td>
                  <td className="py-3 px-3">
                    <CategoryBadge category={book.category} />
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {book.publication_year}
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
    </div>
  );
};

export default ReportsPage;
