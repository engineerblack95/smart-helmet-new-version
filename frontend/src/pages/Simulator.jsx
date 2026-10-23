// ==================================================
// Simulator Page — Admin-only test panel
// ==================================================

import { useState } from 'react';
import {
  FlaskConical,
  Send,
  Wine,
  Battery,
  BatteryLow,
  HardHat,
  Shield,
  RotateCcw,
  CheckCircle,
  XCircle,
  CircleCheck,
  CircleX,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Badge from '../components/common/Badge.jsx';
import { simulatorService } from '../services/simulatorService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const DEFAULTS = {
  helmetCode: 'H001',
  bikeCode: 'B001',
  worn: true,
  alcoholLevel: 100,
  batteryLevel: 85,
};

const ALCOHOL_THRESHOLD = 400; // 👈 CHANGED TO 400

// ==================================================
// Quick preset definitions (icons + colors + data)
// ==================================================
const PRESETS = [
  {
    id: 'safe',
    label: 'Safe Rider',
    description: 'Sober + worn + 90%',
    icon: ShieldCheck,
    accent: {
      bg: 'bg-brand-green-light',
      border: 'border-brand-green/40',
      hover: 'hover:border-brand-green',
      icon: 'text-brand-green-dark',
      title: 'text-brand-black',
    },
    data: { ...DEFAULTS, worn: true, alcoholLevel: 80, batteryLevel: 90 },
  },
  {
    id: 'drunk',
    label: 'Drunk Rider',
    description: 'Alcohol 800 + worn',
    icon: Wine,
    accent: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      hover: 'hover:border-red-500',
      icon: 'text-red-600',
      title: 'text-brand-black',
    },
    data: { ...DEFAULTS, worn: true, alcoholLevel: 800, batteryLevel: 90 },
  },
  {
    id: 'no-helmet',
    label: 'No Helmet',
    description: 'Not worn + sober',
    icon: ShieldAlert,
    accent: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      hover: 'hover:border-red-500',
      icon: 'text-red-600',
      title: 'text-brand-black',
    },
    data: { ...DEFAULTS, worn: false, alcoholLevel: 80, batteryLevel: 90 },
  },
  {
    id: 'low-battery',
    label: 'Low Battery',
    description: 'Safe but 12% battery',
    icon: BatteryLow,
    accent: {
      bg: 'bg-brand-amber-light',
      border: 'border-brand-amber/40',
      hover: 'hover:border-brand-amber',
      icon: 'text-brand-amber-dark',
      title: 'text-brand-black',
    },
    data: { ...DEFAULTS, worn: true, alcoholLevel: 80, batteryLevel: 12 },
  },
];

