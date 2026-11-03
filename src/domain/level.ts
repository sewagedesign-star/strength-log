import type { Settings } from './types';

/** Lv n → n+1 に必要なXP */
export function xpToNext(n: number, settings: Settings): number {
  return settings.level.base + settings.level.perLevel * n;
}

/** Lv n に到達するのに必要な累計XP（Lv1 は 0） */
export function totalXpForLevel(n: number, settings: Settings): number {
  let sum = 0;
  for (let i = 1; i < n; i++) sum += xpToNext(i, settings);
  return sum;
}

export interface LevelInfo {
  level: number;
  title: string;
  /** 今のレベルに入ってから得たXP */
  xpInLevel: number;
  /** 次のレベルに必要なXP（上限なら null） */
  xpNeeded: number | null;
  /** 次のレベルまでの残りXP（上限なら 0） */
  remaining: number;
  isMax: boolean;
}

export function titleFor(level: number, settings: Settings): string {
  let name = settings.titles[0]?.name ?? '';
  for (const t of [...settings.titles].sort((a, b) => a.minLevel - b.minLevel)) {
    if (level >= t.minLevel) name = t.name;
  }
  return name;
}

/** 累計XPからレベルを計算する（レベルは保存しない） */
export function levelFromXp(totalXp: number, settings: Settings): LevelInfo {
  const max = settings.level.max;
  let level = 1;
  let rest = Math.max(0, totalXp);
  while (level < max && rest >= xpToNext(level, settings)) {
    rest -= xpToNext(level, settings);
    level++;
  }
  const isMax = level >= max;
  const xpNeeded = isMax ? null : xpToNext(level, settings);
  const xpInLevel = Math.round(rest * 10) / 10;
  return {
    level,
    title: titleFor(level, settings),
    xpInLevel,
    xpNeeded,
    remaining: xpNeeded === null ? 0 : Math.round((xpNeeded - rest) * 10) / 10,
    isMax,
  };
}
