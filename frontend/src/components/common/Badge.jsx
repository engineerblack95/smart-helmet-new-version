// ==================================================
// Badge Component
// ==================================================

export default function Badge({ children, color = 'gray', className = '' }) {
  const colors = {
    green: 'bg-brand-green-light text-brand-green-dark border-brand-green/30',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    black: 'bg-brand-black text-white border-brand-black',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}