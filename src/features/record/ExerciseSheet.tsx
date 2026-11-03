import { useEffect, useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { SetFields, draftFrom, draftToInput, type SetDraft } from '../../components/SetFields';
import { useCelebrate, useToast } from '../../components/Toast';
import { playFanfare, playSave, primeAudio } from '../../sound';
import { addSets, lastValues, type LastValues } from '../../db/repo';
import { formatShortDate } from '../../domain/date';
import type { Exercise, SetRecord, Settings } from '../../domain/types';
import { CHIN_MODE_LABEL } from '../../domain/types';
import { fmtNum } from '../../data';
import { saveAndReport } from './xpReport';
import styles from './ExerciseSheet.module.css';

interface Props {
  date: string;
  exercise: Exercise;
  settings: Settings;
  /** 今日この種目で記録済みのセット */
  todaySets: SetRecord[];
  onClose: () => void;
}

const SET_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

/** 1セットを短く表示：「20kg×10 R8」「補助25kg×8 R8」 */
export function setSummary(s: Pick<SetRecord, 'weight' | 'mode' | 'assistWeight' | 'reps' | 'rpe'>): string {
  let load = '';
  if (s.mode === 'assisted') load = `補助${fmtNum(s.assistWeight ?? 0)}kg`;
  else if (s.mode) load = CHIN_MODE_LABEL[s.mode];
  else if (s.weight != null) load = `${fmtNum(s.weight)}kg`;
  else load = '自重';
  return `${load}×${s.reps} R${s.rpe}`;
}

export function ExerciseSheet({ date, exercise, settings, todaySets, onClose }: Props) {
  const { bodyWeight, sound } = settings;
  const toast = useToast();
  const celebrate = useCelebrate();
  const [last, setLast] = useState<LastValues | null | undefined>(undefined);
  const [draft, setDraft] = useState<SetDraft>(() => draftFrom(null));
  const [sets, setSets] = useState(3);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // 初期値は前回の同種目の最終セット（なければ 重量空・10回・3セット・RPE8）
  useEffect(() => {
    let alive = true;
    lastValues(exercise.id).then((v) => {
      if (!alive) return;
      setLast(v);
      setDraft(draftFrom(v ? { ...v, note: '' } : null));
      setSets(v?.sets ?? 3);
    });
    return () => {
      alive = false;
    };
  }, [exercise.id]);

  const save = async (count: number, close: boolean) => {
    const input = draftToInput(draft, exercise);
    if (typeof input === 'string') {
      setError(input);
      return;
    }
    setError('');
    setBusy(true);
    if (sound) primeAudio(); // iPhone では押した瞬間に音の準備が必要
    try {
      const report = await saveAndReport(date, () => addSets(date, exercise.id, input, count));
      toast(report.toast);
      celebrate(report.celebrations);
      if (sound) (report.celebrations.length ? playFanfare : playSave)();
      if (close) onClose();
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...todaySets].sort((a, b) => a.setNo - b.setNo);

  return (
    <Sheet title={exercise.name} onClose={onClose}>
      <div className={styles.info}>
        {last === undefined ? (
          <span className="sub">読み込み中…</span>
        ) : last ? (
          <span className="sub">
            前回 {formatShortDate(last.date)}：{setSummary(last)} × {last.sets}セット
          </span>
        ) : (
          <span className="sub">初めての種目です（初挑戦ボーナスあり）</span>
        )}
        {sorted.length > 0 && (
          <div className={styles.today}>
            今日：
            {sorted.map((s) => (
              <span key={s.id} className={styles.chip}>
                {s.setNo}. {setSummary(s)}
              </span>
            ))}
          </div>
        )}
      </div>

      {last !== undefined && (
        <>
          <SetFields exercise={exercise} bodyWeight={bodyWeight} value={draft} onChange={setDraft} bars={settings.bars} />

          <label className={styles.setsRow}>
            <span className={styles.label}>セット数</span>
            <select className="field" value={sets} onChange={(e) => setSets(Number(e.target.value))}>
              {SET_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} セット
                </option>
              ))}
            </select>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className="btn" disabled={busy} onClick={() => save(1, false)}>
              同じ内容で
              <br />
              次のセット（＋1）
            </button>
            <button type="button" className={`btn btn-primary ${styles.save}`} disabled={busy} onClick={() => save(sets, true)}>
              保存（{sets}セット）
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
