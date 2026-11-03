import { useState } from 'react';
import type { BarType, Settings } from '../../domain/types';
import { fmtNum } from '../../data';
import { NumberField, Row, Section } from './SettingsScreen';
import styles from './Settings.module.css';

const BAR_LABEL: Record<BarType, string> = { barbell: 'バーベル', ezbar: 'EZバー' };

export function PlateSection({ settings, onSave }: { settings: Settings; onSave: (p: Partial<Settings>) => void }) {
  const bars = settings.bars;
  const setBar = (t: BarType, p: Partial<Settings['bars'][BarType]>) => onSave({ bars: { ...bars, [t]: { ...bars[t], ...p } } });

  return (
    <Section title="バーとプレート" note="記録画面の重量の下に、付けるプレートを出します。枚数は左右合わせた数（空欄は制限なし）">
      {(Object.keys(BAR_LABEL) as BarType[]).map((t) => (
        <div key={t} className={styles.form}>
          <h3 className={styles.h3}>{BAR_LABEL[t]}</h3>
          <Row label="バーの重さ">
            <NumberField value={bars[t].weight} unit="kg" onCommit={(v) => setBar(t, { weight: v })} />
          </Row>
          {bars[t].plates.map((p, i) => (
            <Row key={p.weight} label={`${fmtNum(p.weight)}kg プレート`}>
              <CountField
                value={p.count}
                onCommit={(count) => setBar(t, { plates: bars[t].plates.map((x, j) => (j === i ? { ...x, count } : x)) })}
              />
            </Row>
          ))}
        </div>
      ))}
    </Section>
  );
}

/** 枚数欄。空欄は「制限なし」 */
function CountField({ value, onCommit }: { value: number | null; onCommit: (v: number | null) => void }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const t = text.trim();
    const n = Number(t);
    if (t === '') onCommit(null);
    else if (Number.isInteger(n) && n >= 0) onCommit(n);
    setText(null);
  };
  return (
    <span className={styles.numField}>
      <input
        className="field"
        type="text"
        inputMode="numeric"
        placeholder="制限なし"
        value={text ?? (value === null ? '' : String(value))}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      <span className={styles.unit}>枚</span>
    </span>
  );
}
