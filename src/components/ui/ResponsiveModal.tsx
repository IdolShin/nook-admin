'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
  showHandle?: boolean;
}

export default function ResponsiveModal({ isOpen, onClose, title, children, maxWidth = 480, showHandle = true }: Props) {
  const { isPhone } = useBreakpoint();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isPhone) {
    return (
      <>
        <div className="modal-backdrop" onClick={onClose} />
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'white', borderRadius: '20px 20px 0 0',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.16)',
        }}>
          {showHandle && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: '#E0E1E6' }} />
            </div>
          )}
          {title && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F0F0F2', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
              <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}>
                <X size={18} color="#5C5F66" />
              </button>
            </div>
          )}
          {children}
          <div style={{ height: 'env(safe-area-inset-bottom)', flexShrink: 0 }} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 50, width: `min(${maxWidth}px, 90vw)`, maxHeight: '88vh',
        background: 'white', borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
        border: '1px solid #EBEBEB',
      }}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F0F0F2', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
            <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6 }}>
              <X size={14} color="#5C5F66" />
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
