// 実績（バッジ）。保存せず、記録から毎回計算する。XP は付けない。
import type { Exercise, Session, SetRecord, Settings } from './types';
import { BODY_PARTS, type Category } from './types';
import { toDateKey, weekStart } from './date';
import { effectiveLoad, type XpSummary } from './xp';

export type Tier = 'bronze' | 'silver' | 'gold';
export const TIER_LABEL: Record<Tier, string> = { bronze: '銅', silver: '銀', gold: '金' };

/** 記録を古い順にたどったときの、その時点までの積み上げ */
interface State {
  days: number;
  questWeeks: number;
  questStreak: number;
  sets: number;
  /** ボリュームの累計（トン） */
  tons: number;
  pbCount: number;
  chinBodyweightReps: number;
  dumbbell24x10: number;
  benchBodyweight: number;
  squat15: number;
  balanceWeeks: number;
}

type Key = keyof State;

export interface AchievementDef {
  id: string;
  group: string;
  name: string;
  /** 条件の説明 */
  condition: string;
  icon: string;
  tier: Tier;
  key: Key;
  target: number;
  /** 残りの表示に使う単位 */
  unit: string;
}

const d = (
  id: string,
  group: string,
  name: string,
  condition: string,
  icon: string,
  tier: Tier,
  key: Key,
  target: number,
  unit: string,
): AchievementDef => ({ id, group, name, condition, icon, tier, key, target, unit });

export const ACHIEVEMENTS: AchievementDef[] = [
  d('days-1', '記録の習慣', 'はじめの一歩', '初めて記録する', '🌱', 'bronze', 'days', 1, '日'),
  d('days-10', '記録の習慣', '10日の積み重ね', '記録した日が10日', '📅', 'bronze', 'days', 10, '日'),
  d('days-30', '記録の習慣', '習慣になった', '記録した日が30日', '📆', 'silver', 'days', 30, '日'),
  d('days-100', '記録の習慣', '百日修行', '記録した日が100日', '🏯', 'gold', 'days', 100, '日'),
  d('days-300', '記録の習慣', '鉄の意志', '記録した日が300日', '🗿', 'gold', 'days', 300, '日'),
  d('quest-1', '週間クエスト', '初クエスト', '週間クエストを初めて達成', '🎯', 'bronze', 'questWeeks', 1, '回'),
  d('quest-streak-4', '週間クエスト', '4週連続', '週間クエストを4週続けて達成', '🔥', 'silver', 'questStreak', 4, '週'),
  d('quest-streak-12', '週間クエスト', '12週連続', '週間クエストを12週続けて達成', '☄️', 'gold', 'questStreak', 12, '週'),
  d('sets-100', '積み重ね', '100セット', '累計100セット', '🧱', 'bronze', 'sets', 100, 'セット'),
  d('sets-500', '積み重ね', '500セット', '累計500セット', '🏗️', 'silver', 'sets', 500, 'セット'),
  d('sets-1000', '積み重ね', '1000セット', '累計1000セット', '🏛️', 'gold', 'sets', 1000, 'セット'),
  d('tons-10', 'ボリューム', '10トン', 'ボリューム（重量×回数）の累計10トン', '🚚', 'bronze', 'tons', 10, 'トン'),
  d('tons-50', 'ボリューム', '50トン', 'ボリュームの累計50トン', '🚛', 'silver', 'tons', 50, 'トン'),
  d('tons-100', 'ボリューム', '100トン', 'ボリュームの累計100トン', '🚢', 'gold', 'tons', 100, 'トン'),
  d('pb-1', '自己ベスト', '初めての自己ベスト', '自己ベスト（推定1RM）を初めて更新', '⭐', 'bronze', 'pbCount', 1, '回'),
  d('pb-10', '自己ベスト', '自己ベスト10回', '自己ベストを10回更新', '🌟', 'silver', 'pbCount', 10, '回'),
  d('pb-50', '自己ベスト', '自己ベスト50回', '自己ベストを50回更新', '💫', 'gold', 'pbCount', 50, '回'),
  d('chin-1', 'チンニング', '初めての懸垂', '補助なしで1回', '🐒', 'bronze', 'chinBodyweightReps', 1, '回'),
  d('chin-5', 'チンニング', '懸垂5回', '補助なしで1セット5回', '🦍', 'silver', 'chinBodyweightReps', 5, '回'),
  d('chin-10', 'チンニング', '懸垂10回', '補助なしで1セット10回', '🦅', 'gold', 'chinBodyweightReps', 10, '回'),
  d('dumbbell-24x10', '重さ', 'ダンベル最大重量', 'ダンベル24kgで10回', '🔩', 'silver', 'dumbbell24x10', 1, ''),
  d('bench-bw', '重さ', '体重ベンチ', '体重と同じ重さでベンチプレス1回', '🏆', 'gold', 'benchBodyweight', 1, ''),
  d('squat-15', '重さ', 'スクワット1.5倍', '体重の1.5倍でバーベルスクワット1回', '🦵', 'gold', 'squat15', 1, ''),
  d('balance', 'バランス', '全身まんべんなく', '1週間で胸・背中・腕肩・脚をすべて記録', '⚖️', 'silver', 'balanceWeeks', 1, '週'),
];

