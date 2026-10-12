// ==================================================
// Violations Page
// ==================================================

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { violationService } from '../services/violationService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import { formatDate } from '../utils/formatters.js';
import { VIOLATION_LABELS, SEVERITY_COLORS } from '../utils/constants.js';

export default function Violations() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const canResolve = user?.role === 'ADMIN' || user?.role === 'OWNER';

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unresolved'
  const [resolving, setResolving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === 'unresolved' ? { resolved: 'false' } : {};
      const data = await violationService.list(params);
      setViolations(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => load();
    socket.on('violation:new', onNew);
    return () => socket.off('violation:new', onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, filter]);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await violationService.resolve(id);
      toast.success('Violation resolved');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResolving(null);
    }
  };

  return (
    <>
      <Topbar title="Violations" subtitle="Safety events from your fleet" />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-brand-green text-white'
                : 'bg-white border border-brand-gray-border text-brand-black hover:bg-brand-gray-light'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unresolved'
                ? 'bg-brand-green text-white'
                : 'bg-white border border-brand-gray-border text-brand-black hover:bg-brand-gray-light'
            }`}
          >
            Unresolved
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : violations.length === 0 ? (
          <Card>
            <EmptyState
              icon={CheckCircle}
              title={filter === 'unresolved' ? 'No unresolved violations' : 'No violations recorded'}
              description="All riders are safe."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {violations.map((v) => {
              const severityClass = SEVERITY_COLORS[v.severity] || 'bg-gray-100 text-gray-700 border-gray-200';
              return (
                <Card key={v.id} className={v.isResolved ? 'opacity-70' : ''}>
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        v.isResolved ? 'bg-brand-green-light' : 'bg-red-50'
                      }`}
                    >
                      {v.isResolved ? (
                        <CheckCircle className="w-5 h-5 text-brand-green-dark" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-brand-black">
                          {VIOLATION_LABELS[v.type] || v.type}
                        </h3>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${severityClass}`}>
                          {v.severity}
                        </span>
                        {v.helmet?.helmetCode && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-green-light text-brand-green-dark">
                            {v.helmet.helmetCode}
                          </span>
                        )}
                      </div>
                      {v.description && (
                        <p className="text-sm text-brand-gray">{v.description}</p>
                      )}
                      <p className="text-xs text-brand-gray mt-1">{formatDate(v.timestamp)}</p>
                    </div>

                    {!v.isResolved && canResolve && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={resolving === v.id}
                        onClick={() => handleResolve(v.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}