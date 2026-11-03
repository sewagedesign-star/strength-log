import { DEFAULT_SETTINGS } from '../domain/defaults';
import type { Category, ChinMode, Exercise, Goal, Rpe, Session, SetRecord, Settings } from '../domain/types';
import { db as defaultDb, newId, type WorkoutDb } from './db';

/** 入力欄の値（1セット分） */
export interface SetInput {
  weight: number | null;
  mode?: ChinMode;
  assistWeight?: number;
  reps: number;
  rpe: Rpe;
  note: string;
}

/** 前回値：直近の記録の最終セット＋その日のセット数 */
export interface LastValues extends SetInput {
  sets: number;
  date: string;
}

export interface AllData {
  exercises: Exercise[];
  sessions: Session[];
  sets: SetRecord[];
  goals: Goal[];
  settings: Settings;
}

/** 保存済みの設定に、後から増えた項目の既定値を補う */
export function withDefaults(s: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    id: 'main',
    rpeFactors: { ...DEFAULT_SETTINGS.rpeFactors, ...s?.rpeFactors },
    bonus: { ...DEFAULT_SETTINGS.bonus, ...s?.bonus },
    level: { ...DEFAULT_SETTINGS.level, ...s?.level },
    titles: s?.titles?.length ? s.titles : DEFAULT_SETTINGS.titles,
  };
}

export async function getSettings(d: WorkoutDb = defaultDb): Promise<Settings> {
  return withDefaults(await d.settings.get('main'));
}

export async function saveSettings(s: Settings, d: WorkoutDb = defaultDb): Promise<void> {
  await d.settings.put({ ...s, id: 'main' });
}

export async function loadAll(d: WorkoutDb = defaultDb): Promise<AllData> {
  const [exercises, sessions, sets, goals, settings] = await Promise.all([
    d.exercises.orderBy('order').toArray(),
    d.sessions.toArray(),
    d.sets.toArray(),
    d.goals.orderBy('order').toArray(),
    getSettings(d),
  ]);
  return { exercises, sessions, sets, goals, settings };
}

export async function getSessionByDate(date: string, d: WorkoutDb = defaultDb): Promise<Session | undefined> {
  return d.sessions.where('date').equals(date).first();
}

export async function ensureSession(date: string, d: WorkoutDb = defaultDb): Promise<Session> {
  return d.transaction('rw', d.sessions, async () => {
    const found = await getSessionByDate(date, d);
    if (found) return found;
    const s: Session = { id: newId(), date, exerciseIds: [] };
    await d.sessions.add(s);
    return s;
  });
}

/** 今日のメニュー（チェックした種目）を保存する */
export async function setMenu(date: string, exerciseIds: string[], d: WorkoutDb = defaultDb): Promise<void> {
  const s = await ensureSession(date, d);
  await d.sessions.update(s.id, { exerciseIds });
}

/** 同じ値のセットを count 件追加する。セット番号はその日の続きから */
export async function addSets(
  date: string,
  exerciseId: string,
  input: SetInput,
  count: number,
  d: WorkoutDb = defaultDb,
): Promise<SetRecord[]> {
  return d.transaction('rw', d.sessions, d.sets, async () => {
    const session = await ensureSession(date, d);
    if (!session.exerciseIds.includes(exerciseId)) {
      await d.sessions.update(session.id, { exerciseIds: [...session.exerciseIds, exerciseId] });
    }
    const existing = await d.sets.where('sessionId').equals(session.id).filter((s) => s.exerciseId === exerciseId).toArray();
    const startNo = existing.reduce((m, s) => Math.max(m, s.setNo), 0);
    const now = Date.now();
    const records: SetRecord[] = Array.from({ length: count }, (_, i) => ({
      id: newId(),
      sessionId: session.id,
      exerciseId,
      weight: input.weight,
      ...(input.mode ? { mode: input.mode } : {}),
      ...(input.mode === 'assisted' ? { assistWeight: input.assistWeight ?? 0 } : {}),
      reps: input.reps,
      setNo: startNo + i + 1,
      rpe: input.rpe,
      note: input.note,
      createdAt: now + i,
    }));
    await d.sets.bulkAdd(records);
    return records;
  });
}

/** 同じ種目の直近の記録（最終セット）と、その日のセット数 */
export async function lastValues(exerciseId: string, d: WorkoutDb = defaultDb): Promise<LastValues | null> {
  const all = await d.sets.where('exerciseId').equals(exerciseId).sortBy('createdAt');
  const last = all.at(-1);
  if (!last) return null;
  const session = await d.sessions.get(last.sessionId);
  const sameDay = all.filter((s) => s.sessionId === last.sessionId);
  return {
    weight: last.weight,
    mode: last.mode,
    assistWeight: last.assistWeight,
    reps: last.reps,
    rpe: last.rpe,
    note: last.note,
    sets: sameDay.length,
    date: session?.date ?? '',
  };
}

/** 指定日より前で、記録のある直近の日とその分類 */
export async function lastSessionBefore(
  date: string,
  d: WorkoutDb = defaultDb,
): Promise<{ date: string; categories: Category[] } | null> {
  const sessions = await d.sessions.where('date').below(date).reverse().sortBy('date');
  for (const s of sessions) {
    const sets = await d.sets.where('sessionId').equals(s.id).sortBy('createdAt');
    if (sets.length === 0) continue;
    const exIds = [...new Set(sets.map((x) => x.exerciseId))];
    const exs = await d.exercises.bulkGet(exIds);
    const cats: Category[] = [];
    for (const e of exs) if (e && !cats.includes(e.category)) cats.push(e.category);
    return { date: s.date, categories: cats };
  }
  return null;
}

export async function updateSet(id: string, patch: Partial<SetRecord>, d: WorkoutDb = defaultDb): Promise<void> {
  await d.sets.update(id, patch);
}

export async function deleteSet(id: string, d: WorkoutDb = defaultDb): Promise<void> {
  await d.sets.delete(id);
}

export async function saveExercise(ex: Exercise, d: WorkoutDb = defaultDb): Promise<void> {
  await d.exercises.put(ex);
}

export async function saveGoal(g: Goal, d: WorkoutDb = defaultDb): Promise<void> {
  await d.goals.put(g);
}

export async function deleteGoal(id: string, d: WorkoutDb = defaultDb): Promise<void> {
  await d.goals.delete(id);
}
