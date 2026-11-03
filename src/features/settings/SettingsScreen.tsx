import { useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS } from '../../domain/defaults';
import { RPES, type Settings } from '../../domain/types';
import { saveSettings } from '../../db/repo';
import { useAllData, useXp, fmtNum } from '../../data';
import { CharacterFace } from '../../components/CharacterCard';
import { CharacterPicker } from '../character/CharacterPicker';
import { avatarOf, stageFor } from '../../domain/avatar';
import { levelFromXp } from '../../domain/level';
import { ExerciseSection } from './ExerciseSection';
import { GoalSection } from './GoalSection';
import { BackupSection } from './BackupSection';
import { PlateSection } from './PlateSection';
import { ConfirmDialog } from '../../components/Sheet';
import styles from './Settings.module.css';

export function SettingsScreen() {
  const data = useAllData();
  const xp = useXp(data);
  const [confirmReset, setConfirmReset] = useState(false);
  const [picking, setPicking] = useState(false);
  if (!data || !xp) return null;
  const s = data.settings;
  const save = (p: Partial<Settings>) => saveSettings({ ...s, ...p });
  const me = avatarOf(s);
  const stage = stageFor(levelFromXp(xp.total, s).level, s);

  return (
    <div className={styles.screen}>
      <h1 className={styles.h1}>設定</h1>

      <Section title="キャラ">
        <div className={styles.charRow}>
          <CharacterFace character={me.character} size={56} />
          <span className={styles.charName}>{me.name}</span>
          <button type="button" className="btn" onClick={() => setPicking(true)}>
            選ぶ・名前
          </button>
        </div>
      </Section>
      {picking && <CharacterPicker settings={s} stage={stage} onClose={() => setPicking(false)} />}

      <Section title="からだ">
        <Row label="体重" hint="自重種目のXP計算に使います">
          <NumberField value={s.bodyWeight} unit="kg" onCommit={(v) => save({ bodyWeight: v })} min={1} />
        </Row>
      </Section>

      <Section title="音">
        <Row label="効果音" hint="保存・レベルアップ・実績のときに鳴らします（マナーモードでは鳴らないことがあります）">
          <button
            type="button"
            className={`${styles.toggle} ${styles.toggleWide} ${s.sound ? styles.toggleOn : ''}`}
            aria-pressed={s.sound}
            onClick={() => save({ sound: !s.sound })}
          >
            {s.sound ? '鳴らす' : '鳴らさない'}
          </button>
        </Row>
      </Section>

      <ExerciseSection exercises={data.exercises} />
      <PlateSection settings={s} onSave={save} />
      <GoalSection goals={data.goals} exercises={data.exercises} />

      <Section title="XP係数" note="変えると、これまでの記録から累計XPを計算し直します">
        {RPES.map((r) => (
          <Row key={r} label={`RPE ${r}`}>
            <NumberField
              value={s.rpeFactors[r]}
              unit="倍"
              onCommit={(v) => save({ rpeFactors: { ...s.rpeFactors, [r]: v } })}
            />
          </Row>
        ))}
        <Row label="ネガティブ" hint="チンニングのネガティブは体重の何倍とみなすか">
          <NumberField value={s.negativeRatio} unit="倍" onCommit={(v) => save({ negativeRatio: v })} />
        </Row>
        <Row label="初挑戦">
          <NumberField value={s.bonus.firstTry} unit="XP" onCommit={(v) => save({ bonus: { ...s.bonus, firstTry: v } })} />
        </Row>
        <Row label="自己ベスト更新">
          <NumberField value={s.bonus.personalBest} unit="XP" onCommit={(v) => save({ bonus: { ...s.bonus, personalBest: v } })} />
        </Row>
        <Row label="週間クエスト">
          <NumberField value={s.bonus.weeklyQuest} unit="XP" onCommit={(v) => save({ bonus: { ...s.bonus, weeklyQuest: v } })} />
        </Row>
        <Row label="クエストの日数" hint="1週間（月曜〜日曜）に何日記録したら達成か">
          <NumberField
            value={s.bonus.weeklyDays}
            unit="日"
            min={1}
            max={7}
            integer
            onCommit={(v) => save({ bonus: { ...s.bonus, weeklyDays: v } })}
          />
        </Row>
        <p className={styles.formula}>
          Lv n → n+1 に必要なXP ＝ {fmtNum(s.level.base)} ＋ {fmtNum(s.level.perLevel)} × n
        </p>
        <Row label="基本">
          <NumberField value={s.level.base} unit="XP" min={1} onCommit={(v) => save({ level: { ...s.level, base: v } })} />
        </Row>
        <Row label="1レベルごと">
          <NumberField value={s.level.perLevel} unit="XP" onCommit={(v) => save({ level: { ...s.level, perLevel: v } })} />
        </Row>
        <button type="button" className={`btn ${styles.wide}`} onClick={() => setConfirmReset(true)}>
          XP係数を最初の値に戻す
        </button>
      </Section>

      <Section title="称号">
        {[...s.titles]
          .sort((a, b) => a.minLevel - b.minLevel)
          .map((t, i, arr) => (
            <Row key={t.minLevel} label={`Lv ${t.minLevel}${arr[i + 1] ? `〜${arr[i + 1].minLevel - 1}` : '〜'}`}>
              <TextField
                value={t.name}
                onCommit={(name) => save({ titles: s.titles.map((x) => (x.minLevel === t.minLevel ? { ...x, name } : x)) })}
              />
            </Row>
          ))}
      </Section>

      <BackupSection settings={s} onSave={save} />

      <p className={`sub ${styles.footer}`}>データはこの端末の中だけに保存されます。</p>

      {confirmReset && (
        <ConfirmDialog
          message="RPE係数・ボーナス・レベルの必要XPを最初の値に戻します（体重と称号名はそのまま）。"
          okLabel="戻す"
          onOk={() => {
            save({
              rpeFactors: DEFAULT_SETTINGS.rpeFactors,
              negativeRatio: DEFAULT_SETTINGS.negativeRatio,
              bonus: DEFAULT_SETTINGS.bonus,
              level: DEFAULT_SETTINGS.level,
            });
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={`card ${styles.section}`}>
      <h2 className={styles.h2}>{title}</h2>
      {note && <p className={`sub ${styles.note}`}>{note}</p>}
      {children}
    </section>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      <div className={styles.rowField}>{children}</div>
    </div>
  );
}

interface NumberFieldProps {
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  onCommit: (v: number) => void;
}

/** 数値欄。入力中は文字のまま持ち、欄を離れたときに正しい数値なら保存する */
export function NumberField({ value, unit, min = 0, max, integer, onCommit }: NumberFieldProps) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const n = Number(text.replace(',', '.'));
    if (text.trim() !== '' && Number.isFinite(n) && n >= min && (max === undefined || n <= max) && (!integer || Number.isInteger(n))) {
      if (n !== value) onCommit(n);
    }
    setText(null);
  };
  return (
    <span className={styles.numField}>
      <input
        className="field"
        type="text"
        inputMode="decimal"
        value={text ?? fmtNum(value)}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      {unit && <span className={styles.unit}>{unit}</span>}
    </span>
  );
}

export function TextField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text !== null && text.trim() !== '' && text.trim() !== value) onCommit(text.trim());
    setText(null);
  };
  return (
    <input
      className="field"
      type="text"
      value={text ?? value}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}
