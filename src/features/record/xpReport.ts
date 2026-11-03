import { loadAll } from '../../db/repo';
import { levelFromXp } from '../../domain/level';
import { BONUS_LABEL, computeXp, round1 } from '../../domain/xp';
import type { ToastMessage } from '../../components/Toast';
import { fmtNum } from '../../data';

async function snapshot(date: string) {
  const all = await loadAll();
  const xp = computeXp(all.sets, all.sessions, all.exercises, all.settings);
  return {
    total: xp.total,
    level: levelFromXp(xp.total, all.settings),
    bonuses: xp.sessions.find((s) => s.date === date)?.bonuses ?? [],
    exName: new Map(all.exercises.map((e) => [e.id, e.name])),
  };
}

/** 記録を保存し、獲得XP（とレベルアップ）のトースト内容を返す */
export async function saveAndReport(date: string, save: () => Promise<unknown>): Promise<ToastMessage> {
  const before = await snapshot(date);
  await save();
  const after = await snapshot(date);

  const key = (b: { type: string; exerciseId?: string }) => `${b.type}:${b.exerciseId ?? ''}`;
  const had = new Set(before.bonuses.map(key));
  const lines = after.bonuses
    .filter((b) => !had.has(key(b)))
    .map((b) => {
      const name = b.exerciseId ? after.exName.get(b.exerciseId) : '';
      return `${BONUS_LABEL[b.type]}${name ? `（${name}）` : ''} +${fmtNum(b.xp)}`;
    });

  const gained = round1(after.total - before.total);
  const title = `+${fmtNum(gained)} XP`;
  if (after.level.level > before.level.level) {
    return {
      levelUp: true,
      title: `Lv ${before.level.level} → Lv ${after.level.level}`,
      lines: [
        title,
        ...lines,
        ...(after.level.title !== before.level.title ? [`称号「${after.level.title}」になった！`] : []),
      ],
    };
  }
  return { title, lines: [...lines, `次のレベルまで あと ${fmtNum(after.level.remaining)} XP`] };
}
