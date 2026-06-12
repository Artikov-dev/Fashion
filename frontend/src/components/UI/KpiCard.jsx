import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({ title, value, sub, icon, color = '#185FA5', trend, loading }) {
  const fmtNum = (v) => {
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number' && v >= 1000) {
      return v.toLocaleString('uz-UZ') + (title?.toLowerCase().includes('daromad') || title?.toLowerCase().includes('revenue') || title?.toLowerCase().includes('so\'m') ? " so'm" : '');
    }
    return String(v);
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider truncate">
            {title}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {fmtNum(value)}
            </p>
          )}
          {sub && (
            <p className="mt-1 text-xs text-gray-400 dark:text-white/30 truncate">{sub}</p>
          )}
          {trend !== undefined && !loading && (
            <p className={`mt-1 text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: `${color}20`, color }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
