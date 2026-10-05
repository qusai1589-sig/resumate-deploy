import { useEffect } from 'react';
import { Info, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <aside 
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 3000,
        background: '#1e293b',
        color: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        maxWidth: '380px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <Info size={20} color="#818cf8" style={{ flexShrink: 0 }} />
      <div style={{ fontSize: '0.875rem', lineHeight: '1.4', flex: 1 }}>
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center'
        }}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </aside>
  );
}
