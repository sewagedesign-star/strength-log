// グラフ用の集計。記録（SetRecord）から毎回計算する。
import type { Category, Exercise, Session, SetRecord, Settings } from './types';
import { CATEGORIES } from './types';
import { toDateKey, weekStart } from './date';
import { effectiveLoad, estimate1Rm, round1, setXp, type XpSummary } from './xp';

/** 推定1RM／最大重量／ボリューム／最大回数／補助重量（少ないほど上達） */
export type Metric = 'e1rm' | 'maxWeight' | 'volume' | 'maxReps' | 'assist';

export const METRIC_LABEL: Record<Metric, string> = {
  e1rm: '推定1RM',
  maxWeight: '最大重量',
  volume: 'ボリューム',
  maxReps: '最大回数',
  assist: '補助重量',
};
export const METRIC_UNIT: Record<Metric, string> = {
  e1rm: 'kg',
  maxWeight: 'kg',
  volume: 'kg',
  maxReps: '回',
  assist: 'kg',
};

/** その種目で選べる指標 */
export function metricsFor(ex: Exercise): Metric[] {
  if (ex.isAssisted) return ['assist', 'maxReps'];
  if (ex.isBodyweight) return ['maxReps'];
  return ['e1rm', 'maxWeight', 'volume'];
}

export interface Point {
  date: string;
  value: number;
  /** それまでの記録を上回った日（補助重量は下回った日）。最初の日は付けない */
  best: boolean;
}

/** 種目・指標ごとの日別の値（古い順） */
export function exerciseSeries(
  exercise: Exercise,
  metric: Metric,
  sets: SetRecord[],
  sessions: Session[],
  settings: Settings,
): Point[] {
  const dateOf = new Map(sessions.map((s) => [s.id, s.date]));
  const byDate = new Map<string, number>();

  for (const s of sets) {
    if (s.exerciseId !== exercise.id) continue;
    const date = dateOf.get(s.sessionId);
    if (!date) continue;
    let v: number | null = null;
    switch (metric) {
      case 'e1rm':
        v = estimate1Rm(effectiveLoad(s, exercise, settings), s.reps);
        break;
      case 'maxWeight':
        v = s.weight ?? null;
        break;
      case 'volume':
        v = effectiveLoad(s, exercise, settings) * s.reps;
        break;
      case 'maxReps':
        // チンニングは補助なし（自重）のセットだけ
        v = exercise.isAssisted && s.mode !== 'bodyweight' ? null : s.reps;
        break;
      case 'assist':
        v = s.mode === 'assisted' ? (s.assistWeight ?? 0) : null;
        break;
    }
    if (v === null) continue;
    const prev = byDate.get(date);
    if (metric === 'volume') byDate.set(date, (prev ?? 0) + v);
    else if (metric === 'assist') byDate.set(date, prev === undefined ? v : Math.min(prev, v));
    else byDate.set(date, prev === undefined ? v : Math.max(prev, v));
  }

  const points: Point[] = [];
  let record: number | undefined;
  for (const date of [...byDate.keys()].sort()) {
    const value = round1(byDate.get(date)!);
    const best = record !== undefined && (metric === 'assist' ? value < record : value > record);
    if (record === undefined || best) record = value;
    points.push({ date, value, best });
  }
  return points;
}

export type Period = '1m' | '3m' | '1y' | 'all';
export const PERIOD_LABEL: Record<Period, string> = { '1m': '1か月', '3m': '3か月', '1y': '1年', all: '全部' };

/** 期間の始まりの日（YYYY-MM-DD）。全部なら null */
export function periodStart(period: Period, today: string): string | null {
  if (period === 'all') return null;
  const [y, m, d] = today.split('-').map(Number);
  const months = period === '1m' ? 1 : period === '3m' ? 3 : 12;
  return toDateKey(new Date(y, m - 1 - months, d));
}

export type WeekPart = Category | 'bonus';
export const WEEK_PARTS: WeekPart[] = [...CATEGORIES, 'bonus'];

export interface WeekXp {
  /** 週の月曜日 */
  week: string;
  parts: Record<WeekPart, number>;
  total: number;
}

const emptyParts = (): Record<WeekPart, number> => ({ chest: 0, back: 0, armsShoulders: 0, legs: 0, other: 0, bonus: 0 });

/** 週ごとのXP（部位別＋ボーナス）。from の週から today の週まで、記録のない週も 0 で埋める */
export function weeklyXp(
  sets: SetRecord[],
  sessions: Session[],
  exercises: Exercise[],
  settings: Settings,
  xp: XpSummary,
  from: string | null,
  today: string,
): WeekXp[] {
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const dateOf = new Map(sessions.map((s) => [s.id, s.date]));
  const weeks = new Map<string, Record<WeekPart, number>>();
  const add = (date: string, part: WeekPart, v: number) => {
    const wk = weekStart(date);
    const p = weeks.get(wk) ?? emptyParts();
    p[part] += v;
    weeks.set(wk, p);
  };

  for (const s of sets) {
    const ex = exMap.get(s.exerciseId);
    const date = dateOf.get(s.sessionId);
    if (ex && date) add(date, ex.category, setXp(s, ex, settings));
  }
  for (const s of xp.sessions) {
    const bonus = s.bonuses.reduce((a, b) => a + b.xp, 0);
    if (bonus) add(s.date, 'bonus', bonus);
  }

  const dates = [...weeks.keys()].sort();
  let first = from ? weekStart(from) : dates[0];
  if (!first) return [];
  const last = weekStart(today);
  if (first > last) first = last;

  const result: WeekXp[] = [];
  const [y, m, d] = first.split('-').map(Number);
  for (let cur = new Date(y, m - 1, d); toDateKey(cur) <= last; cur.setDate(cur.getDate() + 7)) {
    const week = toDateKey(cur);
    const parts = weeks.get(week) ?? emptyParts();
    for (const k of WEEK_PARTS) parts[k] = round1(parts[k]);
    result.push({ week, parts, total: round1(WEEK_PARTS.reduce((a, k) => a + parts[k], 0)) });
  }
  return result;
}
