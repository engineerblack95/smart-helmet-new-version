// ==================================================
// Modal Component
// ==================================================

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizes[size]} bg-white rounded-xl shadow-xl border border-brand-gray-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-brand-gray-border">
          <h2 className="text-lg font-semibold text-brand-black">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-brand-gray-light text-brand-gray hover:text-brand-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-brand-gray-border bg-brand-gray-light/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}