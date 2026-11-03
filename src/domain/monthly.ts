// 月のまとめ。記録から毎回計算する。
import type { Exercise, Session, SetRecord, Settings } from './types';
import type { AchievementDef, AchievementStatus } from './achievements';
import { effectiveLoad, round1, type XpSummary } from './xp';

export interface MonthSummary {
  /** YYYY-MM */
  month: string;
  days: number;
  sets: number;
  /** ボリューム（kg） */
  volume: number;
  xp: number;
  pbCount: number;
  achievements: AchievementDef[];
  /** 一番多くやった種目（セット数） */
  top?: { name: string; sets: number };
}

export const monthOf = (date: string) => date.slice(0, 7);

/** 前の月（YYYY-MM） */
export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** 例：2026-10 → 2026年10月 */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${y}年${m}月`;
}

/** 記録のある月（新しい順） */
export function monthsWithRecords(xp: XpSummary): string[] {
  return [...new Set(xp.sessions.map((s) => monthOf(s.date)))].sort().reverse();
}

export function monthSummary(
  month: string,
  sets: SetRecord[],
  sessions: Session[],
  exercises: Exercise[],
  settings: Settings,
  xp: XpSummary,
  achievements: AchievementStatus[],
): MonthSummary {
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const inMonth = new Set(sessions.filter((s) => monthOf(s.date) === month).map((s) => s.id));
  const monthSets = sets.filter((s) => inMonth.has(s.sessionId) && exMap.has(s.exerciseId));
  const monthXp = xp.sessions.filter((s) => monthOf(s.date) === month);

  const perEx = new Map<string, number>();
  let volume = 0;
  for (const s of monthSets) {
    perEx.set(s.exerciseId, (perEx.get(s.exerciseId) ?? 0) + 1);
    volume += effectiveLoad(s, exMap.get(s.exerciseId)!, settings) * s.reps;
  }
  const topId = [...perEx].sort((a, b) => b[1] - a[1])[0];

  return {
    month,
    days: monthXp.length,
    sets: monthSets.length,
    volume: Math.round(volume),
    xp: round1(monthXp.reduce((a, s) => a + s.total, 0)),
    pbCount: monthXp.reduce((a, s) => a + s.bonuses.filter((b) => b.type === 'personalBest').length, 0),
    achievements: achievements.filter((a) => a.achievedDate && monthOf(a.achievedDate) === month).map((a) => a.def),
    top: topId ? { name: exMap.get(topId[0])!.name, sets: topId[1] } : undefined,
  };
}
