import type { Settings } from './types';

const DAY = 24 * 60 * 60 * 1000;
/** 一度も書き出していないときは、最初の記録からこの日数でお知らせする */
export const FIRST_REMIND_DAYS = 7;

/**
 * バックアップのお知らせを出すか。
 * - 最後の書き出しから intervalDays 日たった
 * - 一度も書き出していなければ、最初の記録から FIRST_REMIND_DAYS 日たった
 * - 「あとで」の期限内は出さない。記録が無ければ出さない
 */
export function shouldRemindBackup(settings: Settings, firstRecordAt: number | null, now: number): boolean {
  if (firstRecordAt === null) return false;
  const { lastExportAt, snoozeUntil, intervalDays } = settings.backup;
  if (snoozeUntil && now < snoozeUntil) return false;
  if (lastExportAt) return now - lastExportAt >= intervalDays * DAY;
  return now - firstRecordAt >= FIRST_REMIND_DAYS * DAY;
}

/** 最後の書き出しから何日たったか（一度も無ければ null） */
export function daysSinceExport(settings: Settings, now: number): number | null {
  const t = settings.backup.lastExportAt;
  return t ? Math.floor((now - t) / DAY) : null;
}

export const SNOOZE_MS = 7 * DAY;
