import { describe, expect, it } from 'vitest';
import { DEFAULT_EXERCISES, DEFAULT_SETTINGS } from './defaults';
import { computeXp, effectiveLoad, estimate1Rm, setXp } from './xp';
import type { Rpe, Session, SetRecord, Settings } from './types';

const S = DEFAULT_SETTINGS;
const ex = (id: string) => DEFAULT_EXERCISES.find((e) => e.id === id)!;
let seq = 0;
const set = (p: Partial<SetRecord> & { exerciseId: string; sessionId?: string }): SetRecord => ({
  id: `set-${++seq}`,
  sessionId: 's1',
  weight: 20,
  reps: 10,
  setNo: 1,
  rpe: 8,
  note: '',
  createdAt: seq,
  ...p,
});
const session = (id: string, date: string): Session => ({ id, date, exerciseIds: [] });

describe('1セットの基本XP', () => {
  it('重量×回数÷10（RPE8 は係数1.0）', () => {
    expect(setXp(set({ exerciseId: 'db-press', weight: 20, reps: 10 }), ex('db-press'), S)).toBe(20);
  });

  it.each<[Rpe, number]>([
    [6, 12],
    [7, 16],
    [8, 20],
    [9, 24],
    [10, 28],
  ])('RPE%i の係数', (rpe, xp) => {
    expect(setXp(set({ exerciseId: 'db-press', weight: 20, reps: 10, rpe }), ex('db-press'), S)).toBe(xp);
  });

  it('小数第1位で四捨五入する', () => {
    // 17 × 7 ÷ 10 × 1.2 = 14.28 → 14.3
    expect(setXp(set({ exerciseId: 'db-press', weight: 17, reps: 7, rpe: 9 }), ex('db-press'), S)).toBe(14.3);
    // 13 × 5 ÷ 10 × 0.8 = 5.2
    expect(setXp(set({ exerciseId: 'db-press', weight: 13, reps: 5, rpe: 7 }), ex('db-press'), S)).toBe(5.2);
  });

  it('回数0は0XP', () => {
    expect(setXp(set({ exerciseId: 'db-press', reps: 0 }), ex('db-press'), S)).toBe(0);
  });

  it('チンニング自重は体重79kgで計算', () => {
    const s = set({ exerciseId: 'chinning', weight: null, mode: 'bodyweight', reps: 3 });
    expect(effectiveLoad(s, ex('chinning'), S)).toBe(79);
    expect(setXp(s, ex('chinning'), S)).toBe(23.7);
  });

  it('チンニング補助ありは（体重−補助重量）', () => {
    const s = set({ exerciseId: 'chinning', weight: null, mode: 'assisted', assistWeight: 30, reps: 10 });
    expect(effectiveLoad(s, ex('chinning'), S)).toBe(49);
    expect(setXp(s, ex('chinning'), S)).toBe(49);
  });

  it('補助重量が体重より重くても負にならない', () => {
    const s = set({ exerciseId: 'chinning', weight: null, mode: 'assisted', assistWeight: 100, reps: 10 });
    expect(setXp(s, ex('chinning'), S)).toBe(0);
  });

  it('チンニングのネガティブは体重×ネガティブ係数（既定0.5）', () => {
    const s = set({ exerciseId: 'chinning', weight: null, mode: 'negative', reps: 5 });
    expect(effectiveLoad(s, ex('chinning'), S)).toBe(39.5);
    expect(setXp(s, ex('chinning'), S)).toBe(19.8); // 19.75 → 19.8
  });

  it('腕立て伏せは体重×0.65', () => {
    const s = set({ exerciseId: 'push-up', weight: null, reps: 10 });
    expect(setXp(s, ex('push-up'), S)).toBe(51.4); // 79×0.65=51.35 → 51.35
  });

  it('体重を変えると自重種目のXPが変わる', () => {
    const s = set({ exerciseId: 'chinning', weight: null, mode: 'bodyweight', reps: 10 });
    expect(setXp(s, ex('chinning'), { ...S, bodyWeight: 70 })).toBe(70);
  });
});

describe('推定1RM（Epley）', () => {
  it('重量×(1+回数÷30)', () => {
    expect(estimate1Rm(60, 10)).toBeCloseTo(80);
    expect(estimate1Rm(100, 1)).toBeCloseTo(103.333, 2);
  });
  it('回数0・重量0は0', () => {
    expect(estimate1Rm(60, 0)).toBe(0);
    expect(estimate1Rm(0, 10)).toBe(0);
  });
});

