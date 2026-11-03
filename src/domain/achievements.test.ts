import { describe, expect, it } from 'vitest';
import { DEFAULT_EXERCISES, DEFAULT_SETTINGS } from './defaults';
import { ACHIEVEMENTS, evaluateAchievements } from './achievements';
import { computeXp } from './xp';
import type { Session, SetRecord } from './types';

const S = DEFAULT_SETTINGS;
let seq = 0;
const set = (p: Partial<SetRecord> & { exerciseId: string; sessionId: string }): SetRecord => ({
  id: `s${++seq}`, weight: 20, reps: 10, setNo: 1, rpe: 8, note: '', createdAt: seq, ...p,
});

function run(sets: SetRecord[], sessions: Session[]) {
  const xp = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
  const list = evaluateAchievements(sets, sessions, DEFAULT_EXERCISES, S, xp);
  return Object.fromEntries(list.map((a) => [a.def.id, a]));
}

/** 2026-11-02（月）から n 日ぶん、毎日1件のセッション */
const days = (dates: string[]): Session[] => dates.map((date, i) => ({ id: `d${i}`, date, exerciseIds: [] }));

describe('実績', () => {
  it('24個あり、IDは重複しない', () => {
    expect(ACHIEVEMENTS).toHaveLength(24);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(24);
  });

  it('記録がなければ何も取れていない', () => {
    expect(Object.values(run([], [])).some((a) => a.achieved)).toBe(false);
  });

  it('初めての記録・初挑戦の日は自己ベストに数えない', () => {
    const r = run([set({ sessionId: 'd0', exerciseId: 'db-press' })], days(['2026-11-02']));
    expect(r['days-1']).toMatchObject({ achieved: true, achievedDate: '2026-11-02' });
    expect(r['pb-1'].achieved).toBe(false);
    expect(r['days-10']).toMatchObject({ achieved: false, current: 1 });
  });

  it('自己ベスト更新で取れる', () => {
    const r = run(
      [set({ sessionId: 'd0', exerciseId: 'db-press', weight: 20 }), set({ sessionId: 'd1', exerciseId: 'db-press', weight: 22 })],
      days(['2026-11-02', '2026-11-09']),
    );
    expect(r['pb-1']).toMatchObject({ achieved: true, achievedDate: '2026-11-09' });
  });

  it('週間クエストの連続は、間の週が空くと途切れる', () => {
    // 4週連続で週3日 → 1週あける → 1週
    const weeks = ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-12-07'];
    const dates = weeks.flatMap((w) => {
      const [y, m, d] = w.split('-').map(Number);
      return [0, 2, 4].map((k) => {
        const x = new Date(y, m - 1, d + k);
        return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      });
    });
    const sessions = days(dates);
    const sets = sessions.map((s) => set({ sessionId: s.id, exerciseId: 'db-curl', weight: 8 }));
    const r = run(sets, sessions);
    expect(r['quest-1']).toMatchObject({ achieved: true, achievedDate: '2026-11-06' });
    expect(r['quest-streak-4']).toMatchObject({ achieved: true, achievedDate: '2026-11-27' });
    expect(r['quest-streak-12']).toMatchObject({ achieved: false, current: 4 });
    expect(r['days-10']).toMatchObject({ achieved: true });
  });

  it('チンニングは補助なしの回数だけで判定', () => {
    const sessions = days(['2026-11-02', '2026-11-04']);
    const r = run(
      [
        set({ sessionId: 'd0', exerciseId: 'chinning', weight: null, mode: 'assisted', assistWeight: 20, reps: 10 }),
        set({ sessionId: 'd1', exerciseId: 'chinning', weight: null, mode: 'bodyweight', reps: 5 }),
      ],
      sessions,
    );
    expect(r['chin-1']).toMatchObject({ achieved: true, achievedDate: '2026-11-04' });
    expect(r['chin-5'].achieved).toBe(true);
    expect(r['chin-10']).toMatchObject({ achieved: false, current: 5 });
  });

  it('重さ：ダンベル24kg×10、体重ベンチ、スクワット1.5倍（体重79kg）', () => {
    const sessions = days(['2026-11-02']);
    const r = run(
      [
        set({ sessionId: 'd0', exerciseId: 'db-press', weight: 24, reps: 10 }),
        set({ sessionId: 'd0', exerciseId: 'bench-press', weight: 79, reps: 1 }),
        set({ sessionId: 'd0', exerciseId: 'bb-squat', weight: 118, reps: 1 }),
      ],
      sessions,
    );
    expect(r['dumbbell-24x10'].achieved).toBe(true);
    expect(r['bench-bw'].achieved).toBe(true);
    expect(r['squat-15'].achieved).toBe(false); // 118.5kg が必要
  });

  it('1週間で4部位すべて', () => {
    const sessions = days(['2026-11-02', '2026-11-04', '2026-11-09']);
    const one = run(
      [
        set({ sessionId: 'd0', exerciseId: 'db-press' }),
        set({ sessionId: 'd0', exerciseId: 'db-row' }),
        set({ sessionId: 'd1', exerciseId: 'db-curl' }),
        set({ sessionId: 'd2', exerciseId: 'db-squat' }), // 次の週
      ],
      sessions,
    );
    expect(one.balance.achieved).toBe(false);
    const two = run(
      [
        set({ sessionId: 'd0', exerciseId: 'db-press' }),
        set({ sessionId: 'd0', exerciseId: 'db-row' }),
        set({ sessionId: 'd1', exerciseId: 'db-curl' }),
        set({ sessionId: 'd1', exerciseId: 'db-squat' }),
      ],
      sessions,
    );
    expect(two.balance).toMatchObject({ achieved: true, achievedDate: '2026-11-04' });
  });

  it('ボリュームはトンで数え、自重種目は体重×係数', () => {
    const sessions = days(['2026-11-02']);
    // 腕立て 79×0.65×10 = 513.5kg、ダンベル 20×10 = 200kg
    const r = run(
      [set({ sessionId: 'd0', exerciseId: 'push-up', weight: null }), set({ sessionId: 'd0', exerciseId: 'db-press' })],
      sessions,
    );
    expect(r['tons-10'].current).toBe(0.7);
  });
});
