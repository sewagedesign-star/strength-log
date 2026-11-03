import { describe, expect, it } from 'vitest';
import { DEFAULT_EXERCISES, DEFAULT_SETTINGS } from './defaults';
import { exerciseSeries, metricsFor, periodStart, weeklyXp } from './stats';
import { computeXp } from './xp';
import type { Session, SetRecord } from './types';

const S = DEFAULT_SETTINGS;
const ex = (id: string) => DEFAULT_EXERCISES.find((e) => e.id === id)!;
let seq = 0;
const set = (p: Partial<SetRecord> & { exerciseId: string; sessionId: string }): SetRecord => ({
  id: `s${++seq}`, weight: 20, reps: 10, setNo: 1, rpe: 8, note: '', createdAt: seq, ...p,
});
const sessions: Session[] = [
  { id: 'a', date: '2026-11-02', exerciseIds: [] },
  { id: 'b', date: '2026-11-05', exerciseIds: [] },
  { id: 'c', date: '2026-11-12', exerciseIds: [] },
];

describe('種目ごとの推移', () => {
  it('選べる指標は種目の種類で変わる', () => {
    expect(metricsFor(ex('db-press'))).toEqual(['e1rm', 'maxWeight', 'volume']);
    expect(metricsFor(ex('chinning'))).toEqual(['assist', 'maxReps']);
    expect(metricsFor(ex('push-up'))).toEqual(['maxReps']);
  });

  const sets = [
    set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10 }),
    set({ sessionId: 'a', exerciseId: 'db-press', weight: 22, reps: 6 }),
    set({ sessionId: 'b', exerciseId: 'db-press', weight: 20, reps: 8 }),
    set({ sessionId: 'c', exerciseId: 'db-press', weight: 24, reps: 8 }),
    set({ sessionId: 'c', exerciseId: 'db-fly', weight: 10, reps: 10 }),
  ];

  it('推定1RMはその日の最大、上回った日に印', () => {
    const p = exerciseSeries(ex('db-press'), 'e1rm', sets, sessions, S);
    // 20×(1+10/30)=26.7、22×1.2=26.4 → 26.7 / 20×(1+8/30)=25.3 / 24×(1+8/30)=30.4
    expect(p).toEqual([
      { date: '2026-11-02', value: 26.7, best: false },
      { date: '2026-11-05', value: 25.3, best: false },
      { date: '2026-11-12', value: 30.4, best: true },
    ]);
  });

  it('最大重量とボリューム', () => {
    expect(exerciseSeries(ex('db-press'), 'maxWeight', sets, sessions, S).map((p) => p.value)).toEqual([22, 20, 24]);
    expect(exerciseSeries(ex('db-press'), 'volume', sets, sessions, S).map((p) => p.value)).toEqual([332, 160, 192]);
  });

  it('チンニング：補助重量は日の最小、減ったら印。最大回数は補助なしだけ', () => {
    const chin = [
      set({ sessionId: 'a', exerciseId: 'chinning', weight: null, mode: 'assisted', assistWeight: 30, reps: 8 }),
      set({ sessionId: 'a', exerciseId: 'chinning', weight: null, mode: 'assisted', assistWeight: 25, reps: 5 }),
      set({ sessionId: 'b', exerciseId: 'chinning', weight: null, mode: 'assisted', assistWeight: 20, reps: 5 }),
      set({ sessionId: 'b', exerciseId: 'chinning', weight: null, mode: 'negative', reps: 5 }),
      set({ sessionId: 'c', exerciseId: 'chinning', weight: null, mode: 'bodyweight', reps: 2 }),
    ];
    expect(exerciseSeries(ex('chinning'), 'assist', chin, sessions, S)).toEqual([
      { date: '2026-11-02', value: 25, best: false },
      { date: '2026-11-05', value: 20, best: true },
    ]);
    expect(exerciseSeries(ex('chinning'), 'maxReps', chin, sessions, S)).toEqual([{ date: '2026-11-12', value: 2, best: false }]);
  });

  it('期間の始まり', () => {
    expect(periodStart('1m', '2026-11-03')).toBe('2026-10-03');
    expect(periodStart('3m', '2026-01-15')).toBe('2025-10-15');
    expect(periodStart('1y', '2026-11-03')).toBe('2025-11-03');
    expect(periodStart('all', '2026-11-03')).toBeNull();
  });
});

describe('週ごとのXP', () => {
  const sets = [
    set({ sessionId: 'a', exerciseId: 'db-press', weight: 20, reps: 10 }), // 胸 20 + 初挑戦 50
    set({ sessionId: 'b', exerciseId: 'db-squat', weight: 10, reps: 10 }), // 脚 10 + 初挑戦 50
    set({ sessionId: 'c', exerciseId: 'db-press', weight: 20, reps: 10 }), // 胸 20
  ];
  const xp = computeXp(sets, sessions, DEFAULT_EXERCISES, S);

  it('部位別とボーナスに分け、合計は累計XPと一致', () => {
    const w = weeklyXp(sets, sessions, DEFAULT_EXERCISES, S, xp, null, '2026-11-12');
    expect(w.map((x) => x.week)).toEqual(['2026-11-02', '2026-11-09']);
    expect(w[0].parts).toMatchObject({ chest: 20, legs: 10, bonus: 100 });
    expect(w[1].parts).toMatchObject({ chest: 20, bonus: 0 });
    expect(w.reduce((a, x) => a + x.total, 0)).toBe(xp.total);
  });

  it('記録の始まる前の週は出さず、今日の週まで記録のない週も0で埋める', () => {
    const w = weeklyXp(sets, sessions, DEFAULT_EXERCISES, S, xp, '2026-10-20', '2026-11-25');
    expect(w.map((x) => x.week)).toEqual(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23']);
    expect(w[3].total).toBe(0);
  });

  it('期間の始まりが記録より後なら、その週から', () => {
    const w = weeklyXp(sets, sessions, DEFAULT_EXERCISES, S, xp, '2026-11-10', '2026-11-12');
    expect(w.map((x) => x.week)).toEqual(['2026-11-09']);
  });

  it('記録がなければ空', () => {
    expect(weeklyXp([], [], DEFAULT_EXERCISES, S, computeXp([], [], DEFAULT_EXERCISES, S), null, '2026-11-03')).toEqual([]);
  });
});