describe('累計XPとボーナス', () => {
  it('初挑戦ボーナスは種目ごとに最初の日だけ', () => {
    const sessions = [session('a', '2026-11-02'), session('b', '2026-11-09')];
    const sets = [
      set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10 }),
      set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10, setNo: 2 }),
      set({ sessionId: 'b', exerciseId: 'db-press', weight: 20, reps: 10 }),
    ];
    const r = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
    expect(r.sessions[0].bonuses).toEqual([{ type: 'firstTry', exerciseId: 'db-press', xp: 50 }]);
    expect(r.sessions[1].bonuses).toEqual([]);
    expect(r.total).toBe(20 + 20 + 50 + 20);
  });

  it('自己ベスト（推定1RM）更新で +100、同じ値では付かない', () => {
    const sessions = [session('a', '2026-11-02'), session('b', '2026-11-09'), session('c', '2026-11-16')];
    const sets = [
      set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10 }),
      set({ sessionId: 'b', exerciseId: 'db-press', weight: 20, reps: 10 }),
      set({ sessionId: 'c', exerciseId: 'db-press', weight: 20, reps: 11 }),
    ];
    const r = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
    expect(r.sessions[1].bonuses).toEqual([]);
    expect(r.sessions[2].bonuses).toEqual([{ type: 'personalBest', exerciseId: 'db-press', xp: 100 }]);
  });

  it('自己ベストは1日1種目1回まで', () => {
    const sessions = [session('a', '2026-11-02'), session('b', '2026-11-09')];
    const sets = [
      set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10 }),
      set({ sessionId: 'b', exerciseId: 'db-press', weight: 22, reps: 10 }),
      set({ sessionId: 'b', exerciseId: 'db-press', weight: 24, reps: 10, setNo: 2 }),
    ];
    const r = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
    expect(r.sessions[1].bonuses.filter((b) => b.type === 'personalBest')).toHaveLength(1);
  });

  it('週3回達成で +200（週1回だけ、月曜始まり）', () => {
    // 2026-11-02 は月曜
    const days = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-08', '2026-11-09'];
    const sessions = days.map((d, i) => session(`s${i}`, d));
    const sets = sessions.map((s) => set({ sessionId: s.id, exerciseId: 'db-curl', weight: 10, reps: 10 }));
    const r = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
    const quest = r.sessions.map((s) => s.bonuses.some((b) => b.type === 'weeklyQuest'));
    expect(quest).toEqual([false, false, true, false, false]);
  });

  it('記録のないセッションは数えない', () => {
    const sessions = [session('a', '2026-11-02'), session('b', '2026-11-03'), session('c', '2026-11-04')];
    const sets = [
      set({ sessionId: 'a', exerciseId: 'db-curl' }),
      set({ sessionId: 'c', exerciseId: 'db-curl' }),
    ];
    const r = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
    expect(r.sessions).toHaveLength(2);
    expect(r.sessions.some((s) => s.bonuses.some((b) => b.type === 'weeklyQuest'))).toBe(false);
  });

  it('部位ごとの累計XPに基本XPと種目ボーナスが入る', () => {
    const sessions = [session('a', '2026-11-02')];
    const sets = [
      set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10 }),
      set({ sessionId: 'a', exerciseId: 'db-squat', weight: 20, reps: 10 }),
    ];
    const r = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
    expect(r.byCategory.chest).toBe(70);
    expect(r.byCategory.legs).toBe(70);
    expect(r.byCategory.back).toBe(0);
  });

  it('係数を変えると記録から再計算される', () => {
    const sessions = [session('a', '2026-11-02')];
    const sets = [set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10, rpe: 8 })];
    const custom: Settings = {
      ...S,
      rpeFactors: { ...S.rpeFactors, 8: 2 },
      bonus: { ...S.bonus, firstTry: 0 },
    };
    expect(computeXp(sets, sessions, DEFAULT_EXERCISES, custom).total).toBe(40);
  });

  it('削除された種目の記録は無視する', () => {
    const sessions = [session('a', '2026-11-02')];
    const sets = [set({ sessionId: 'a', exerciseId: 'no-such' })];
    expect(computeXp(sets, sessions, DEFAULT_EXERCISES, S).total).toBe(0);
  });
});
