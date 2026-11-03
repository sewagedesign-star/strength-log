// キャラ。6人から1人を選ぶ。称号（レベル）が上がると、キャラの周りの演出（背景・枠・オーラ）が変わる。
// 絵はユーザーが用意した画像（public/characters）。保存するのは選んだキャラと名前だけ。
import type { Settings } from './types';

export interface CharacterDef {
  id: string;
  /** public/ からの画像のパス */
  file: string;
  defaultName: string;
  /** 画像の幅÷高さ */
  aspect: number;
  /** 顔の位置（画像の幅・高さに対する割合）。丸く顔だけ出すときに使う */
  face: { cx: number; cy: number; size: number };
}

const c = (n: number, defaultName: string, w: number, h: number, cx: number): CharacterDef => ({
  id: `char${n}`,
  file: `characters/char${n}.webp`,
  defaultName,
  aspect: w / h,
  face: { cx, cy: 0.088, size: 0.2 },
});

export const CHARACTERS: CharacterDef[] = [
  c(1, 'ハヤト', 347, 921, 0.545),
  c(2, 'サクラ', 352, 870, 0.508),
  c(3, 'ゴウ', 358, 938, 0.504),
  c(4, 'ミミ', 334, 839, 0.497),
  c(5, 'レン', 313, 925, 0.459),
  c(6, 'シズク', 302, 867, 0.515),
];

/** 姿の段階（0〜5）。称号の区切り（Lv1・10・20・35・50・70）に合わせる */
export const STAGE_COUNT = 6;
export const STAGE_INFO: { frame: string; place: string; effect: string }[] = [
  { frame: 'なし', place: '自分の部屋', effect: '' },
  { frame: '銅', place: '朝の公園', effect: '' },
  { frame: '銀', place: 'ジム', effect: 'キラキラ' },
  { frame: '金', place: '闘技場', effect: '青いオーラ' },
  { frame: '金', place: '山の頂上', effect: '赤いオーラ' },
  { frame: '虹', place: '星空', effect: '金のオーラと王冠' },
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

/** 選んでいるキャラと、その名前 */
export function avatarOf(settings: Settings): { character: CharacterDef; name: string } {
  const character = CHARACTERS.find((ch) => ch.id === settings.avatar?.characterId) ?? CHARACTERS[0];
  const name = settings.avatar?.names?.[character.id]?.trim() || character.defaultName;
  return { character, name };
}

export function characterById(id: string | undefined): CharacterDef {
  return CHARACTERS.find((ch) => ch.id === id) ?? CHARACTERS[0];
}
