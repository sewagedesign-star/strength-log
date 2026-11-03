import { useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/Sheet';
import { importBackup, parseBackup, type BackupFile } from '../../db/backup';
import { formatDate, formatShortDate, toDateKey } from '../../domain/date';
import type { Settings } from '../../domain/types';
import { exportToFile } from '../../backupFile';
import { NumberField, Row, Section } from './SettingsScreen';
import styles from './Settings.module.css';

export function BackupSection({ settings, onSave }: { settings: Settings; onSave: (p: Partial<Settings>) => void }) {
  const last = settings.backup.lastExportAt;
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);

  const doExport = async () => {
    const r = await exportToFile();
    if (r) setMessage(r.shared ? `書き出しました（記録 ${r.count} 件）` : `「${r.name}」を書き出しました（記録 ${r.count} 件）`);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPending(parseBackup(await f.text()));
      setMessage('');
    } catch (e) {
      setMessage(`読み込めませんでした：${(e as Error).message}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const doImport = async () => {
    if (!pending) return;
    const r = await importBackup(pending);
    setPending(null);
    setMessage(
      `読み込みました：記録 ${r.added.sets} 件、日 ${r.added.sessions} 件、種目 ${r.added.exercises} 件、目標 ${r.added.goals} 件を追加` +
        (r.skipped ? `（すでにある ${r.skipped} 件は除外）` : ''),
    );
  };

  return (
    <Section title="バックアップ" note="機種変更やブラウザを変えるときに使います">
      <p className={styles.formula}>
        最後の書き出し：{last ? formatDate(toDateKey(new Date(last))) : 'まだありません'}
      </p>
      <Row label="お知らせの間隔" hint="最後の書き出しからこの日数で、記録画面にお知らせを出します">
        <NumberField
          value={settings.backup.intervalDays}
          unit="日"
          min={1}
          integer
          onCommit={(v) => onSave({ backup: { ...settings.backup, intervalDays: v } })}
        />
      </Row>
      <button type="button" className={`btn btn-primary ${styles.wide}`} onClick={doExport}>
        JSON に書き出す
      </button>
      <button type="button" className={`btn ${styles.wide}`} onClick={() => fileRef.current?.click()}>
        JSON を読み込む（今のデータに追加）
      </button>
      <input
        ref={fileRef}
        className={styles.fileInput}
        type="file"
        accept="application/json,.json"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {message && <p className={styles.message}>{message}</p>}

      {pending && (
        <ConfirmDialog
          message={`バックアップ（${formatShortDate(toDateKey(new Date(pending.exportedAt)))} 書き出し、記録 ${pending.sets.length} 件）を今のデータに追加します。同じ記録は二重に入りません。`}
          okLabel="読み込む"
          onOk={doImport}
          onCancel={() => setPending(null)}
        />
      )}
    </Section>
  );
}
