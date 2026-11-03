import type { Exercise, Goal, SetRecord } from './types';
import { CHIN_MODE_LABEL } from './types';

/** 例：「チンニング 補助なし 1回」「ダンベルプレス 24kg×12回」 */
export function goalLabel(goal: Goal, ex: Exercise | undefined): string {
  const name = ex?.name ?? '（削除された種目）';
  if (goal.mode) {
    const mode = goal.mode === 'bodyweight' ? '補助なし' : CHIN_MODE_LABEL[goal.mode];
    return `${name} ${mode} ${goal.reps}回`;
  }
  if (goal.weight !== undefined) return `${name} ${goal.weight}kg×${goal.reps}回`;
  return `${name} ${goal.reps}回`;
}

/** 目標を満たすセットか */
export function meetsGoal(goal: Goal, set: SetRecord): boolean {
  if (set.exerciseId !== goal.exerciseId || set.reps < goal.reps) return false;
  if (goal.mode) {
    // 補助なしの目標は「自重」で達成。補助ありの目標は自重でも達成とみなす
    if (goal.mode === 'bodyweight') return set.mode === 'bodyweight';
    if (goal.mode === 'assisted') return set.mode === 'assisted' || set.mode === 'bodyweight';
    return set.mode === goal.mode;
  }
  if (goal.weight !== undefined) return (set.weight ?? 0) >= goal.weight;
  return true;
}

export interface GoalStatus {
  goal: Goal;
  achieved: boolean;
  /** 達成した日の記録の作成時刻 */
  achievedAt?: number;
}

export function goalStatuses(goals: Goal[], sets: SetRecord[]): GoalStatus[] {
  return [...goals]
    .sort((a, b) => a.order - b.order)
    .map((goal) => {
      const hits = sets.filter((s) => meetsGoal(goal, s));
      if (hits.length === 0) return { goal, achieved: false };
      return { goal, achieved: true, achievedAt: Math.min(...hits.map((h) => h.createdAt)) };
    });
}
