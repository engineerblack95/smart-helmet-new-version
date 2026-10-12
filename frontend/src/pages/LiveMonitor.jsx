// ==================================================
// Live Monitor Page
// ==================================================

import { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import HelmetStatusCard from '../components/dashboard/HelmetStatusCard.jsx';
import AlcoholGauge from '../components/dashboard/AlcoholGauge.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import { helmetService } from '../services/helmetService.js';
import { sensorService } from '../services/sensorService.js';
import { getErrorMessage } from '../services/api.js';
import { useSocket } from '../contexts/SocketContext.jsx';
import { formatTime } from '../utils/formatters.js';

export default function LiveMonitor() {
  const { socket } = useSocket();
  const [helmets, setHelmets] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  // ---------- Load helmets once ----------
  useEffect(() => {
    (async () => {
      try {
        const data = await helmetService.list();
        setHelmets(data);
        if (data.length && !selectedCode) setSelectedCode(data[0].helmetCode);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Fetch live + history ----------
  const fetchData = useCallback(
    async (code, { silent = false } = {}) => {
      if (!code) return;
      if (!silent) setRefreshing(true);
      try {
        const [liveData, historyData] = await Promise.all([
          sensorService.getLive(code),
          sensorService.getHistory(code, 10),
        ]);
        setLive(liveData);
        setHistory(historyData);
        setLastRefreshedAt(new Date());
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedCode) return;
    fetchData(selectedCode);
  }, [selectedCode, fetchData]);

  // ---------- Socket.IO live updates ----------
  useEffect(() => {
    if (!socket || !selectedCode) return;
    socket.emit('join:helmet', selectedCode);

    const onUpdate = (payload) => {
      if (payload.helmetCode === selectedCode) {
        setLive((prev) => ({
          helmet: prev?.helmet,
          latest: {
            worn: payload.worn,
            alcoholLevel: payload.alcoholLevel,
            alcoholDetected: payload.alcoholDetected,
            batteryLevel: payload.batteryLevel,
            engineAllowed: payload.engineAllowed,
            idMatch: payload.idMatch,
            timestamp: payload.timestamp,
          },
        }));
        setHistory((prev) =>
          [
            {
              id: `live-${Date.now()}`,
              timestamp: payload.timestamp,
              worn: payload.worn,
              alcoholLevel: payload.alcoholLevel,
              batteryLevel: payload.batteryLevel,
              engineAllowed: payload.engineAllowed,
            },
            ...prev,
          ].slice(0, 10)
        );
        setLastRefreshedAt(new Date());
      }
    };

    socket.on('sensor:update', onUpdate);

    return () => {
      socket.emit('leave:helmet', selectedCode);
      socket.off('sensor:update', onUpdate);
    };
  }, [socket, selectedCode]);

  const handleRefresh = async () => {
    if (!selectedCode) return;
    await fetchData(selectedCode);
    toast.success(`Refreshed ${selectedCode}`, { duration: 1500 });
  };

  if (loading) return <Spinner fullScreen />;

  if (!helmets.length) {
    return (
      <>
        <Topbar title="Live Monitor" subtitle="Real-time sensor data" />
        <div className="p-4 sm:p-6">
          <Card>
            <EmptyState
              icon={Activity}
              title="No helmets registered"
              description="Add a helmet first to start monitoring."
            />
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Live Monitor" subtitle="Real-time sensor data" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Helmet selector + refresh */}
        <Card padding={false}>
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1 min-w-0">
              {helmets.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedCode(h.helmetCode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCode === h.helmetCode
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'bg-brand-gray-light text-brand-black hover:bg-brand-green-light'
                  }`}
                >
                  {h.helmetCode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshedAt && (
                <span className="hidden md:block text-xs text-brand-gray">
                  Updated {lastRefreshedAt.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || !selectedCode}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <HelmetStatusCard helmet={live?.helmet} latest={live?.latest} />
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader title="Sensor Reading" subtitle="Live values" />
              <AlcoholGauge level={live?.latest?.alcoholLevel ?? 0} />
            </Card>

            <Card>
              <CardHeader title="Engine Decision" />
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-brand-gray">Engine Status</p>
                  <p className="text-2xl font-bold">
                    {live?.latest?.engineAllowed ? (
                      <span className="text-brand-green-dark">ALLOWED</span>
                    ) : (
                      <span className="text-red-600">BLOCKED</span>
                    )}
                  </p>
                </div>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    live?.latest?.engineAllowed ? 'bg-brand-green-light' : 'bg-red-50'
                  }`}
                >
                  <Activity
                    className={`w-7 h-7 ${
                      live?.latest?.engineAllowed ? 'text-brand-green-dark' : 'text-red-600'
                    }`}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ==================================================
            Recent Readings Table
            ================================================== */}
        <Card padding={false}>
          <div className="p-5 border-b border-brand-gray-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-brand-black">Recent Readings</h3>
              <p className="text-xs text-brand-gray mt-0.5">
                Last 10 sensor packets for {selectedCode || 'this helmet'}
              </p>
            </div>
            <span className="text-xs font-medium text-brand-gray">
              {history.length} record{history.length !== 1 ? 's' : ''}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-sm text-brand-gray">
              No readings yet — send some sensor data to see history here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs font-medium text-brand-gray uppercase border-b border-brand-gray-border">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Worn</th>
                    <th className="px-5 py-3">Alcohol</th>
                    <th className="px-5 py-3">Battery</th>
                    <th className="px-5 py-3">Engine</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const isOver = (h.alcoholLevel ?? 0) >= 300;
                    const batteryLow = (h.batteryLevel ?? 100) < 20;
                    return (
                      <tr
                        key={h.id}
                        className="border-b border-brand-gray-border last:border-0 hover:bg-brand-gray-light transition-colors"
                      >
                        <td className="px-5 py-3 text-brand-gray whitespace-nowrap font-mono text-xs">
                          {formatTime(h.timestamp)}
                        </td>
                        <td className="px-5 py-3">
                          {h.worn ? (
                            <span className="text-brand-green-dark font-medium">Yes</span>
                          ) : (
                            <span className="text-red-600 font-medium">No</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              isOver
                                ? 'text-red-600 font-semibold'
                                : 'text-brand-black font-medium'
                            }
                          >
                            {h.alcoholLevel ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              batteryLow
                                ? 'text-brand-amber-dark font-semibold'
                                : 'text-brand-black'
                            }
                          >
                            {h.batteryLevel ?? '—'}%
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {h.engineAllowed ? (
                            <span className="text-brand-green-dark font-medium">Allowed</span>
                          ) : (
                            <span className="text-red-600 font-medium">Blocked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}