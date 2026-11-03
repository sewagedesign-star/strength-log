import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { playTimerEnd } from '../sound';
import styles from './RestTimer.module.css';

interface Timer {
  /** 終わる時刻（ミリ秒）。残り時間は時刻から計算するので、画面を消していてもずれない */
  endAt: number;
  label: string;
  sound: boolean;
  /** 時間になって知らせたか */
  notified: boolean;
}

interface RestTimerApi {
  timer: Timer | null;
  /** 残り秒（0 なら終了） */
  remaining: number;
  start: (sec: number, label: string, sound: boolean) => void;
  add: (sec: number) => void;
  stop: () => void;
}

const Ctx = createContext<RestTimerApi | null>(null);

export function useRestTimer(): RestTimerApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('RestTimerProvider がありません');
  return api;
}

/** 終わってからこの時間がたったら、帯を自動で消す */
const HIDE_AFTER_MS = 60_000;
/** アプリに戻ったときに大きく過ぎていたら、音は鳴らさない */
const LATE_MS = 5_000;

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!timer) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [timer]);

  useEffect(() => {
    if (!timer) return;
    if (!timer.notified && now >= timer.endAt) {
      if (timer.sound && now - timer.endAt < LATE_MS) playTimerEnd();
      setTimer({ ...timer, notified: true });
    } else if (timer.notified && now - timer.endAt > HIDE_AFTER_MS) {
      setTimer(null);
    }
  }, [now, timer]);

  const start = useCallback((sec: number, label: string, sound: boolean) => {
    const t = Date.now();
    setNow(t);
    setTimer({ endAt: t + sec * 1000, label, sound, notified: false });
  }, []);
  const add = useCallback((sec: number) => {
    setTimer((cur) => {
      if (!cur) return cur;
      const base = Math.max(cur.endAt, Date.now());
      return { ...cur, endAt: base + sec * 1000, notified: false };
    });
  }, []);
  const stop = useCallback(() => setTimer(null), []);

  const remaining = timer ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : 0;
  const api = useMemo(() => ({ timer, remaining, start, add, stop }), [timer, remaining, start, add, stop]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** 休憩タイマーの帯（タブのすぐ上、入力シートの中にも出す） */
export function RestTimerBar({ compact }: { compact?: boolean }) {
  const { timer, remaining, add, stop } = useRestTimer();
  if (!timer) return null;
  const done = remaining === 0;

  return (
    <div className={`${styles.bar} ${compact ? styles.compact : ''} ${done ? styles.done : ''}`} role="timer" aria-live={done ? 'assertive' : 'off'}>
      <div className={styles.info}>
        <span className={styles.label}>{done ? '休憩終了！' : '休憩'}</span>
        <span className={styles.time}>{done ? '次のセットへ' : mmss(remaining)}</span>
        {!compact && <span className={styles.ex}>{timer.label}</span>}
      </div>
      <button type="button" className={styles.btn} onClick={() => add(30)}>
        ＋30秒
      </button>
      <button type="button" className={styles.btn} onClick={stop}>
        {done ? '閉じる' : '終了'}
      </button>
    </div>
  );
}
