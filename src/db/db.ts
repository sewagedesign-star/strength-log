import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_EXERCISES, DEFAULT_GOALS, DEFAULT_SETTINGS } from '../domain/defaults';
import type { Exercise, Goal, Session, SetRecord, Settings } from '../domain/types';

export class WorkoutDb extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  sets!: EntityTable<SetRecord, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor(name = 'workout-app') {
    super(name);
    this.version(1).stores({
      exercises: 'id, category, equipment, order',
      sessions: 'id, &date',
      sets: 'id, sessionId, exerciseId, createdAt',
      goals: 'id, exerciseId, order',
      settings: 'id',
    });
    // 初回だけ初期データを入れる
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(DEFAULT_EXERCISES);
      tx.table('goals').bulkAdd(DEFAULT_GOALS);
      tx.table('settings').add(DEFAULT_SETTINGS);
    });
  }
}

export const db = new WorkoutDb();

/** ID（UUID）。crypto.randomUUID が使えない環境（http の LAN 接続など）では代替を使う */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
