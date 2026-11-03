import { useState } from 'react';
import { ConfirmDialog, Sheet } from '../../components/Sheet';
import { REP_OPTIONS } from '../../components/SetFields';
import { newId } from '../../db/db';
import { deleteGoal, saveGoal } from '../../db/repo';
import { goalLabel } from '../../domain/goals';
import { CHIN_MODE_LABEL, type ChinMode, type Exercise, type Goal } from '../../domain/types';
import { NumberField, Section } from './SettingsScreen';
import styles from './Settings.module.css';

export function GoalSection({ goals, exercises }: { goals: Goal[]; exercises: Exercise[] }) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Goal | null>(null);
  const exMap = new Map(exercises.map((e) => [e.id, e]));

  return (
    <Section title="種目目標" note="キャラ画面の「次の目標」に出ます。記録から達成を自動で判定します">
      {goals.map((g) => (
        <div key={g.id} className={styles.goalRow}>
          <span>{goalLabel(g, exMap.get(g.exerciseId))}</span>
          <button type="button" className="btn btn-danger" onClick={() => setRemoving(g)}>
            削除
          </button>
        </div>
      ))}
      <button type="button" className={`btn ${styles.wide}`} onClick={() => setAdding(true)}>
        ＋ 目標を追加
      </button>

      {adding && (
        <GoalDialog
          exercises={exercises}
          nextOrder={goals.reduce((m, g) => Math.max(m, g.order), 0) + 1}
          onClose={() => setAdding(false)}
        />
      )}
      {removing && (
        <ConfirmDialog
          message={`目標「${goalLabel(removing, exMap.get(removing.exerciseId))}」を削除します。`}
          okLabel="削除する"
          danger
          onOk={async () => {
            await deleteGoal(removing.id);
            setRemoving(null);
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </Section>
  );
}

function GoalDialog({ exercises, nextOrder, onClose }: { exercises: Exercise[]; nextOrder: number; onClose: () => void }) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '');
  const [weight, setWeight] = useState(20);
  const [mode, setMode] = useState<ChinMode>('bodyweight');
  const [reps, setReps] = useState(10);
  const ex = exercises.find((e) => e.id === exerciseId);

  const save = async () => {
    if (!ex) return;
    const goal: Goal = { id: newId(), exerciseId, reps, order: nextOrder };
    if (ex.isAssisted) goal.mode = mode;
    else if (!ex.isBodyweight) goal.weight = weight;
    await saveGoal(goal);
    onClose();
  };

  return (
    <Sheet title="目標を追加" onClose={onClose}>
      <div className={styles.form}>
        <label className={styles.formLabel}>
          <span>種目</span>
          <select className="field" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        {ex?.isAssisted ? (
          <div className={styles.formLabel}>
            <span>やり方</span>
            <div className={styles.choices}>
              {(Object.keys(CHIN_MODE_LABEL) as ChinMode[]).map((m) => (
                <button key={m} type="button" className={mode === m ? styles.on : ''} onClick={() => setMode(m)}>
                  {m === 'bodyweight' ? '補助なし' : CHIN_MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          !ex?.isBodyweight && (
            <div className={styles.row}>
              <div className={styles.rowLabel}>重量</div>
              <div className={styles.rowField}>
                <NumberField value={weight} unit="kg" onCommit={setWeight} />
              </div>
            </div>
          )
        )}
        <label className={styles.row}>
          <div className={styles.rowLabel}>回数</div>
          <div className={styles.rowField}>
            <select className="field" value={reps} onChange={(e) => setReps(Number(e.target.value))}>
              {REP_OPTIONS.filter((n) => n > 0).map((n) => (
                <option key={n} value={n}>
                  {n} 回
                </option>
              ))}
            </select>
          </div>
        </label>
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={onClose}>
            やめる
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            追加
          </button>
        </div>
      </div>
    </Sheet>
  );
}
