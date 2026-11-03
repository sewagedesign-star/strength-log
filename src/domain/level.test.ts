import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './defaults';
import { levelFromXp, titleFor, totalXpForLevel, xpToNext } from './level';

const S = DEFAULT_SETTINGS;

describe('レベル', () => {
  it('Lv n → n+1 に必要なXP = 200 + 50n', () => {
    expect(xpToNext(1, S)).toBe(250);
    expect(xpToNext(2, S)).toBe(300);
    expect(xpToNext(98, S)).toBe(5100);
  });

  it('0XP は Lv1', () => {
    expect(levelFromXp(0, S)).toMatchObject({ level: 1, xpInLevel: 0, xpNeeded: 250, remaining: 250 });
  });

  it('境界：249.9 は Lv1、250 で Lv2', () => {
    expect(levelFromXp(249.9, S).level).toBe(1);
    expect(levelFromXp(249.9, S).remaining).toBe(0.1);
    expect(levelFromXp(250, S)).toMatchObject({ level: 2, xpInLevel: 0, xpNeeded: 300 });
    expect(levelFromXp(550, S).level).toBe(3);
  });

  it('累計XPと到達レベルが対応する', () => {
    for (const n of [2, 10, 20, 35, 50, 70, 99]) {
      expect(levelFromXp(totalXpForLevel(n, S), S).level).toBe(n);
      expect(levelFromXp(totalXpForLevel(n, S) - 0.1, S).level).toBe(n - 1);
    }
  });

  it('上限は Lv99', () => {
    const info = levelFromXp(10_000_000, S);
    expect(info).toMatchObject({ level: 99, isMax: true, xpNeeded: null, remaining: 0 });
  });

  it('負のXPは0として扱う', () => {
    expect(levelFromXp(-5, S).level).toBe(1);
  });

  it('必要XPの式を設定で変えられる', () => {
    const custom = { ...S, level: { base: 100, perLevel: 0, max: 99 } };
    expect(levelFromXp(1000, custom).level).toBe(11);
  });
});

describe('称号', () => {
  it.each([
    [1, '初心者'],
    [9, '初心者'],
    [10, '初級者'],
    [19, '初級者'],
    [20, '中級者'],
    [34, '中級者'],
    [35, '上級者'],
    [49, '上級者'],
    [50, '達人'],
    [69, '達人'],
    [70, '伝説'],
    [99, '伝説'],
  ])('Lv%i は %s', (lv, name) => {
    expect(titleFor(lv, S)).toBe(name);
  });

  it('称号名を変えられる', () => {
    const custom = { ...S, titles: S.titles.map((t) => (t.minLevel === 1 ? { ...t, name: 'ひよっこ' } : t)) };
    expect(titleFor(3, custom)).toBe('ひよっこ');
  });
});
