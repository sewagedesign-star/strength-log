import { useEffect, type ReactNode } from 'react';
import styles from './Sheet.module.css';

interface Props {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** 画面中央のダイアログとして出す（既定は下からのシート） */
  center?: boolean;
}

/** 下から出る入力シート／確認ダイアログ */
export function Sheet({ title, onClose, children, center }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`${styles.overlay} ${center ? styles.center : ''}`} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

interface ConfirmProps {
  message: ReactNode;
  okLabel: string;
  danger?: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, okLabel, danger, onOk, onCancel }: ConfirmProps) {
  return (
    <Sheet title="確認" onClose={onCancel} center>
      <div className={styles.message}>{message}</div>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onCancel}>
          やめる
        </button>
        <button type="button" className={`btn ${danger ? styles.dangerOk : 'btn-primary'}`} onClick={onOk}>
          {okLabel}
        </button>
      </div>
    </Sheet>
  );
}
