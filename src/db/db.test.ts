import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorkoutDb } from './db';
import { addSets, getSettings, lastSessionBefore, lastValues, loadAll, saveSettings, setMenu } from './repo';
import { exportBackup, importBackup, parseBackup } from './backup';
import { DEFAULT_EXERCISES, DEFAULT_GOALS } from '../domain/defaults';

let d: WorkoutDb;
let n = 0;
beforeEach(async () => {
  d = new WorkoutDb(`test-${++n}`);
  await d.open();
});
afterEach(async () => {
  await d.delete();
});

const input = { weight: 20, reps: 10, rpe: 8 as const, note: '' };

describe('初期データ', () => {
  it('種目マスタ・目標・設定が入る（体重79kg、刻み1kg）', async () => {
    const all = await loadAll(d);
    expect(all.exercises).toHaveLength(DEFAULT_EXERCISES.length);
    expect(all.goals).toHaveLength(DEFAULT_GOALS.length);
    expect(all.settings.bodyWeight).toBe(79);
    expect(all.exercises.every((e) => e.step === 1)).toBe(true);
  });
});

describe('記録', () => {
  it('セット数ぶんの記録を作り、セット番号は続きから', async () => {
    await addSets('2026-11-03', 'db-press', input, 3, d);
    await addSets('2026-11-03', 'db-press', { ...input, weight: 22 }, 1, d);
    const sets = await d.sets.toArray();
    expect(sets.map((s) => s.setNo).sort()).toEqual([1, 2, 3, 4]);
    expect(await d.sessions.count()).toBe(1);
    const s = await d.sessions.toArray();
    expect(s[0].exerciseIds).toEqual(['db-press']);
  });

  it('前回値は直近の最終セットとその日のセット数', async () => {
    expect(await lastValues('db-press', d)).toBeNull();
    await addSets('2026-10-30', 'db-press', input, 3, d);
    await addSets('2026-11-03', 'db-press', { ...input, weight: 22, reps: 8, rpe: 9 }, 2, d);
    const last = await lastValues('db-press', d);
    expect(last).toMatchObject({ weight: 22, reps: 8, rpe: 9, sets: 2, date: '2026-11-03' });
  });

  it('チンニングは補助重量とやり方を保存する', async () => {
    await addSets('2026-11-03', 'chinning', { weight: null, mode: 'assisted', assistWeight: 25, reps: 8, rpe: 8, note: '' }, 1, d);
    expect(await lastValues('chinning', d)).toMatchObject({ mode: 'assisted', assistWeight: 25, weight: null });
  });

  it('前回のメニュー（記録のない日は飛ばす）', async () => {
    await addSets('2026-10-30', 'db-press', input, 1, d);
    await addSets('2026-10-30', 'db-curl', input, 1, d);
    await setMenu('2026-11-01', ['db-row'], d); // チェックだけで記録なし
    expect(await lastSessionBefore('2026-11-03', d)).toEqual({ date: '2026-10-30', categories: ['chest', 'armsShoulders'] });
    expect(await lastSessionBefore('2026-10-30', d)).toBeNull();
  });

  it('設定を保存して読み出せる', async () => {
    const s = await getSettings(d);
    await saveSettings({ ...s, bodyWeight: 75 }, d);
    expect((await getSettings(d)).bodyWeight).toBe(75);
  });

  it('DBを開き直してもデータが残る', async () => {
    await addSets('2026-11-03', 'db-press', input, 2, d);
    d.close();
    const again = new WorkoutDb(d.name);
    expect(await again.sets.count()).toBe(2);
    again.close();
    await d.open();
  });
});

describe('バックアップ', () => {
  it('書き出し→別の端末（空のDB）へ読み込みで件数が一致する', async () => {
    await addSets('2026-10-30', 'db-press', input, 3, d);
    await addSets('2026-11-03', 'chinning', { weight: null, mode: 'bodyweight', reps: 1, rpe: 9, note: '' }, 2, d);
    const json = JSON.stringify(await exportBackup(d));

    const other = new WorkoutDb(`other-${n}`);
    await other.open();
    const r = await importBackup(parseBackup(json), other);
    expect(r.added.sets).toBe(5);
    expect(await other.sets.count()).toBe(await d.sets.count());
    expect(await other.sessions.count()).toBe(await d.sessions.count());
    await other.delete();
  });

  it('同じファイルを2回読み込んでも増えない（ID重複は除外）', async () => {
    await addSets('2026-10-30', 'db-press', input, 3, d);
    const b = await exportBackup(d);
    const r = await importBackup(b, d);
    expect(r.added).toEqual({ exercises: 0, sessions: 0, sets: 0, goals: 0 });
    expect(await d.sets.count()).toBe(3);
  });

  it('同じ日付の別セッションは今あるセッションにまとめる', async () => {
    await addSets('2026-11-03', 'db-press', input, 1, d);
    const other = new WorkoutDb(`other2-${n}`);
    await other.open();
    await addSets('2026-11-03', 'db-curl', input, 2, other);
    await importBackup(await exportBackup(other), d);
    expect(await d.sessions.count()).toBe(1);
    expect(await d.sets.count()).toBe(3);
    const [s] = await d.sessions.toArray();
    expect(s.exerciseIds.sort()).toEqual(['db-curl', 'db-press']);
    await other.delete();
  });

  it('関係ないファイルは読み込まない', () => {
    expect(() => parseBackup('{"a":1}')).toThrow('このアプリのバックアップではありません');
    expect(() => parseBackup('not json')).toThrow('JSON として読めません');
  });
});
