import { ALCOHOL_THRESHOLD } from '../../utils/constants.js';

export default function AlcoholGauge({ level = 0, threshold = ALCOHOL_THRESHOLD }) {
  const max = 1023;
  const percent = Math.min((level / max) * 100, 100);
  const thresholdPercent = (threshold / max) * 100;
  const isOver = level >= threshold;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-brand-black">Alcohol Level</span>
        <span className={`text-2xl font-bold ${isOver ? 'text-red-600' : 'text-brand-green-dark'}`}>
          {level}
        </span>
      </div>

      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-brand-green'}`}
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-brand-black"
          style={{ left: `${thresholdPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-brand-gray">
        <span>0</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-brand-black" />
          Threshold: {threshold}
        </span>
        <span>{max}</span>
      </div>

      <p className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-brand-green-dark'}`}>
        {isOver ? 'Alcohol detected — engine blocked' : 'Sober — within safe limit'}
      </p>
    </div>
  );
}