import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './defaults';
import { DEFAULT_LOOK, MAX_SCALE, lookOf, physique, stageFor, stageMinLevel } from './avatar';

const S = DEFAULT_SETTINGS;
const xp = (chest: number, back: number, armsShoulders: number, legs: number) => ({ chest, back, armsShoulders, legs, other: 0 });

describe('姿の段階', () => {
  it.each([
    [1, 0],
    [9, 0],
    [10, 1],
    [19, 1],
    [20, 2],
    [35, 3],
    [50, 4],
    [69, 4],
    [70, 5],
    [99, 5],
  ])('Lv%i は段階%i', (lv, stage) => {
    expect(stageFor(lv, S)).toBe(stage);
  });

  it('各段階になるレベル', () => {
    expect([0, 1, 2, 3, 4, 5].map((s) => stageMinLevel(s, S))).toEqual([1, 10, 20, 35, 50, 70]);
  });
});

describe('体つき', () => {
  it('Lv1 はどの部位も 1.0', () => {
    expect(physique(xp(500, 100, 0, 300), 1)).toEqual({ arms: 1, chest: 1, back: 1, legs: 1 });
  });

  it('Lv70 で一番鍛えた部位が最大、鍛えていない部位も4割は育つ', () => {
    const p = physique(xp(1000, 500, 0, 1000), 70);
    expect(p.chest).toBe(MAX_SCALE);
    expect(p.legs).toBe(MAX_SCALE);
    expect(p.back).toBe(1.42); // 1 + 0.6 × (0.4 + 0.6 × 0.5)
    expect(p.arms).toBe(1.24); // 1 + 0.6 × 0.4
  });

  it('レベルが上がるほど太くなり、Lv70 より上は変わらない', () => {
    const b = xp(100, 100, 100, 100);
    expect(physique(b, 35).arms).toBeLessThan(physique(b, 50).arms);
    expect(physique(b, 99)).toEqual(physique(b, 70));
  });

  it('記録がなくても 1.0 より細くならない', () => {
    expect(physique(xp(0, 0, 0, 0), 50).arms).toBeGreaterThanOrEqual(1);
  });
});

describe('見た目の好み', () => {
  it('保存していない項目は既定値', () => {
    expect(lookOf(S)).toEqual(DEFAULT_LOOK);
    expect(lookOf({ ...S, avatar: { name: 'たろう', hairStyle: 'twin' } })).toMatchObject({ name: 'たろう', hairStyle: 'twin', skin: DEFAULT_LOOK.skin });
  });
});
