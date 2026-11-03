import type { Exercise, Goal, Session, SetRecord, Settings } from '../domain/types';
import { DEFAULT_REST, REST_FALLBACK } from '../domain/defaults';
import { db as defaultDb, type WorkoutDb } from './db';
import { loadAll } from './repo';

export interface BackupFile {
  app: 'workout-app';
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  sessions: Session[];
  sets: SetRecord[];
  goals: Goal[];
  settings: Settings;
}

export async function exportBackup(d: WorkoutDb = defaultDb): Promise<BackupFile> {
  const all = await loadAll(d);
  return { app: 'workout-app', version: 1, exportedAt: new Date().toISOString(), ...all };
}

export interface ImportResult {
  added: { exercises: number; sessions: number; sets: number; goals: number };
  skipped: number;
}

export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON として読めません');
  }
  const b = data as Partial<BackupFile>;
  if (b?.app !== 'workout-app' || !Array.isArray(b.sets) || !Array.isArray(b.sessions) || !Array.isArray(b.exercises)) {
    throw new Error('このアプリのバックアップではありません');
  }
  return { goals: [], ...b } as BackupFile;
}

/**
 * 既存データに追加する。ID が重複するものは除外する。
 * 同じ日付のセッションが別IDで既にあるときは、記録をそちらにまとめる（1日1件を保つ）。
 * 設定は今の端末のものを残す。
 */
export async function importBackup(b: BackupFile, d: WorkoutDb = defaultDb): Promise<ImportResult> {
  return d.transaction('rw', [d.exercises, d.sessions, d.sets, d.goals], async () => {
    const added = { exercises: 0, sessions: 0, sets: 0, goals: 0 };
    let skipped = 0;

    const exIds = new Set(await d.exercises.toCollection().primaryKeys());
    // 古いバックアップの種目には休憩時間がないので補う
    const newEx = b.exercises
      .filter((e) => !exIds.has(e.id))
      .map((e) => ({ ...e, restSec: e.restSec ?? DEFAULT_REST[e.id] ?? REST_FALLBACK }));
    skipped += b.exercises.length - newEx.length;
    await d.exercises.bulkAdd(newEx);
    added.exercises = newEx.length;

    const existingSessions = await d.sessions.toArray();
    const byId = new Map(existingSessions.map((s) => [s.id, s]));
    const byDate = new Map(existingSessions.map((s) => [s.date, s]));
    const remap = new Map<string, string>();
    for (const s of b.sessions) {
      if (byId.has(s.id)) {
        skipped++;
        continue;
      }
      const sameDay = byDate.get(s.date);
      if (sameDay) {
        remap.set(s.id, sameDay.id);
        const merged = [...new Set([...sameDay.exerciseIds, ...(s.exerciseIds ?? [])])];
        sameDay.exerciseIds = merged;
        await d.sessions.update(sameDay.id, { exerciseIds: merged });
        continue;
      }
      const session: Session = { id: s.id, date: s.date, exerciseIds: s.exerciseIds ?? [] };
      await d.sessions.add(session);
      byId.set(s.id, session);
      byDate.set(s.date, session);
      added.sessions++;
    }

    const setIds = new Set(await d.sets.toCollection().primaryKeys());
    const newSets = b.sets
      .filter((s) => !setIds.has(s.id))
      .map((s) => ({ ...s, sessionId: remap.get(s.sessionId) ?? s.sessionId }));
    skipped += b.sets.length - newSets.length;
    await d.sets.bulkAdd(newSets);
    added.sets = newSets.length;

    const goalIds = new Set(await d.goals.toCollection().primaryKeys());
    const newGoals = b.goals.filter((g) => !goalIds.has(g.id));
    skipped += b.goals.length - newGoals.length;
    await d.goals.bulkAdd(newGoals);
    added.goals = newGoals.length;

    return { added, skipped };
  });
}
