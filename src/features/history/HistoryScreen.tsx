import { useMemo, useState } from 'react';
import { ConfirmDialog, Sheet } from '../../components/Sheet';
import { SetFields, draftFrom, draftToInput, type SetDraft } from '../../components/SetFields';
import { deleteSet, updateSet } from '../../db/repo';
import { formatDate } from '../../domain/date';
import { CATEGORIES, CATEGORY_LABEL, type Category, type Exercise, type SetRecord } from '../../domain/types';
import { fmtNum, useAllData, useXp } from '../../data';
import { setSummary } from '../record/ExerciseSheet';
import styles from './HistoryScreen.module.css';

export function HistoryScreen() {
  const data = useAllData();
  const xp = useXp(data);
  const [filter, setFilter] = useState<Category | null>(null);
  const [editing, setEditing] = useState<SetRecord | null>(null);

  const days = useMemo(() => {
    if (!data) return [];
    const exMap = new Map(data.exercises.map((e) => [e.id, e]));
    return [...data.sessions]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((session) => {
        const sets = data.sets
          .filter((s) => s.sessionId === session.id)
          .filter((s) => !filter || exMap.get(s.exerciseId)?.category === filter);
        // 種目ごとにまとめる（記録した順）
        const groups = new Map<string, SetRecord[]>();
        for (const s of [...sets].sort((a, b) => a.createdAt - b.createdAt)) {
          groups.set(s.exerciseId, [...(groups.get(s.exerciseId) ?? []), s]);
        }
        return {
          session,
          groups: [...groups].map(([id, list]) => ({ ex: exMap.get(id), list: list.sort((a, b) => a.setNo - b.setNo) })),
        };
      })
      .filter((d) => d.groups.length > 0);
  }, [data, filter]);

  if (!data || !xp) return null;
  const xpByDate = new Map(xp.sessions.map((s) => [s.sessionId, s.total]));
  const editingEx = editing ? data.exercises.find((e) => e.id === editing.exerciseId) : undefined;

  return (
    <div className={styles.screen}>
      <h1 className={styles.h1}>履歴</h1>
      <div className={styles.filters} role="tablist" aria-label="分類で絞り込み">
        {[null, ...CATEGORIES].map((c) => (
          <button
            key={c ?? 'all'}
            type="button"
            role="tab"
            aria-selected={filter === c}
            className={filter === c ? styles.on : ''}
            onClick={() => setFilter(c)}
          >
            {c ? CATEGORY_LABEL[c] : 'すべて'}
          </button>
        ))}
      </div>

      {days.length === 0 && <p className="sub">記録がありません</p>}

      {days.map(({ session, groups }) => (
        <section key={session.id} className={`card ${styles.day}`}>
          <div className={styles.dayHead}>
            <h2 className={styles.date}>{formatDate(session.date)}</h2>
            {!filter && <span className={styles.xp}>+{fmtNum(xpByDate.get(session.id) ?? 0)} XP</span>}
          </div>
          {groups.map(({ ex, list }) => (
            <div key={list[0].exerciseId} className={styles.group}>
              <h3 className={styles.exName}>{ex?.name ?? '（削除された種目）'}</h3>
              {list.map((s) => (
                <button key={s.id} type="button" className={styles.set} onClick={() => setEditing(s)}>
                  <span className={styles.setNo}>{s.setNo}</span>
                  <span className={styles.setBody}>{setSummary(s).replace(/ R(\d+)$/, '回')}</span>
                  <span className="sub">RPE{s.rpe}</span>
                  {s.note && <span className={styles.note}>📝</span>}
                </button>
              ))}
            </div>
          ))}
        </section>
      ))}

      {editing && editingEx && (
        <EditSetDialog key={editing.id} record={editing} exercise={editingEx} bodyWeight={data.settings.bodyWeight} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EditSetDialog({
  record,
  exercise,
  bodyWeight,
  onClose,
}: {
  record: SetRecord;
  exercise: Exercise;
  bodyWeight: number;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SetDraft>(() => draftFrom(record));
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const save = async () => {
    const input = draftToInput(draft, exercise);
    if (typeof input === 'string') return setError(input);
    await updateSet(record.id, {
      weight: input.weight,
      mode: input.mode,
      assistWeight: input.mode === 'assisted' ? input.assistWeight : undefined,
      reps: input.reps,
      rpe: input.rpe,
      note: input.note,
    });
    onClose();
  };

  if (confirm) {
    return (
      <ConfirmDialog
        message={`${exercise.name} の ${record.setNo}セット目（${setSummary(record)}）を削除します。元に戻せません。`}
        okLabel="削除する"
        danger
        onOk={async () => {
          await deleteSet(record.id);
          onClose();
        }}
        onCancel={() => setConfirm(false)}
      />
    );
  }

  return (
    <Sheet title={`${exercise.name}　${record.setNo}セット目`} onClose={onClose}>
      <SetFields exercise={exercise} bodyWeight={bodyWeight} value={draft} onChange={setDraft} />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
          削除
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>
          変更を保存
        </button>
      </div>
    </Sheet>
  );
}
