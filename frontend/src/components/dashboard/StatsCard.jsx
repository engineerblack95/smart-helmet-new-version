export default function StatsCard({ title, value, icon: Icon, tone = 'green', hint }) {
  const tones = {
    green: { bg: 'bg-brand-green-light', icon: 'text-brand-green-dark', value: 'text-brand-black' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-600' },
    gray: { bg: 'bg-gray-100', icon: 'text-gray-600', value: 'text-brand-black' },
  };
  const t = tones[tone] || tones.green;

  return (
    <div className="bg-white border border-brand-gray-border rounded-xl shadow-soft p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-brand-gray mb-1">{title}</p>
          <p className={`text-3xl font-bold ${t.value}`}>{value ?? '—'}</p>
          {hint && <p className="text-xs text-brand-gray mt-1">{hint}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${t.icon}`} />
        </div>
      </div>
    </div>
  );
}