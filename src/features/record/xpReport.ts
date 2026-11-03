import { loadAll } from '../../db/repo';
import { TIER_LABEL, evaluateAchievements } from '../../domain/achievements';
import { goalLabel, goalStatuses } from '../../domain/goals';
import { levelFromXp } from '../../domain/level';
import { BONUS_LABEL, computeXp, round1 } from '../../domain/xp';
import type { Celebration, ToastMessage } from '../../components/Toast';
import { fmtNum } from '../../data';

async function snapshot(date: string) {
  const all = await loadAll();
  const xp = computeXp(all.sets, all.sessions, all.exercises, all.settings);
  return {
    total: xp.total,
    level: levelFromXp(xp.total, all.settings),
    bonuses: xp.sessions.find((s) => s.date === date)?.bonuses ?? [],
    exMap: new Map(all.exercises.map((e) => [e.id, e])),
    goals: goalStatuses(all.goals, all.sets),
    achievements: evaluateAchievements(all.sets, all.sessions, all.exercises, all.settings, xp),
  };
}

export interface SaveReport {
  toast: ToastMessage;
  /** レベルアップ・目標達成・実績（新しく取れたもの） */
  celebrations: Celebration[];
}

/** 記録を保存し、獲得XPのトーストと、お祝いのカードの内容を返す */
export async function saveAndReport(date: string, save: () => Promise<unknown>): Promise<SaveReport> {
  const before = await snapshot(date);
  await save();
  const after = await snapshot(date);

  const key = (b: { type: string; exerciseId?: string }) => `${b.type}:${b.exerciseId ?? ''}`;
  const had = new Set(before.bonuses.map(key));
  const lines = after.bonuses
    .filter((b) => !had.has(key(b)))
    .map((b) => {
      const name = b.exerciseId ? after.exMap.get(b.exerciseId)?.name : '';
      return `${BONUS_LABEL[b.type]}${name ? `（${name}）` : ''} +${fmtNum(b.xp)}`;
    });

  const gained = round1(after.total - before.total);
  const toast: ToastMessage = {
    title: `+${fmtNum(gained)} XP`,
    lines: [...lines, after.level.isMax ? 'レベル上限' : `次のレベルまで あと ${fmtNum(after.level.remaining)} XP`],
  };

  const celebrations: Celebration[] = [];
  if (after.level.level > before.level.level) {
    celebrations.push({
      kind: 'level',
      icon: '🆙',
      label: 'LEVEL UP!',
      title: `Lv ${before.level.level} → Lv ${after.level.level}`,
      lines: after.level.title !== before.level.title ? [`称号「${after.level.title}」になった！`] : [`称号「${after.level.title}」`],
    });
  }

  const goalDone = new Set(before.goals.filter((g) => g.achieved).map((g) => g.goal.id));
  for (const g of after.goals) {
    if (g.achieved && !goalDone.has(g.goal.id)) {
      celebrations.push({ kind: 'goal', icon: '🎉', label: '目標達成！', title: goalLabel(g.goal, after.exMap.get(g.goal.exerciseId)) });
    }
  }

  const gotBefore = new Set(before.achievements.filter((a) => a.achieved).map((a) => a.def.id));
  for (const a of after.achievements) {
    if (a.achieved && !gotBefore.has(a.def.id)) {
      celebrations.push({
        kind: 'achievement',
        icon: a.def.icon,
        label: `実績解除（${TIER_LABEL[a.def.tier]}）`,
        title: a.def.name,
        lines: [a.def.condition],
        tier: a.def.tier,
      });
    }
  }

  return { toast, celebrations };
}
