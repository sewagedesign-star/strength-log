// キャラの見た目。姿の段階・体つきは記録（累計XP）から毎回計算し、保存するのは見た目の好みだけ。
import type { Category, Settings } from './types';

export type HairStyle = 'short' | 'bob' | 'long' | 'twin';
export const HAIR_STYLES: HairStyle[] = ['short', 'bob', 'long', 'twin'];
export const HAIR_STYLE_LABEL: Record<HairStyle, string> = { short: 'ショート', bob: 'ボブ', long: 'ロング', twin: 'ツインテール' };

export const HAIR_COLORS = ['#f26fb3', '#7ccf4a', '#3fa9f5', '#9b6bd6', '#e2483d', '#f2cc6b', '#d9dbe8', '#8a5a3c', '#2e2a3a'];
export const SKIN_COLORS = ['#ffe6d8', '#f9d2b8', '#e2a77f', '#9c6646'];
export const EYE_COLORS = ['#3a8ee6', '#3cb371', '#e04848', '#9b59d0', '#e0a030', '#8b5a2b'];
export const OUTFIT_COLORS = ['#e24a4a', '#3a7bd5', '#2f9e6a', '#f08a24', '#e86aa6', '#2c2c38', '#f4f4f6'];

export interface AvatarLook {
  name: string;
  hairStyle: HairStyle;
  hairColor: string;
  skin: string;
  eye: string;
  outfit: string;
}

export const DEFAULT_LOOK: AvatarLook = {
  name: 'ルーキー',
  hairStyle: 'short',
  hairColor: HAIR_COLORS[2],
  skin: SKIN_COLORS[0],
  eye: EYE_COLORS[0],
  outfit: OUTFIT_COLORS[0],
};

/** 姿の段階（0〜5）。称号の区切り（Lv1・10・20・35・50・70）に合わせる */
export const STAGE_COUNT = 6;
export const STAGE_INFO: { outfit: string; place: string }[] = [
  { outfit: 'Tシャツと短パン', place: '自分の部屋' },
  { outfit: 'タンクトップとハチマキ', place: '朝の公園' },
  { outfit: 'リストバンドとグローブ', place: 'ジム' },
  { outfit: 'パワーベルトと青いオーラ', place: '闘技場' },
  { outfit: '道着とマント、赤いオーラ', place: '山の頂上' },
  { outfit: '金のオーラと王冠', place: '星空' },
];

export function stageFor(level: number, settings: Settings): number {
  const mins = [...settings.titles].map((t) => t.minLevel).sort((a, b) => a - b);
  let stage = 0;
  mins.forEach((m, i) => {
    if (level >= m) stage = i;
  });
  return Math.min(STAGE_COUNT - 1, stage);
}

/** 各段階になるレベル */
export function stageMinLevel(stage: number, settings: Settings): number {
  const mins = [...settings.titles].map((t) => t.minLevel).sort((a, b) => a - b);
  return mins[stage] ?? mins[mins.length - 1];
}

export interface Physique {
  arms: number;
  chest: number;
  back: number;
  legs: number;
}

/** 体つきが最大になるレベル */
export const FULL_GROWTH_LEVEL = 70;
/** 一番鍛えた部位の最大の太さ（1 が初期） */
export const MAX_SCALE = 1.6;

/**
 * 部位のXPから体つきを決める（1.0〜1.6）。
 * レベルが上がるほど全体が育ち、よく鍛えた部位ほど太くなる。鍛えていない部位も少しは育つ（4割）。
 */
export function physique(byCategory: Record<Category, number>, level: number): Physique {
  const t = Math.min(1, Math.max(0, (level - 1) / (FULL_GROWTH_LEVEL - 1)));
  const parts = { arms: byCategory.armsShoulders, chest: byCategory.chest, back: byCategory.back, legs: byCategory.legs };
  const top = Math.max(...Object.values(parts));
  const grow = (xp: number) => {
    const share = top > 0 ? xp / top : 0;
    return Math.round((1 + (MAX_SCALE - 1) * t * (0.4 + 0.6 * share)) * 1000) / 1000;
  };
  return { arms: grow(parts.arms), chest: grow(parts.chest), back: grow(parts.back), legs: grow(parts.legs) };
}

/** 保存された好みに、足りない項目の既定値を補う */
export function lookOf(settings: Settings): AvatarLook {
  return { ...DEFAULT_LOOK, ...settings.avatar };
}
