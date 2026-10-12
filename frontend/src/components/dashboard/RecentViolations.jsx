import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { timeAgo } from '../../utils/formatters.js';
import { VIOLATION_LABELS, SEVERITY_COLORS } from '../../utils/constants.js';
import EmptyState from '../common/EmptyState.jsx';

export default function RecentViolations({ violations = [] }) {
  if (!violations.length) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="No violations"
        description="Riders are safe. All systems are green."
      />
    );
  }

  return (
    <div className="space-y-3">
      {violations.slice(0, 5).map((v) => {
        const severityClass =
          SEVERITY_COLORS[v.severity] || 'bg-gray-100 text-gray-700 border-gray-200';
        return (
          <div
            key={v.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-brand-gray-border hover:bg-brand-gray-light transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                v.isResolved ? 'bg-brand-green-light' : 'bg-red-50'
              }`}
            >
              {v.isResolved ? (
                <CheckCircle className="w-4 h-4 text-brand-green-dark" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-brand-black">
                  {VIOLATION_LABELS[v.type] || v.type}
                </p>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${severityClass}`}
                >
                  {v.severity}
                </span>
              </div>
              <p className="text-xs text-brand-gray mt-0.5 truncate">
                {v.helmet?.helmetCode || 'Unknown helmet'} · {timeAgo(v.timestamp)}
              </p>
            </div>
          </div>
        );
      })}

      {violations.length > 5 && (
        <Link
          to="/violations"
          className="block text-center text-sm font-medium text-brand-green hover:text-brand-green-dark py-2"
        >
          View all violations →
        </Link>
      )}
    </div>
  );
}