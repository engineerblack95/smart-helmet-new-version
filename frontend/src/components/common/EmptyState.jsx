// ==================================================
// Empty State Component
// ==================================================

import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'Data will appear here once available.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-green-light flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-brand-green-dark" />
      </div>
      <h3 className="text-base font-semibold text-brand-black mb-1">{title}</h3>
      <p className="text-sm text-brand-gray max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}