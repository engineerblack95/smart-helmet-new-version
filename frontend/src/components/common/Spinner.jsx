// ==================================================
// Spinner Component
// ==================================================

import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 'md', fullScreen = false, label }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} text-brand-green animate-spin`} />
      {label && <p className="text-sm text-brand-gray">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-white">{spinner}</div>;
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}