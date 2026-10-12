// ==================================================
// Card Component
// ==================================================

export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`bg-white border border-brand-gray-border rounded-xl shadow-soft ${
        padding ? 'p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-brand-green-dark" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-brand-black">{title}</h3>
          {subtitle && <p className="text-sm text-brand-gray mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}