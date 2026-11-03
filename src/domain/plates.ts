import type { BarSetup, BarType, Equipment } from './types';

/** プレート計算を出す器具 */
export function barTypeOf(equipment: Equipment): BarType | null {
  return equipment === 'barbell' || equipment === 'ezbar' ? equipment : null;
}

export interface PlateResult {
  /** 片側に付けるプレート（重い順） */
  perSide: number[];
  /** その組み合わせでの合計（kg） */
  total: number;
  exact: boolean;
  /** ぴったりにできないとき、作れる近い重さ（軽い方・重い方） */
  below?: number;
  above?: number;
  /** バーより軽い重さを入れたとき */
  underBar: boolean;
}

/** 枚数が少ない方。同じ枚数なら重いプレートを使う方（例：15+10 より 20+5） */
function better(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return a.length < b.length;
  const x = [...a].sort((p, q) => q - p);
  const y = [...b].sort((p, q) => q - p);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

// 0.05kg 単位の整数で計算する（1.25kg なども割り切れる）
const U = 20;
const toU = (kg: number) => Math.round(kg * U);
const fromU = (u: number) => Math.round((u / U) * 100) / 100;

/**
 * 目標の重さ（合計）に必要なプレートを、片側ぶん求める。
 * 左右同じ枚数を付けるので、使えるのは持っている枚数の半分まで。枚数が最も少ない組み合わせを選ぶ。
 */
export function calcPlates(target: number, bar: BarSetup): PlateResult {
  const side = (target - bar.weight) / 2;
  if (side < 0) return { perSide: [], total: bar.weight, exact: target === bar.weight, underBar: true, above: bar.weight };

  const plates = [...bar.plates].filter((p) => p.weight > 0).sort((a, b) => b.weight - a.weight);
  const maxPlate = plates[0]?.weight ?? 0;
  const limit = toU(side) + toU(maxPlate); // 目標を少し超える重さまで調べる
  // best[u] = 片側 u（0.05kg 単位）を作る最少枚数の組み合わせ
  const best: (number[] | null)[] = Array.from({ length: limit + 1 }, () => null);
  best[0] = [];
  for (const p of plates) {
    const w = toU(p.weight);
    const pairs = Math.min(Math.floor(limit / w), p.count === null ? Infinity : Math.floor(p.count / 2));
    // 左右1組を1つずつ「使う／使わない」で調べる（後ろから更新して、同じ1組を二度使わない）
    for (let k = 0; k < pairs; k++) {
      for (let u = limit; u >= w; u--) {
        const prev = best[u - w];
        if (!prev) continue;
        const cand = [...prev, p.weight];
        if (!best[u] || better(cand, best[u]!)) best[u] = cand;
      }
    }
  }

  const t = toU(side);
  const sortDesc = (a: number[]) => [...a].sort((x, y) => y - x);
  if (best[t]) return { perSide: sortDesc(best[t]!), total: target, exact: true, underBar: false };

  let lo = t;
  while (lo > 0 && !best[lo]) lo--;
  let hi = t;
  while (hi <= limit && !best[hi]) hi++;
  return {
    perSide: sortDesc(best[lo] ?? []),
    total: fromU(lo * 2 + toU(bar.weight)),
    exact: false,
    below: fromU(lo * 2 + toU(bar.weight)),
    above: hi <= limit ? fromU(hi * 2 + toU(bar.weight)) : undefined,
    underBar: false,
  };
}