export interface AchievementStatus {
  def: AchievementDef;
  achieved: boolean;
  /** 取った日 */
  achievedDate?: string;
  /** 今の値（target を上限に切り詰め） */
  current: number;
}

/** 記録から実績の状態を計算する */
export function evaluateAchievements(
  sets: SetRecord[],
  sessions: Session[],
  exercises: Exercise[],
  settings: Settings,
  xp: XpSummary,
): AchievementStatus[] {
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const setsBySession = new Map<string, SetRecord[]>();
  for (const s of sets) {
    if (!exMap.has(s.exerciseId)) continue;
    setsBySession.set(s.sessionId, [...(setsBySession.get(s.sessionId) ?? []), s]);
  }
  const sessionXp = new Map(xp.sessions.map((s) => [s.sessionId, s]));
  const ordered = sessions
    .filter((s) => setsBySession.has(s.id))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));

  const st: State = {
    days: 0, questWeeks: 0, questStreak: 0, sets: 0, tons: 0, pbCount: 0,
    chinBodyweightReps: 0, dumbbell24x10: 0, benchBodyweight: 0, squat15: 0, balanceWeeks: 0,
  };
  const reached = new Map<string, string>();
  const partsInWeek = new Map<string, Set<Category>>();
  const balancedWeeks = new Set<string>();
  let lastQuestWeek: string | null = null;
  let streak = 0;
  const bw = settings.bodyWeight;

  for (const session of ordered) {
    const list = setsBySession.get(session.id)!;
    const wk = weekStart(session.date);
    st.days++;
    st.sets += list.length;

    const parts = partsInWeek.get(wk) ?? new Set<Category>();
    for (const s of list) {
      const ex = exMap.get(s.exerciseId)!;
      st.tons += (effectiveLoad(s, ex, settings) * s.reps) / 1000;
      parts.add(ex.category);
      if (ex.isAssisted && s.mode === 'bodyweight') st.chinBodyweightReps = Math.max(st.chinBodyweightReps, s.reps);
      if (ex.equipment === 'dumbbell' && (s.weight ?? 0) >= 24 && s.reps >= 10) st.dumbbell24x10 = 1;
      if (ex.id === 'bench-press' && s.reps >= 1 && (s.weight ?? 0) >= bw) st.benchBodyweight = 1;
      if (ex.id === 'bb-squat' && s.reps >= 1 && (s.weight ?? 0) >= bw * 1.5) st.squat15 = 1;
    }
    partsInWeek.set(wk, parts);
    if (BODY_PARTS.every((p) => parts.has(p)) && !balancedWeeks.has(wk)) {
      balancedWeeks.add(wk);
      st.balanceWeeks = balancedWeeks.size;
    }

    const bonuses = sessionXp.get(session.id)?.bonuses ?? [];
    st.pbCount += bonuses.filter((b) => b.type === 'personalBest').length;
    if (bonuses.some((b) => b.type === 'weeklyQuest')) {
      st.questWeeks++;
      streak = lastQuestWeek && isNextWeek(lastQuestWeek, wk) ? streak + 1 : 1;
      lastQuestWeek = wk;
      st.questStreak = Math.max(st.questStreak, streak);
    }

    for (const def of ACHIEVEMENTS) {
      if (!reached.has(def.id) && st[def.key] >= def.target - 1e-9) reached.set(def.id, session.date);
    }
  }

  return ACHIEVEMENTS.map((def) => ({
    def,
    achieved: reached.has(def.id),
    achievedDate: reached.get(def.id),
    current: Math.min(def.target, Math.floor(st[def.key] * 10) / 10),
  }));
}

/** cur が prev（どちらも週の月曜日）の次の週か */
function isNextWeek(prev: string, cur: string): boolean {
  const [y, m, day] = prev.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, day + 7)) === cur;
}
