import { calcPlates } from '../domain/plates';
import type { BarSetup } from '../domain/types';
import { fmtNum } from '../data';
import styles from './PlateView.module.css';

/** プレートの見た目：重いほど大きく（色は一般的な色分けに寄せる） */
const LOOK: Record<string, { h: number; color: string }> = {
  '25': { h: 34, color: '#d93838' },
  '20': { h: 34, color: '#2a78d6' },
  '15': { h: 30, color: '#e0a800' },
  '10': { h: 26, color: '#1f9d55' },
  '5': { h: 22, color: '#8a90a2' },
  '2.5': { h: 18, color: '#d93838' },
  '1.25': { h: 15, color: '#8a90a2' },
};

/** 重量欄の下に出す「バー20kg ＋ 片側 20・5」 */
export function PlateView({ weight, bar, label }: { weight: number | null; bar: BarSetup; label: string }) {
  if (weight === null || weight <= 0) return null;
  const r = calcPlates(weight, bar);

  if (r.underBar) {
    return <p className={styles.note}>{label}だけで {fmtNum(bar.weight)}kg です</p>;
  }

  return (
    <div className={styles.wrap} aria-label="プレートの付け方">
      <div className={styles.pic} aria-hidden="true">
        <span className={styles.sleeve} />
        {r.perSide.map((p, i) => {
          const look = LOOK[String(p)] ?? { h: 18, color: '#8a90a2' };
          return <span key={i} className={styles.plate} style={{ height: look.h, background: look.color }} />;
        })}
        <span className={styles.collar} />
      </div>
      <p className={styles.text}>
        {label} {fmtNum(bar.weight)}kg ＋ 片側 {r.perSide.length ? r.perSide.map(fmtNum).join('・') : 'なし'}
        {!r.exact && (
          <span className={styles.warn}>
            ぴったりにできません（近い重さ {[r.below, r.above].filter((x) => x !== undefined).map((x) => `${fmtNum(x!)}kg`).join('／')}）
          </span>
        )}
      </p>
    </div>
  );
}
