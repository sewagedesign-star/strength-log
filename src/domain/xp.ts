import type { Category, Exercise, Session, SetRecord, Settings } from './types';
import { weekStart } from './date';

/** 小数第1位で四捨五入（51.35 のような浮動小数の誤差を先に丸めてから） */
export const round1 = (x: number) => Math.round(Number((x * 10).toPrecision(12))) / 10;

/** 1セットの負荷（kg）。自重種目は体重×係数、補助ありは（体重−補助重量）×係数 */
export function effectiveLoad(set: SetRecord, ex: Exercise, settings: Settings): number {
  const bw = settings.bodyWeight;
  if (ex.isAssisted) {
    switch (set.mode) {
      case 'assisted':
        return Math.max(0, bw - (set.assistWeight ?? 0)) * ex.bodyweightRatio;
      case 'negative':
        return bw * settings.negativeRatio;
      default:
        return bw * ex.bodyweightRatio;
    }
  }
  if (ex.isBodyweight) return bw * ex.bodyweightRatio;
  return set.weight ?? 0;
}

/** 1セットの基本XP = 負荷 × 回数 ÷ 10 × RPE係数（小数第1位で四捨五入） */
export function setXp(set: SetRecord, ex: Exercise, settings: Settings): number {
  const factor = settings.rpeFactors[set.rpe] ?? 1;
  return round1((effectiveLoad(set, ex, settings) * set.reps) / 10 * factor);
}

/** 推定1RM（Epley式）= 重量 ×（1 + 回数 ÷ 30）。回数0は0 */
export function estimate1Rm(load: number, reps: number): number {
  if (reps <= 0 || load <= 0) return 0;
  return load * (1 + reps / 30);
}

export type BonusType = 'firstTry' | 'personalBest' | 'weeklyQuest';
export const BONUS_LABEL: Record<BonusType, string> = {
  firstTry: '初挑戦',
  personalBest: '自己ベスト',
  weeklyQuest: '週間クエスト達成',
};

export interface Bonus {
  type: BonusType;
  exerciseId?: string;
  xp: number;
}

export interface SessionXp {
  sessionId: string;
  date: string;
  base: number;
  bonuses: Bonus[];
  total: number;
}

export interface XpSummary {
  total: number;
  /** 部位ごとの累計XP（基本XP＋その種目のボーナス） */
  byCategory: Record<Category, number>;
  sessions: SessionXp[];
}

/**
 * 全記録から累計XPを計算する。
 * - 初挑戦：その種目を初めて記録した日に +firstTry
 * - 自己ベスト：その日の推定1RMの最大が、それより前の日の最大を超えたら +personalBest（初挑戦の日は除く）
 * - 週間クエスト：記録した日が週（月曜始まり）に weeklyDays 日に達した日に +weeklyQuest（週1回）
 */
export function computeXp(
  sets: SetRecord[],
  sessions: Session[],
  exercises: Exercise[],
  settings: Settings,
): XpSummary {
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const byCategory: Record<Category, number> = { chest: 0, back: 0, armsShoulders: 0, legs: 0, other: 0 };

  const setsBySession = new Map<string, SetRecord[]>();
  for (const s of sets) {
    if (!exMap.has(s.exerciseId)) continue;
    const list = setsBySession.get(s.sessionId) ?? [];
    list.push(s);
    setsBySession.set(s.sessionId, list);
  }

  const ordered = sessions
    .filter((s) => setsBySession.has(s.id))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));

  const best = new Map<string, number>(); // 種目ごとのそれまでの最大推定1RM
  const daysInWeek = new Map<string, Set<string>>();
  const result: SessionXp[] = [];
  let total = 0;

  for (const session of ordered) {
    const list = setsBySession.get(session.id)!;
    let base = 0;
    const bonuses: Bonus[] = [];
    const dayBest = new Map<string, number>();

    for (const s of list) {
      const ex = exMap.get(s.exerciseId)!;
      const xp = setXp(s, ex, settings);
      base += xp;
      byCategory[ex.category] += xp;
      const rm = estimate1Rm(effectiveLoad(s, ex, settings), s.reps);
      dayBest.set(s.exerciseId, Math.max(dayBest.get(s.exerciseId) ?? 0, rm));
    }

    for (const [exerciseId, rm] of dayBest) {
      const ex = exMap.get(exerciseId)!;
      const prev = best.get(exerciseId);
      if (prev === undefined) {
        bonuses.push({ type: 'firstTry', exerciseId, xp: settings.bonus.firstTry });
        byCategory[ex.category] += settings.bonus.firstTry;
        best.set(exerciseId, rm);
      } else if (rm > prev + 1e-9) {
        bonuses.push({ type: 'personalBest', exerciseId, xp: settings.bonus.personalBest });
        byCategory[ex.category] += settings.bonus.personalBest;
        best.set(exerciseId, rm);
      }
    }

    const wk = weekStart(session.date);
    const days = daysInWeek.get(wk) ?? new Set<string>();
    const before = days.size;
    days.add(session.date);
    daysInWeek.set(wk, days);
    if (before < settings.bonus.weeklyDays && days.size === settings.bonus.weeklyDays) {
      bonuses.push({ type: 'weeklyQuest', xp: settings.bonus.weeklyQuest });
    }

    base = round1(base);
    const sessionTotal = round1(base + bonuses.reduce((a, b) => a + b.xp, 0));
    total = round1(total + sessionTotal);
    result.push({ sessionId: session.id, date: session.date, base, bonuses, total: sessionTotal });
  }

  for (const k of Object.keys(byCategory) as Category[]) byCategory[k] = round1(byCategory[k]);
  return { total, byCategory, sessions: result };
}
