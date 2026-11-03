// データモデル。XP・レベル・実績は保存せず、SetRecord から毎回計算する。

export type Category = 'chest' | 'back' | 'armsShoulders' | 'legs' | 'other';
export type Equipment = 'dumbbell' | 'ezbar' | 'rack' | 'barbell' | 'bodyweight';
/** チンニングのやり方：補助あり／自重（補助なし）／ネガティブ */
export type ChinMode = 'assisted' | 'bodyweight' | 'negative';
export type Rpe = 6 | 7 | 8 | 9 | 10;

export const CATEGORIES: Category[] = ['chest', 'back', 'armsShoulders', 'legs', 'other'];
/** レーダーチャートに出す部位 */
export const BODY_PARTS: Category[] = ['chest', 'back', 'armsShoulders', 'legs'];
export const CATEGORY_LABEL: Record<Category, string> = {
  chest: '胸',
  back: '背中',
  armsShoulders: '腕・肩',
  legs: '脚',
  other: 'その他',
};

export const EQUIPMENTS: Equipment[] = ['dumbbell', 'ezbar', 'rack', 'barbell', 'bodyweight'];
export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  dumbbell: 'ダンベル',
  ezbar: 'EZバー',
  rack: 'ハーフラック',
  barbell: 'バーベル',
  bodyweight: '自重',
};

export const CHIN_MODE_LABEL: Record<ChinMode, string> = {
  assisted: '補助あり',
  bodyweight: '自重',
  negative: 'ネガティブ',
};

export const RPES: Rpe[] = [6, 7, 8, 9, 10];

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  equipment: Equipment;
  /** チンニングのように「補助あり／自重／ネガティブ」を選ぶ種目 */
  isAssisted: boolean;
  /** 腕立て伏せのように重量を入れない自重種目 */
  isBodyweight: boolean;
  /** 自重種目で体重の何割を負荷とみなすか（例：腕立て 0.65） */
  bodyweightRatio: number;
  /** 重量の刻み（kg） */
  step: number;
  /** セット間の休憩時間（秒） */
  restSec: number;
  visible: boolean;
  isCustom: boolean;
  order: number;
}

export interface Session {
  id: string;
  /** 端末のローカル日付 YYYY-MM-DD（1日1件） */
  date: string;
  /** 今日のメニュー（チェックした種目） */
  exerciseIds: string[];
}

export interface SetRecord {
  id: string;
  sessionId: string;
  exerciseId: string;
  /** 重量（kg）。自重種目・チンニングでは null */
  weight: number | null;
  /** チンニングのやり方（チンニング以外は undefined） */
  mode?: ChinMode;
  /** 補助重量（kg）。mode が assisted のときだけ */
  assistWeight?: number;
  reps: number;
  setNo: number;
  rpe: Rpe;
  note: string;
  createdAt: number;
}

export interface TitleRule {
  minLevel: number;
  name: string;
}

export interface Settings {
  id: 'main';
  bodyWeight: number;
  rpeFactors: Record<Rpe, number>;
  /** ネガティブは体重の何割を負荷とみなすか */
  negativeRatio: number;
  bonus: {
    firstTry: number;
    personalBest: number;
    weeklyQuest: number;
    /** 週間クエストの達成に必要な日数 */
    weeklyDays: number;
  };
  /** Lv n → n+1 に必要なXP = base + perLevel × n */
  level: { base: number; perLevel: number; max: number };
  titles: TitleRule[];
  /** 保存・実績のときに効果音を鳴らす */
  sound: boolean;
  /** バー（バーベル・EZバー）の重さと持っているプレート */
  bars: Record<BarType, BarSetup>;
  backup: {
    /** 最後に JSON を書き出した時刻 */
    lastExportAt?: number;
    /** 「あとで」を押したときの、お知らせを出さない期限 */
    snoozeUntil?: number;
    /** お知らせを出すまでの日数 */
    intervalDays: number;
  };
  /** 月のまとめを最後に自動で出した月（YYYY-MM） */
  monthlySeen?: string;
  /** 選んだキャラと、キャラごとに付けた名前（演出の段階は記録から計算） */
  avatar?: { characterId?: string; names?: Record<string, string> };
}

export type BarType = 'barbell' | 'ezbar';

export interface Plate {
  /** 1枚の重さ（kg） */
  weight: number;
  /** 持っている枚数。null は制限なし */
  count: number | null;
}

export interface BarSetup {
  /** バーだけの重さ（kg） */
  weight: number;
  plates: Plate[];
}

/** 種目目標。weight を指定すれば重量×回数、mode を指定すればチンニングのやり方×回数 */
export interface Goal {
  id: string;
  exerciseId: string;
  weight?: number;
  mode?: ChinMode;
  reps: number;
  order: number;
}
