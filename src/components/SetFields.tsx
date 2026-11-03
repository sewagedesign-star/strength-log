import { useState, type Dispatch, type SetStateAction } from 'react';
import type { SetInput } from '../db/repo';
import { CHIN_MODE_LABEL, RPES, type ChinMode, type Exercise, type Rpe, type Settings } from '../domain/types';
import { barTypeOf } from '../domain/plates';
import { PlateView } from './PlateView';
import { fmtNum } from '../data';
import styles from './SetFields.module.css';

/** 入力欄の状態。数値は入力途中の文字のまま持つ */
export interface SetDraft {
  weight: string;
  mode: ChinMode;
  assist: string;
  reps: number;
  rpe: Rpe;
  note: string;
}

export function draftFrom(v: Partial<SetInput> | null): SetDraft {
  return {
    weight: v?.weight != null ? fmtNum(v.weight) : '',
    mode: v?.mode ?? 'assisted',
    assist: v?.assistWeight != null ? fmtNum(v.assistWeight) : '',
    reps: v?.reps ?? 10,
    rpe: v?.rpe ?? 8,
    note: v?.note ?? '',
  };
}

const parseNum = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
};

/** 入力欄 → 保存する値。足りないときはエラー文を返す */
export function draftToInput(d: SetDraft, ex: Exercise): SetInput | string {
  const base = { reps: d.reps, rpe: d.rpe, note: d.note.trim() };
  if (ex.isAssisted) {
    if (d.mode === 'assisted') {
      const a = parseNum(d.assist);
      if (a === null) return '補助重量を入れてください';
      return { ...base, weight: null, mode: 'assisted', assistWeight: a };
    }
    return { ...base, weight: null, mode: d.mode };
  }
  if (ex.isBodyweight) return { ...base, weight: null };
  const w = parseNum(d.weight);
  if (w === null || w === 0) return '重量を入れてください';
  return { ...base, weight: w };
}

export const REP_OPTIONS = Array.from({ length: 31 }, (_, i) => i);

interface Props {
  exercise: Exercise;
  bodyWeight: number;
  value: SetDraft;
  onChange: Dispatch<SetStateAction<SetDraft>>;
  /** プレート計算用（バーベル・EZバー種目のとき） */
  bars?: Settings['bars'];
}

export function SetFields({ exercise, bodyWeight, value, onChange, bars }: Props) {
  const barType = barTypeOf(exercise.equipment);
  const [noteOpen, setNoteOpen] = useState(value.note !== '');
  const set = (p: Partial<SetDraft>) => onChange((d) => ({ ...d, ...p }));
  // 連続タップでも取りこぼさないよう、最新の値から増減する
  const bump = (key: 'weight' | 'assist', dir: 1 | -1) =>
    onChange((d) => ({ ...d, [key]: stepValue(d[key], dir, exercise.step) }));

  return (
    <div className={styles.fields}>
      {exercise.isAssisted ? (
        <>
          <div className={styles.segment} role="radiogroup" aria-label="やり方">
            {(Object.keys(CHIN_MODE_LABEL) as ChinMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={value.mode === m}
                className={value.mode === m ? styles.on : ''}
                onClick={() => set({ mode: m })}
              >
                {CHIN_MODE_LABEL[m]}
              </button>
            ))}
          </div>
          {value.mode === 'assisted' ? (
            <Stepper
              label="補助"
              value={value.assist}
              step={exercise.step}
              onChange={(assist) => set({ assist })}
              onBump={(dir) => bump('assist', dir)}
            />
          ) : (
            <p className={styles.bw}>
              {value.mode === 'negative' ? 'ネガティブ' : '自重'}（体重 {fmtNum(bodyWeight)}kg）
            </p>
          )}
        </>
      ) : exercise.isBodyweight ? (
        <p className={styles.bw}>自重（体重 {fmtNum(bodyWeight)}kg）</p>
      ) : (
        <>
          <Stepper
            label="重量"
            value={value.weight}
            step={exercise.step}
            onChange={(weight) => set({ weight })}
            onBump={(dir) => bump('weight', dir)}
          />
          {barType && bars && (
            <PlateView weight={parseNum(value.weight)} bar={bars[barType]} label={barType === 'ezbar' ? 'EZバー' : 'バー'} />
          )}
        </>
      )}

      <label className={styles.row}>
        <span className={styles.label}>回数</span>
        <select className="field" value={value.reps} onChange={(e) => set({ reps: Number(e.target.value) })}>
          {REP_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} 回
            </option>
          ))}
        </select>
      </label>

      <div className={styles.row}>
        <span className={styles.label}>RPE</span>
        <div className={styles.rpe} role="radiogroup" aria-label="RPE">
          {RPES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={value.rpe === r}
              className={value.rpe === r ? styles.on : ''}
              onClick={() => set({ rpe: r })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {noteOpen ? (
        <textarea
          className={`field ${styles.note}`}
          rows={2}
          placeholder="メモ（任意）"
          value={value.note}
          onChange={(e) => set({ note: e.target.value })}
        />
      ) : (
        <button type="button" className={styles.noteToggle} onClick={() => setNoteOpen(true)}>
          ＋ メモ
        </button>
      )}
    </div>
  );
}

interface StepperProps {
  label: string;
  value: string;
  step: number;
  onChange: (v: string) => void;
  onBump: (dir: 1 | -1) => void;
}

function stepValue(v: string, dir: 1 | -1, step: number): string {
  const cur = parseNum(v) ?? 0;
  return fmtNum(Math.max(0, Math.round((cur + dir * step) * 100) / 100));
}

/** 「−」「＋」と直接入力の重量欄 */
export function Stepper({ label, value, step, onChange, onBump: bump }: StepperProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.stepper}>
        <button type="button" onClick={() => bump(-1)} aria-label={`${label}を${fmtNum(step)}kg減らす`}>
          −
        </button>
        <div className={styles.numWrap}>
          <input
            className={styles.num}
            type="text"
            inputMode="decimal"
            value={value}
            placeholder="—"
            aria-label={`${label}（kg）`}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
            onFocus={(e) => e.target.select()}
          />
          <span className={styles.unit}>kg</span>
        </div>
        <button type="button" onClick={() => bump(1)} aria-label={`${label}を${fmtNum(step)}kg増やす`}>
          ＋
        </button>
      </div>
    </div>
  );
}