export default function Simulator() {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULTS);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  // Safety check — only ADMIN should access this page
  if (user?.role !== 'ADMIN') {
    return (
      <>
        <Topbar title="Sensor Simulator" subtitle="Admin only" />
        <div className="p-4 sm:p-6">
          <Card>
            <div className="flex flex-col items-center py-12 text-center">
              <Shield className="w-12 h-12 text-red-500 mb-3" />
              <h3 className="text-base font-semibold text-brand-black mb-1">
                Access Restricted
              </h3>
              <p className="text-sm text-brand-gray">
                Only ADMIN users can access the sensor simulator.
              </p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setActivePreset(null); // manual edit clears preset highlight
  };

  const applyPreset = (preset) => {
    setForm(preset.data);
    setActivePreset(preset.id);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await simulatorService.send({
        helmetCode: form.helmetCode.trim(),
        bikeCode: form.bikeCode.trim(),
        worn: form.worn,
        alcoholLevel: Number(form.alcoholLevel),
        batteryLevel: Number(form.batteryLevel),
      });
      setLastResult(result);
      if (result.engineAllowed) {
        toast.success(`Engine ALLOWED — ${form.helmetCode}`);
      } else {
        toast.error(
          `Engine BLOCKED — ${result.violations?.join(', ') || 'unsafe state'}`
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setForm(DEFAULTS);
    setLastResult(null);
    setActivePreset(null);
  };

  return (
    <>
      <Topbar
        title="Sensor Simulator"
        subtitle="Inject test data without the terminal"
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Info banner */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-brand-green-light flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-brand-green-dark" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-black">
                Sensor Simulator
              </h3>
              <p className="text-sm text-brand-gray mt-1">
                Inject sensor data exactly as a physical ESP32 would. The data flows
                through the same pipeline — AND-gate logic, database, violations, and
                real-time dashboard updates.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* LEFT — Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader
                icon={Send}
                title="Simulate Sensor Packet"
                subtitle="Fill values and click Send"
              />

              <div className="space-y-4 mt-4">
                {/* Device codes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Helmet Code"
                    placeholder="H001"
                    value={form.helmetCode}
                    onChange={(e) => update('helmetCode', e.target.value)}
                  />
                  <Input
                    label="Bike Code"
                    placeholder="B001"
                    value={form.bikeCode}
                    onChange={(e) => update('bikeCode', e.target.value)}
                  />
                </div>

                {/* Worn toggle */}
                <div>
                  <label className="block text-sm font-medium text-brand-black mb-2">
                    Helmet Worn
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => update('worn', true)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-all duration-200 ${
                        form.worn === true
                          ? 'bg-brand-green text-white border-brand-green shadow-md'
                          : 'bg-white text-brand-black border-brand-gray-border hover:bg-brand-green-light hover:border-brand-green/40'
                      }`}
                    >
                      <CircleCheck className="w-4 h-4" />
                      Worn
                    </button>
                    <button
                      onClick={() => update('worn', false)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-all duration-200 ${
                        form.worn === false
                          ? 'bg-red-500 text-white border-red-500 shadow-md'
                          : 'bg-white text-brand-black border-brand-gray-border hover:bg-red-50 hover:border-red-300'
                      }`}
                    >
                      <CircleX className="w-4 h-4" />
                      Not Worn
                    </button>
                  </div>
                </div>

                {/* Alcohol slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-brand-black flex items-center gap-1.5">
                      <Wine className="w-4 h-4" />
                      Alcohol Level
                    </label>
                    <span
                      className={`text-lg font-bold transition-colors ${
                        Number(form.alcoholLevel) >= ALCOHOL_THRESHOLD
                          ? 'text-red-600'
                          : 'text-brand-green-dark'
                      }`}
                    >
                      {form.alcoholLevel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1023"
                    step="1"
                    value={form.alcoholLevel}
                    onChange={(e) => update('alcoholLevel', Number(e.target.value))}
                    className="w-full accent-brand-green cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-brand-gray mt-1">
                    <span>0 (sober)</span>
                    <span className="text-red-600 font-medium">400 (threshold)</span>
                    <span>1023</span>
                  </div>
                </div>

                {/* Battery slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-brand-black flex items-center gap-1.5">
                      <Battery className="w-4 h-4" />
                      Battery Level
                    </label>
                    <span
                      className={`text-lg font-bold transition-colors ${
                        Number(form.batteryLevel) < 20
                          ? 'text-brand-amber-dark'
                          : 'text-brand-green-dark'
                      }`}
                    >
                      {form.batteryLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.batteryLevel}
                    onChange={(e) => update('batteryLevel', Number(e.target.value))}
                    className="w-full accent-brand-green cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-brand-gray mt-1">
                    <span>0%</span>
                    <span className="text-brand-amber-dark font-medium">
                      20% (low)
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSend} loading={sending} className="flex-1">
                    <Send className="w-4 h-4" />
                    Send Test Data
                  </Button>
                  <Button variant="secondary" onClick={resetForm}>
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick presets — professional icon buttons */}
            <Card>
              <CardHeader
                icon={Sparkles}
                title="Quick Presets"
                subtitle="One-click test scenarios"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`
                        group relative flex flex-col items-start text-left
                        p-3 rounded-lg border-2 transition-all duration-200
                        ${preset.accent.bg}
                        ${isActive ? preset.accent.border : 'border-transparent'}
                        ${preset.accent.hover}
                        hover:shadow-md hover:-translate-y-0.5
                      `}
                    >
                      {/* Icon */}
                      <div
                        className={`
                          w-9 h-9 rounded-lg bg-white flex items-center justify-center
                          mb-2 shadow-sm transition-transform duration-200
                          ${!isActive && 'group-hover:scale-110'}
                        `}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] ${preset.accent.icon}`}
                        />
                      </div>

                      {/* Label */}
                      <span
                        className={`text-xs font-semibold ${preset.accent.title} leading-tight`}
                      >
                        {preset.label}
                      </span>

                      {/* Description */}
                      <span className="text-[10px] text-brand-gray mt-1 leading-tight">
                        {preset.description}
                      </span>

                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute top-2 right-2">
                          <CheckCircle
                            className={`w-3.5 h-3.5 ${preset.accent.icon}`}
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* RIGHT — Last result */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader
                icon={Shield}
                title="Last Result"
                subtitle="Backend response"
              />

              {!lastResult ? (
                <div className="text-center py-8">
                  <HardHat className="w-10 h-10 text-brand-gray mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-brand-gray">No data sent yet.</p>
                  <p className="text-xs text-brand-gray mt-1">
                    Click <strong>Send Test Data</strong> to see the response.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Decision */}
                  <div
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      lastResult.engineAllowed
                        ? 'bg-brand-green-light border-brand-green'
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <p className="text-xs font-medium text-brand-gray mb-1">
                      Engine Decision
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        lastResult.engineAllowed
                          ? 'text-brand-green-dark'
                          : 'text-red-600'
                      }`}
                    >
                      {lastResult.engineAllowed ? 'ALLOWED' : 'BLOCKED'}
                    </p>
                  </div>

                  {/* Gate checks */}
                  <div className="space-y-1.5">
                    <GateRow label="ID Match" ok={lastResult.idMatch} />
                    <GateRow label="Helmet Worn" ok={lastResult.isWorn} />
                    <GateRow label="Sober" ok={lastResult.isSober} />
                  </div>

                  {/* Violations */}
                  {lastResult.violations?.length > 0 && (
                    <div className="pt-2 border-t border-brand-gray-border">
                      <p className="text-xs font-medium text-brand-gray mb-2">
                        Violations Detected:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {lastResult.violations.map((v) => (
                          <Badge key={v} color="red">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="pt-2 border-t border-brand-gray-border">
                    <p className="text-[10px] text-brand-gray">
                      {new Date(lastResult.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================================================
// Gate row subcomponent
// ==================================================
function GateRow({ label, ok }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-brand-gray">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        {ok ? (
          <>
            <CheckCircle className="w-4 h-4 text-brand-green" />
            <span className="text-brand-green-dark">Pass</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-600">Fail</span>
          </>
        )}
      </span>
    </div>
  );
}