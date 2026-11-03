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
};

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
  step: 1,
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
