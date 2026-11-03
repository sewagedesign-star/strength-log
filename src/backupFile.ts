import { exportBackup } from './db/backup';
import { getSettings, saveSettings } from './db/repo';
import { toDateKey } from './domain/date';

/**
 * バックアップを JSON ファイルにして渡す。iPhone では共有シート（「ファイルに保存」など）、PC ではダウンロード。
 * 書き出せたら最後の書き出し時刻を記録する。共有をやめたときは null。
 */
export async function exportToFile(): Promise<{ name: string; count: number; shared: boolean } | null> {
  const b = await exportBackup();
  const name = `workout-backup-${toDateKey().replace(/-/g, '')}.json`;
  const file = new File([JSON.stringify(b, null, 1)], name, { type: 'application/json' });
  const touch = window.matchMedia('(pointer: coarse)').matches;
  let shared = false;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      shared = true;
    } catch {
      return null; // 共有をやめたとき
    }
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const s = await getSettings();
  await saveSettings({ ...s, backup: { ...s.backup, lastExportAt: Date.now(), snoozeUntil: undefined } });
  return { name, count: b.sets.length, shared };
}
