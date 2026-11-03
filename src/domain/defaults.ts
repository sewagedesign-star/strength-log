import type { Exercise, Goal, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  bodyWeight: 79,
  rpeFactors: { 6: 0.6, 7: 0.8, 8: 1.0, 9: 1.2, 10: 1.4 },
  negativeRatio: 0.5,
  bonus: { firstTry: 50, personalBest: 100, weeklyQuest: 200, weeklyDays: 3 },
  level: { base: 200, perLevel: 50, max: 99 },
  titles: [
    { minLevel: 1, name: '初心者' },
    { minLevel: 10, name: '初級者' },
    { minLevel: 20, name: '中級者' },
    { minLevel: 35, name: '上級者' },
    { minLevel: 50, name: '達人' },
    { minLevel: 70, name: '伝説' },
  ],
  sound: true,
  bars: {
    // バーベルはまだ買っていないので、一般的なプレートを枚数の制限なしで仮に置く
    barbell: { weight: 20, plates: [20, 15, 10, 5, 2.5, 1.25].map((weight) => ({ weight, count: null })) },
    // EZバー本体の重さは仮の値（設定で変更）
    ezbar: { weight: 10, plates: [10, 5, 2.5, 1.25].map((weight) => ({ weight, count: null })) },
  },
  backup: { intervalDays: 30 },
};

/** 種目ごとの休憩時間の初期値（秒）。表にない種目は 90 秒 */
export const DEFAULT_REST: Record<string, number> = {
  'db-press': 120,
  'db-squat': 120,
  rdl: 120,
  chinning: 120,
  'bent-over-row': 120,
  'bench-press': 180,
  'bb-squat': 180,
  deadlift: 180,
  'db-curl': 60,
  'ez-curl': 60,
  'ez-triceps': 60,
  'push-up': 60,
  abs: 60,
};
export const REST_FALLBACK = 90;

type Seed = Pick<Exercise, 'id' | 'name' | 'category' | 'equipment'> & Partial<Exercise>;

const SEED: Seed[] = [
  { id: 'db-press', name: 'ダンベルプレス', category: 'chest', equipment: 'dumbbell' },
  { id: 'db-fly', name: 'ダンベルフライ', category: 'chest', equipment: 'dumbbell' },
  { id: 'db-shoulder-press', name: 'ダンベルショルダープレス', category: 'armsShoulders', equipment: 'dumbbell' },
  { id: 'db-row', name: 'ダンベルローイング', category: 'back', equipment: 'dumbbell' },
  { id: 'db-squat', name: 'ダンベルスクワット', category: 'legs', equipment: 'dumbbell' },
  { id: 'rdl', name: 'ルーマニアンデッドリフト', category: 'legs', equipment: 'dumbbell' },
  { id: 'db-curl', name: 'ダンベルカール', category: 'armsShoulders', equipment: 'dumbbell' },
  { id: 'ez-curl', name: 'EZバーカール', category: 'armsShoulders', equipment: 'ezbar' },
  { id: 'ez-triceps', name: 'EZバートライセプス', category: 'armsShoulders', equipment: 'ezbar' },
  { id: 'chinning', name: 'チンニング', category: 'back', equipment: 'rack', isAssisted: true, bodyweightRatio: 1.0 },
  { id: 'bench-press', name: 'ベンチプレス', category: 'chest', equipment: 'barbell' },
  { id: 'bb-squat', name: 'バーベルスクワット', category: 'legs', equipment: 'barbell' },
  { id: 'deadlift', name: 'デッドリフト', category: 'back', equipment: 'barbell' },
  { id: 'bent-over-row', name: 'ベントオーバーロウ', category: 'back', equipment: 'barbell' },
  { id: 'push-up', name: '腕立て伏せ', category: 'chest', equipment: 'bodyweight', isBodyweight: true, bodyweightRatio: 0.65 },
  { id: 'abs', name: '腹筋系', category: 'other', equipment: 'bodyweight', isBodyweight: true, bodyweightRatio: 0.3 },
];

export const DEFAULT_EXERCISES: Exercise[] = SEED.map((s, i) => ({
  isAssisted: false,
  isBodyweight: false,
  bodyweightRatio: 1,
  // バーベルは最も軽いプレート 1.25kg を左右に付けた 2.5kg 刻み
  step: s.equipment === 'barbell' ? 2.5 : 1,
  restSec: DEFAULT_REST[s.id] ?? REST_FALLBACK,
  visible: true,
  isCustom: false,
  order: i,
  ...s,
}));

export const DEFAULT_GOALS: Goal[] = [
  { id: 'goal-chin-1', exerciseId: 'chinning', mode: 'bodyweight', reps: 1, order: 0 },
  { id: 'goal-chin-3', exerciseId: 'chinning', mode: 'bodyweight', reps: 3, order: 1 },
  { id: 'goal-db-press', exerciseId: 'db-press', weight: 24, reps: 12, order: 2 },
  { id: 'goal-bb-squat', exerciseId: 'bb-squat', weight: 60, reps: 10, order: 3 },
];
