'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showHandle?: boolean;
  bottomOffset?: string;
}

export default function BottomSheet({ isOpen, onClose, title, children, maxHeight = '85vh', showHandle = true, bottomOffset = '0px' }: Props) {
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

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div style={{
        position: 'fixed', bottom: bottomOffset, left: 0, right: 0, zIndex: 50,
        background: 'white', borderRadius: '20px 20px 0 0',
        maxHeight,
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
}
