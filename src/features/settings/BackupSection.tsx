import { useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/Sheet';
import { exportBackup, importBackup, parseBackup, type BackupFile } from '../../db/backup';
import { formatShortDate, toDateKey } from '../../domain/date';
import { Section } from './SettingsScreen';
import styles from './Settings.module.css';

export function BackupSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);

  const doExport = async () => {
    const b = await exportBackup();
    const name = `workout-backup-${toDateKey().replace(/-/g, '')}.json`;
    const file = new File([JSON.stringify(b, null, 1)], name, { type: 'application/json' });
    // iPhone では共有シートから「ファイルに保存」できる
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        setMessage(`書き出しました（記録 ${b.sets.length} 件）`);
      } catch {
        /* 共有をやめたとき */
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`「${name}」を書き出しました（記録 ${b.sets.length} 件）`);
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
