import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';

export interface ToastMessage {
  title: string;
  lines?: string[];
}

/** 画面中央に大きく出すお祝いのカード（レベルアップ・実績・目標達成） */
export interface Celebration {
  kind: 'level' | 'achievement' | 'goal';
  icon: string;
  /** 上の小さな見出し（例：LEVEL UP!） */
  label: string;
  title: string;
  lines?: string[];
  tier?: 'bronze' | 'silver' | 'gold';
}

const ToastContext = createContext<(m: ToastMessage) => void>(() => {});
const CelebrateContext = createContext<(items: Celebration[]) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function useCelebrate() {
  return useContext(CelebrateContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<(ToastMessage & { key: number }) | null>(null);
  const [queue, setQueue] = useState<Celebration[]>([]);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((m: ToastMessage) => {
    window.clearTimeout(timer.current);
    setMsg({ ...m, key: Date.now() });
    timer.current = window.setTimeout(() => setMsg(null), 2200);
  }, []);

  const celebrate = useCallback((items: Celebration[]) => {
    if (items.length) setQueue((q) => [...q, ...items]);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const cur = queue[0];

  return (
    <ToastContext.Provider value={show}>
      <CelebrateContext.Provider value={celebrate}>
        {children}
        {msg && (
          <div key={msg.key} className={styles.toast} role="status" onClick={() => setMsg(null)}>
            <div className={styles.title}>{msg.title}</div>
            {msg.lines?.map((l) => (
              <div key={l} className={styles.line}>
                {l}
              </div>
            ))}
          </div>
        )}
        {cur && (
          <div className={styles.overlay} onClick={() => setQueue((q) => q.slice(1))}>
            <div
              key={queue.length + cur.title}
              className={`${styles.card} ${styles[cur.kind] ?? ''} ${cur.tier ? styles[cur.tier] : ''}`}
              role="alertdialog"
              aria-label={`${cur.label} ${cur.title}`}
            >
              <div className={styles.label}>{cur.label}</div>
              <div className={styles.icon} aria-hidden="true">
                {cur.icon}
              </div>
              <div className={styles.cardTitle}>{cur.title}</div>
              {cur.lines?.map((l) => (
                <div key={l} className={styles.cardLine}>
                  {l}
                </div>
              ))}
              <div className={styles.tap}>{queue.length > 1 ? `タップで次へ（あと${queue.length - 1}つ）` : 'タップで閉じる'}</div>
            </div>
          </div>
        )}
      </CelebrateContext.Provider>
    </ToastContext.Provider>
  );
}
