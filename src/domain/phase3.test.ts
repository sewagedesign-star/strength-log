import { describe, expect, it } from 'vitest';
import { DEFAULT_EXERCISES, DEFAULT_SETTINGS } from './defaults';
import { barTypeOf, calcPlates } from './plates';
import { formatMonth, monthSummary, monthsWithRecords, prevMonth } from './monthly';
import { FIRST_REMIND_DAYS, daysSinceExport, shouldRemindBackup } from './backupReminder';
import { computeXp } from './xp';
import { evaluateAchievements } from './achievements';
import type { BarSetup, Session, SetRecord, Settings } from './types';

const S = DEFAULT_SETTINGS;
const barbell = S.bars.barbell;

describe('プレート計算', () => {
  it('バーベル・EZバーだけ対象', () => {
    expect(barTypeOf('barbell')).toBe('barbell');
    expect(barTypeOf('ezbar')).toBe('ezbar');
    expect(barTypeOf('dumbbell')).toBeNull();
  });

  it('60kg ＝ バー20kg ＋ 片側20kg', () => {
    expect(calcPlates(60, barbell)).toMatchObject({ perSide: [20], total: 60, exact: true });
  });

  it('枚数の少ない組み合わせを選ぶ（72.5kg → 片側 20・5・1.25）', () => {
    expect(calcPlates(72.5, barbell).perSide).toEqual([20, 5, 1.25]);
    expect(calcPlates(50, barbell).perSide).toEqual([15]);
    expect(calcPlates(100, barbell).perSide).toEqual([20, 20]);
  });

  it('バーだけ・バーより軽い', () => {
    expect(calcPlates(20, barbell)).toMatchObject({ perSide: [], exact: true, underBar: false });
    expect(calcPlates(15, barbell)).toMatchObject({ underBar: true, exact: false });
  });

  it('ぴったりにできないときは近い重さを出す', () => {
    const r = calcPlates(61, barbell);
    expect(r).toMatchObject({ exact: false, below: 60, above: 62.5 });
  });

  it('持っている枚数（左右で半分ずつ）を超えない', () => {
    const few: BarSetup = { weight: 20, plates: [{ weight: 10, count: 2 }, { weight: 5, count: 4 }] };
    // 片側に使えるのは 10kg×1、5kg×2 まで → 片側最大 20kg
    expect(calcPlates(60, few)).toMatchObject({ exact: true, perSide: [10, 5, 5] });
    expect(calcPlates(70, few)).toMatchObject({ exact: false, below: 60 });
    // 奇数枚は1枚余る
    const odd: BarSetup = { weight: 20, plates: [{ weight: 10, count: 3 }] };
    expect(calcPlates(60, odd)).toMatchObject({ exact: false, below: 40 });
  });

  it('EZバー（仮のバー10kg）', () => {
    expect(calcPlates(22.5, S.bars.ezbar).perSide).toEqual([5, 1.25]);
  });
});

describe('月のまとめ', () => {
  let seq = 0;
  const set = (p: Partial<SetRecord> & { exerciseId: string; sessionId: string }): SetRecord => ({
    id: `s${++seq}`, weight: 20, reps: 10, setNo: 1, rpe: 8, note: '', createdAt: seq, ...p,
  });
  const sessions: Session[] = [
    { id: 'a', date: '2026-09-30', exerciseIds: [] },
    { id: 'b', date: '2026-10-05', exerciseIds: [] },
    { id: 'c', date: '2026-10-12', exerciseIds: [] },
  ];
  const sets = [
    set({ sessionId: 'a', exerciseId: 'db-press', weight: 20 }),
    set({ sessionId: 'b', exerciseId: 'db-press', weight: 22 }),
    set({ sessionId: 'b', exerciseId: 'db-curl', weight: 8 }),
    set({ sessionId: 'c', exerciseId: 'db-curl', weight: 8 }),
    set({ sessionId: 'c', exerciseId: 'db-curl', weight: 8 }),
  ];
  const xp = computeXp(sets, sessions, DEFAULT_EXERCISES, S);
  const ach = evaluateAchievements(sets, sessions, DEFAULT_EXERCISES, S, xp);

  it('月の数字', () => {
    const m = monthSummary('2026-10', sets, sessions, DEFAULT_EXERCISES, S, xp, ach);
    expect(m).toMatchObject({ days: 2, sets: 4, volume: 220 + 240, pbCount: 1, top: { name: 'ダンベルカール', sets: 3 } });
    expect(m.achievements.map((a) => a.id)).toEqual(['pb-1']);
    const sep = monthSummary('2026-09', sets, sessions, DEFAULT_EXERCISES, S, xp, ach);
    expect(sep.achievements.map((a) => a.id)).toEqual(['days-1']);
    expect(m.xp + sep.xp).toBe(xp.total);
  });

  it('記録のない月', () => {
    expect(monthSummary('2026-08', sets, sessions, DEFAULT_EXERCISES, S, xp, ach)).toMatchObject({ days: 0, sets: 0, top: undefined });
  });

  it('月の一覧・前の月・表示', () => {
    expect(monthsWithRecords(xp)).toEqual(['2026-10', '2026-09']);
    expect(prevMonth('2026-01')).toBe('2025-12');
    expect(prevMonth('2026-11')).toBe('2026-10');
    expect(formatMonth('2026-10')).toBe('2026年10月');
  });
});

describe('バックアップのお知らせ', () => {
  const DAY = 86_400_000;
  const now = Date.parse('2026-11-30T12:00:00');
  const withBackup = (b: Partial<Settings['backup']>): Settings => ({ ...S, backup: { ...S.backup, ...b } });

  it('記録が無ければ出さない', () => {
    expect(shouldRemindBackup(S, null, now)).toBe(false);
  });

  it(`一度も書き出していなければ、最初の記録から${FIRST_REMIND_DAYS}日で出す`, () => {
    expect(shouldRemindBackup(S, now - 6 * DAY, now)).toBe(false);
    expect(shouldRemindBackup(S, now - 7 * DAY, now)).toBe(true);
  });

  it('最後の書き出しから30日で出す', () => {
    expect(shouldRemindBackup(withBackup({ lastExportAt: now - 29 * DAY }), now - 100 * DAY, now)).toBe(false);
    expect(shouldRemindBackup(withBackup({ lastExportAt: now - 30 * DAY }), now - 100 * DAY, now)).toBe(true);
    expect(daysSinceExport(withBackup({ lastExportAt: now - 30 * DAY }), now)).toBe(30);
  });

  it('「あとで」の期限内は出さない', () => {
    expect(shouldRemindBackup(withBackup({ snoozeUntil: now + DAY }), now - 100 * DAY, now)).toBe(false);
  });
});
