import { describe, expect, it } from 'vitest';
import { DEFAULT_EXERCISES, DEFAULT_GOALS } from './defaults';
import { goalLabel, goalStatuses, meetsGoal } from './goals';
import type { SetRecord } from './types';

const base: SetRecord = {
  id: 'x', sessionId: 's', exerciseId: 'chinning', weight: null, reps: 1, setNo: 1, rpe: 8, note: '', createdAt: 1,
};
const goal = (id: string) => DEFAULT_GOALS.find((g) => g.id === id)!;
const ex = (id: string) => DEFAULT_EXERCISES.find((e) => e.id === id);

describe('種目目標', () => {
  it('表示名', () => {
    expect(goalLabel(goal('goal-chin-1'), ex('chinning'))).toBe('チンニング 補助なし 1回');
    expect(goalLabel(goal('goal-db-press'), ex('db-press'))).toBe('ダンベルプレス 24kg×12回');
  });

  it('チンニング補助なしは「自重」でだけ達成', () => {
    expect(meetsGoal(goal('goal-chin-1'), { ...base, mode: 'bodyweight', reps: 1 })).toBe(true);
    expect(meetsGoal(goal('goal-chin-1'), { ...base, mode: 'assisted', assistWeight: 10, reps: 5 })).toBe(false);
    expect(meetsGoal(goal('goal-chin-1'), { ...base, mode: 'negative', reps: 5 })).toBe(false);
    expect(meetsGoal(goal('goal-chin-3'), { ...base, mode: 'bodyweight', reps: 2 })).toBe(false);
  });

  it('重量×回数は両方を満たすと達成', () => {
    const g = goal('goal-db-press');
    const s = { ...base, exerciseId: 'db-press', weight: 24, reps: 12 };
    expect(meetsGoal(g, s)).toBe(true);
    expect(meetsGoal(g, { ...s, weight: 22 })).toBe(false);
    expect(meetsGoal(g, { ...s, reps: 11 })).toBe(false);
    expect(meetsGoal(g, { ...s, exerciseId: 'db-fly' })).toBe(false);
  });

  it('達成状況の一覧', () => {
    const st = goalStatuses(DEFAULT_GOALS, [{ ...base, mode: 'bodyweight', reps: 2, createdAt: 5 }]);
    expect(st.map((s) => s.achieved)).toEqual([true, false, false, false]);
    expect(st[0].achievedAt).toBe(5);
  });
});
