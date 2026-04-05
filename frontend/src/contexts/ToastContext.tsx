import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { border: 'rgba(26,111,212,0.5)', icon: '#3d8fe0', bg: 'rgba(26,111,212,0.12)' },
  error:   { border: 'rgba(239,68,68,0.5)',  icon: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  warning: { border: 'rgba(249,115,22,0.5)', icon: '#F97316', bg: 'rgba(249,115,22,0.10)' },
  info:    { border: 'rgba(26,111,212,0.4)', icon: '#1A6FD4', bg: 'rgba(26,111,212,0.08)' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error   = useCallback((msg: string) => toast(msg, 'error', 5000), [toast]);
  const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast]);
  const info    = useCallback((msg: string) => toast(msg, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '10px',
        maxWidth: '380px', width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          const colors = COLORS[t.type];
          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px',
                background: '#0D1B2A',
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${colors.icon}`,
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'slideInRight 0.25s ease',
                pointerEvents: 'auto',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: colors.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color={colors.icon} />
              </div>
              <p style={{
                flex: 1, fontSize: '13px', lineHeight: '1.5',
                color: '#E8EDF5', fontFamily: 'DM Sans, sans-serif',
                margin: 0, paddingTop: '6px',
              }}>
                {t.message}
              </p>
              <button
                onClick={() => remove(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a6070', padding: '4px', flexShrink: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
