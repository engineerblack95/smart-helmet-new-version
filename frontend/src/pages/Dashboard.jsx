// ==================================================
// Dashboard Page
// ==================================================

import { useEffect, useState } from 'react';
import { HardHat, Bike, Activity, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import StatsCard from '../components/dashboard/StatsCard.jsx';
import ViolationChart from '../components/dashboard/ViolationChart.jsx';
import RecentViolations from '../components/dashboard/RecentViolations.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { dashboardService } from '../services/dashboardService.js';
import { getErrorMessage } from '../services/api.js';
import { useSocket } from '../contexts/SocketContext.jsx';

export default function Dashboard() {
  const { socket } = useSocket();
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [o, t] = await Promise.all([
        dashboardService.overview(),
        dashboardService.violationTrends(7),
      ]);
      setOverview(o);
      setTrends(t);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live refresh on socket events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('sensor:update', refresh);
    socket.on('violation:new', refresh);
    return () => {
      socket.off('sensor:update', refresh);
      socket.off('violation:new', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  if (loading) return <Spinner fullScreen />;

  const totals = overview?.totals || {};

  return (
    <>
      <Topbar title="Dashboard" subtitle="Live overview of your smart helmet fleet" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Helmets"
            value={totals.helmets}
            icon={HardHat}
            tone="green"
            hint={`${overview?.online?.helmets ?? 0} online`}
          />
          <StatsCard
            title="Total Bikes"
            value={totals.bikes}
            icon={Bike}
            tone="green"
            hint={`${overview?.online?.bikes ?? 0} online`}
          />
          <StatsCard
            title="Active Rides"
            value={totals.activeRides}
            icon={Activity}
            tone="green"
          />
          <StatsCard
            title="Violations (24h)"
            value={totals.violations24h}
            icon={AlertTriangle}
            tone={totals.violations24h > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Violation Trends" subtitle="Last 7 days" />
              <ViolationChart data={trends} />
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Recent Violations" subtitle="Latest events" />
              <RecentViolations violations={overview?.recentViolations || []} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}