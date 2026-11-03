import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { loadAll, type AllData } from './db/repo';
import { computeXp, type XpSummary } from './domain/xp';

/** 全データ（DB が変わると自動で読み直す）。読み込み中は undefined */
export function useAllData(): AllData | undefined {
  return useLiveQuery(() => loadAll(), []);
}

export function useXp(data: AllData | undefined): XpSummary | undefined {
  return useMemo(
    () => (data ? computeXp(data.sets, data.sessions, data.exercises, data.settings) : undefined),
    [data],
  );
}

/** 数値を「20」「22.5」「0.65」のように表示（小数第2位まで） */
export function fmtNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}
