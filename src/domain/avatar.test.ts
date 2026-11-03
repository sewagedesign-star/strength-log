import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './defaults';
import { CHARACTERS, avatarOf, characterById, stageFor, stageMinLevel } from './avatar';

const S = DEFAULT_SETTINGS;

describe('演出の段階', () => {
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

describe('キャラの選択と名前', () => {
  it('6人いて、IDと画像は重ならない', () => {
    expect(CHARACTERS).toHaveLength(6);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(6);
    expect(new Set(CHARACTERS.map((c) => c.file)).size).toBe(6);
  });

  it('選んでいなければ1人目、名前は仮の名前', () => {
    expect(avatarOf(S)).toMatchObject({ character: { id: 'char1' }, name: 'ハヤト' });
  });

  it('選んだキャラと、付けた名前', () => {
    const s = { ...S, avatar: { characterId: 'char4', names: { char4: 'みーちゃん', char1: 'たろう' } } };
    expect(avatarOf(s)).toMatchObject({ character: { id: 'char4' }, name: 'みーちゃん' });
  });

  it('名前を空にすると仮の名前に戻る', () => {
    const s = { ...S, avatar: { characterId: 'char2', names: { char2: '  ' } } };
    expect(avatarOf(s).name).toBe('サクラ');
  });

  it('知らないIDは1人目', () => {
    expect(characterById('nope').id).toBe('char1');
    expect(avatarOf({ ...S, avatar: { characterId: 'nope' } }).character.id).toBe('char1');
  });
});
