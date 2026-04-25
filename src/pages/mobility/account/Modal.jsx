import { useEffect } from 'react';
import { X } from 'lucide-react';

const ACCENT = '#8D3B9D';

export default function Modal({ open, onClose, title, children, footer, maxWidth = 480 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(13,7,32,0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '8vh', paddingBottom: '4vh', overflowY: 'auto',
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 14, width: '90%', maxWidth,
          boxShadow: '0 14px 40px rgba(13,7,32,0.18)',
          fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #ECEAF3' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F0A1E', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '18px 22px' }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 22px', borderTop: '1px solid #ECEAF3', background: '#FAF8FD', borderRadius: '0 0 14px 14px' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const modalInputStyle = (disabled) => ({
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  border: '1px solid #ECEAF3',
  borderRadius: 8,
  background: disabled ? '#F9F8FC' : 'white',
  color: '#0F0A1E',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
});

export const modalLabelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 5 };

export const primaryBtn = (busy) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', background: ACCENT, color: 'white',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
  fontFamily: 'inherit',
});

export const secondaryBtn = {
  padding: '8px 14px', background: 'white', border: '1px solid #ECEAF3',
  borderRadius: 8, fontSize: 13, color: '#6B7280', cursor: 'pointer',
  fontFamily: 'inherit',
};
