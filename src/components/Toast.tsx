import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';

export interface ToastMessage {
  title: string;
  lines?: string[];
  /** レベルアップ時は大きく・長めに表示する */
  levelUp?: boolean;
}

const ToastContext = createContext<(m: ToastMessage) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<(ToastMessage & { key: number }) | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((m: ToastMessage) => {
    window.clearTimeout(timer.current);
    setMsg({ ...m, key: Date.now() });
    timer.current = window.setTimeout(() => setMsg(null), m.levelUp ? 4000 : 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div
          key={msg.key}
          className={`${styles.toast} ${msg.levelUp ? styles.levelUp : ''}`}
          role="status"
          onClick={() => setMsg(null)}
        >
          {msg.levelUp && <div className={styles.badge}>LEVEL UP!</div>}
          <div className={styles.title}>{msg.title}</div>
          {msg.lines?.map((l) => (
            <div key={l} className={styles.line}>
              {l}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
