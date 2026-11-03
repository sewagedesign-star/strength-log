import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { newId } from '../../db/db';
import { saveExercise } from '../../db/repo';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  EQUIPMENTS,
  EQUIPMENT_LABEL,
  type Category,
  type Equipment,
  type Exercise,
} from '../../domain/types';
import { fmtNum } from '../../data';
import { NumberField, Section } from './SettingsScreen';
import styles from './Settings.module.css';

type Kind = 'weight' | 'bodyweight' | 'assisted';
const KIND_LABEL: Record<Kind, string> = { weight: '重量を入れる', bodyweight: '自重', assisted: '補助あり/自重/ネガ' };
const kindOf = (e: Exercise): Kind => (e.isAssisted ? 'assisted' : e.isBodyweight ? 'bodyweight' : 'weight');

export function ExerciseSection({ exercises }: { exercises: Exercise[] }) {
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null);

  return (
    <Section title="種目" note="表示をオフにすると、記録画面の一覧に出なくなります（記録は残ります）">
      {EQUIPMENTS.map((eq) => {
        const list = exercises.filter((e) => e.equipment === eq);
        if (list.length === 0) return null;
        return (
          <div key={eq}>
            <h3 className={styles.h3}>{EQUIPMENT_LABEL[eq]}</h3>
            {list.map((e) => (
              <div key={e.id} className={`${styles.exRow} ${e.visible ? '' : styles.hidden}`}>
                <button type="button" className={styles.exMain} onClick={() => setEditing(e)}>
                  <span className={styles.exName}>{e.name}</span>
                  <span className="sub">
                    {CATEGORY_LABEL[e.category]}
                    {kindOf(e) === 'weight' ? `・刻み ${fmtNum(e.step)}kg` : `・体重×${fmtNum(e.bodyweightRatio)}`}
                  </span>
                </button>
                <button
                  type="button"
                  className={`${styles.toggle} ${e.visible ? styles.toggleOn : ''}`}
                  aria-pressed={e.visible}
                  aria-label={`${e.name}を${e.visible ? '非表示にする' : '表示する'}`}
                  onClick={() => saveExercise({ ...e, visible: !e.visible })}
                >
                  {e.visible ? '表示' : '非表示'}
                </button>
              </div>
            ))}
          </div>
        );
      })}
      <button type="button" className={`btn ${styles.wide}`} onClick={() => setEditing('new')}>
        ＋ 種目を追加
      </button>

      {editing && (
        <ExerciseDialog
          exercise={editing === 'new' ? undefined : editing}
          nextOrder={exercises.reduce((m, e) => Math.max(m, e.order), 0) + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </Section>
  );
}

function ExerciseDialog({ exercise, nextOrder, onClose }: { exercise?: Exercise; nextOrder: number; onClose: () => void }) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [category, setCategory] = useState<Category>(exercise?.category ?? 'chest');
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? 'dumbbell');
  const [kind, setKind] = useState<Kind>(exercise ? kindOf(exercise) : 'weight');
  const [step, setStep] = useState(exercise?.step ?? 1);
  const [ratio, setRatio] = useState(exercise?.bodyweightRatio ?? 1);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim()) return setError('名前を入れてください');
    await saveExercise({
      id: exercise?.id ?? newId(),
      name: name.trim(),
      category,
      equipment,
      isAssisted: kind === 'assisted',
      isBodyweight: kind === 'bodyweight',
      bodyweightRatio: ratio,
      step,
      visible: exercise?.visible ?? true,
      isCustom: exercise?.isCustom ?? true,
      order: exercise?.order ?? nextOrder,
    });
    onClose();
  };

  return (
    <Sheet title={exercise ? '種目の編集' : '種目を追加'} onClose={onClose}>
      <div className={styles.form}>
        <label className={styles.formLabel}>
          <span>名前</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：サイドレイズ" />
        </label>
        <div className={styles.formLabel}>
          <span>分類</span>
          <div className={styles.choices}>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={category === c ? styles.on : ''} onClick={() => setCategory(c)}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <label className={styles.formLabel}>
          <span>器具</span>
          <select className="field" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
            {EQUIPMENTS.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABEL[eq]}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.formLabel}>
          <span>入力のしかた</span>
          <div className={styles.choices}>
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <button key={k} type="button" className={kind === k ? styles.on : ''} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        {kind !== 'bodyweight' && (
          <div className={styles.row}>
            <div className={styles.rowLabel}>{kind === 'assisted' ? '補助重量の刻み' : '重量の刻み'}</div>
            <div className={styles.rowField}>
              <NumberField value={step} unit="kg" onCommit={setStep} />
            </div>
          </div>
        )}
        {kind !== 'weight' && (
          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <span>体重の何倍とみなすか</span>
              <span className={styles.hint}>腕立て 0.65、チンニング 1.0 など</span>
            </div>
            <div className={styles.rowField}>
              <NumberField value={ratio} unit="倍" onCommit={setRatio} />
            </div>
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={onClose}>
            やめる
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            保存
          </button>
        </div>
      </div>
    </Sheet>
  );
}
