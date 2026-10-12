// ==================================================
// HelmetStatusCard — Live helmet status panel
// ==================================================

import { HardHat, Battery, BatteryLow, CheckCircle, XCircle, Clock } from 'lucide-react';
import { timeAgo } from '../../utils/formatters.js';

export default function HelmetStatusCard({ helmet, latest }) {
  if (!helmet) return null;

  const isWorn = latest?.worn ?? false;
  const engineAllowed = latest?.engineAllowed ?? false;
  const idMatch = latest?.idMatch ?? true;
  const batteryLevel = latest?.batteryLevel ?? helmet.batteryLevel ?? 0;
  const batteryLow = batteryLevel < 20;

  const StatusRow = ({ label, value, ok }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-brand-gray-border last:border-0">
      <span className="text-sm text-brand-gray">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {ok ? (
          <CheckCircle className="w-4 h-4 text-brand-green" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={ok ? 'text-brand-green-dark' : 'text-red-600'}>{value}</span>
      </span>
    </div>
  );

  return (
    <div className="bg-white border border-brand-gray-border rounded-xl shadow-soft">
      <div className="flex items-center gap-3 p-5 border-b border-brand-gray-border">
        <div className="w-11 h-11 rounded-lg bg-brand-green-light flex items-center justify-center">
          <HardHat className="w-5 h-5 text-brand-green-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-brand-black truncate">
            {helmet.helmetCode}
          </h3>
          <p className="text-xs text-brand-gray flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                helmet.status === 'ONLINE' ? 'bg-brand-green' : 'bg-gray-400'
              }`}
            />
            {helmet.status}
          </p>
        </div>
      </div>

      <div className="p-5">
        <StatusRow label="ID Match" value={idMatch ? 'Matched' : 'Mismatch'} ok={idMatch} />
        <StatusRow label="Helmet Worn" value={isWorn ? 'Yes' : 'No'} ok={isWorn} />
        <StatusRow
          label="Engine"
          value={engineAllowed ? 'Allowed' : 'Blocked'}
          ok={engineAllowed}
        />

        {/* Battery — turns amber when below 20% */}
        <div className="flex items-center justify-between py-2.5 border-b border-brand-gray-border">
          <span className="text-sm text-brand-gray flex items-center gap-1.5">
            {batteryLow ? (
              <BatteryLow className="w-4 h-4 text-brand-amber" />
            ) : (
              <Battery className="w-4 h-4" />
            )}
            Battery
          </span>
          <span
            className={`text-sm font-medium ${
              batteryLow ? 'text-brand-amber-dark' : 'text-brand-black'
            }`}
          >
            {batteryLevel}%
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-brand-gray flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Last update
          </span>
          <span className="text-sm font-medium text-brand-black">
            {timeAgo(latest?.timestamp || helmet.lastSeenAt)}
          </span>
        </div>
      </div>
    </div>
  );
}