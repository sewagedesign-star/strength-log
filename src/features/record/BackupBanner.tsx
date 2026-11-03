import { useState } from 'react';
import { exportToFile } from '../../backupFile';
import { saveSettings } from '../../db/repo';
import { SNOOZE_MS, daysSinceExport, shouldRemindBackup } from '../../domain/backupReminder';
import type { Settings } from '../../domain/types';
import { useToast } from '../../components/Toast';
import styles from './BackupBanner.module.css';

/** バックアップのお知らせ（記録画面の上） */
export function BackupBanner({ settings, firstRecordAt }: { settings: Settings; firstRecordAt: number | null }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  if (!shouldRemindBackup(settings, firstRecordAt, now)) return null;

  const days = daysSinceExport(settings, now);
  const run = async () => {
    setBusy(true);
    try {
      const r = await exportToFile();
      if (r) toast({ title: 'バックアップしました', lines: [`記録 ${r.count} 件`] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        <strong>バックアップしましょう</strong>
        <span>{days === null ? 'まだ一度も書き出していません' : `最後の書き出しから ${days} 日たちました`}</span>
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className="btn"
          onClick={() => saveSettings({ ...settings, backup: { ...settings.backup, snoozeUntil: now + SNOOZE_MS } })}
        >
          あとで
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={run}>
          今すぐ書き出す
        </button>
      </div>
    </div>
  );
}
