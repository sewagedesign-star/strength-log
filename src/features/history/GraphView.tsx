import { useMemo, useState } from 'react';
import type { AllData } from '../../db/repo';
import { formatShortDate, toDateKey } from '../../domain/date';
import {
  METRIC_LABEL,
  METRIC_UNIT,
  PERIOD_LABEL,
  WEEK_PARTS,
  exerciseSeries,
  metricsFor,
  periodStart,
  weeklyXp,
  type Metric,
  type Period,
  type Point,
  type WeekPart,
  type WeekXp,
} from '../../domain/stats';
import { CATEGORY_LABEL } from '../../domain/types';
import type { XpSummary } from '../../domain/xp';
import { fmtNum } from '../../data';
import styles from './GraphView.module.css';

const PERIODS: Period[] = ['1m', '3m', '1y', 'all'];
const PART_LABEL: Record<WeekPart, string> = { ...CATEGORY_LABEL, bonus: 'ボーナス' };

export function GraphView({ data, xp }: { data: AllData; xp: XpSummary }) {
  const today = toDateKey();
  const [period, setPeriod] = useState<Period>('3m');
  // 記録のある種目だけ選べる（記録した回数の多い順）
  const recorded = useMemo(() => {
    const count = new Map<string, number>();
    for (const s of data.sets) count.set(s.exerciseId, (count.get(s.exerciseId) ?? 0) + 1);
    return data.exercises.filter((e) => count.has(e.id)).sort((a, b) => count.get(b.id)! - count.get(a.id)!);
  }, [data]);
  const [exId, setExId] = useState<string | null>(null);
  const exercise = recorded.find((e) => e.id === exId) ?? recorded[0];
  const metrics = exercise ? metricsFor(exercise) : [];
  const [metricPick, setMetric] = useState<Metric | null>(null);
  const metric = metricPick && metrics.includes(metricPick) ? metricPick : metrics[0];

  const from = periodStart(period, today);
  const points = useMemo(() => {
    if (!exercise || !metric) return [];
    const all = exerciseSeries(exercise, metric, data.sets, data.sessions, data.settings);
    return from ? all.filter((p) => p.date >= from) : all;
  }, [exercise, metric, data, from]);
  const weeks = useMemo(
    () => weeklyXp(data.sets, data.sessions, data.exercises, data.settings, xp, from, today),
    [data, xp, from, today],
  );

  if (recorded.length === 0) return <p className="sub">記録すると、ここにグラフが出ます</p>;

  return (
    <div className={styles.wrap}>
      <div className={styles.filters} role="radiogroup" aria-label="期間">
        {PERIODS.map((p) => (
          <button key={p} type="button" role="radio" aria-checked={period === p} className={period === p ? styles.on : ''} onClick={() => setPeriod(p)}>
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <section className={`card ${styles.card}`}>
        <h2 className={styles.h2}>種目ごとの推移</h2>
        <select className="field" value={exercise.id} onChange={(e) => setExId(e.target.value)} aria-label="種目">
          {recorded.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {metrics.length > 1 && (
          <div className={styles.metrics} role="radiogroup" aria-label="指標">
            {metrics.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={metric === m} className={metric === m ? styles.on : ''} onClick={() => setMetric(m)}>
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        )}
        <LineChart key={`${exercise.id}-${metric}-${period}`} points={points} metric={metric} />
      </section>

      <section className={`card ${styles.card}`}>
        <h2 className={styles.h2}>週ごとのXP</h2>
        <WeekChart key={period} weeks={weeks} />
      </section>
    </div>
  );
}

/** 目盛りをきりのいい数にそろえる */
function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pad = Math.max(1, Math.abs(max) * 0.1);
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

const W = 360;
const PAD = { l: 40, r: 12, t: 12, b: 26 };

function LineChart({ points, metric }: { points: Point[]; metric: Metric }) {
  const [sel, setSel] = useState<number | null>(null);
  const unit = METRIC_UNIT[metric];
  if (points.length === 0) return <p className={`sub ${styles.empty}`}>この期間の記録がありません</p>;

  const H = 190;
  const ticks = niceTicks(Math.min(...points.map((p) => p.value)), Math.max(...points.map((p) => p.value)));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const t0 = Date.parse(points[0].date);
  const t1 = Date.parse(points[points.length - 1].date);
  const x = (p: Point) =>
    points.length === 1 ? (PAD.l + W - PAD.r) / 2 : PAD.l + ((Date.parse(p.date) - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const shown = sel ?? points.length - 1;
  const cur = points[shown];
  const best = metric === 'assist' ? Math.min(...points.map((p) => p.value)) : Math.max(...points.map((p) => p.value));
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const diff = Math.round((last - first) * 10) / 10;

  return (
    <div>
      <div className={styles.readout} aria-live="polite">
        <span className={styles.readDate}>{formatShortDate(cur.date)}</span>
        <span className={styles.readValue}>
          {fmtNum(cur.value)}
          <small>{unit}</small>
        </span>
        {cur.best && <span className={styles.bestTag}>{metric === 'assist' ? '補助最少' : '自己ベスト'}</span>}
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${METRIC_LABEL[metric]}の推移`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.l - 6} y={y(t)} className={styles.axis} textAnchor="end" dominantBaseline="middle">
              {fmtNum(t)}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} className={styles.axis}>
          {formatShortDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.r} y={H - 6} className={styles.axis} textAnchor="end">
            {formatShortDate(points[points.length - 1].date)}
          </text>
        )}
        {sel !== null && <line x1={x(cur)} x2={x(cur)} y1={PAD.t} y2={H - PAD.b} className={styles.cross} />}
        <path d={path} className={styles.line} />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle
              cx={x(p)}
              cy={y(p.value)}
              r={p.best || i === shown ? 5 : 3.5}
              className={`${styles.dot} ${p.best ? styles.dotBest : ''} ${i === shown ? styles.dotSel : ''}`}
            />
            {/* 指で押しやすいよう、見えない大きめの当たり判定 */}
            <rect
              x={x(p) - 12}
              y={PAD.t}
              width={24}
              height={H - PAD.t - PAD.b}
              className={styles.hit}
              onClick={() => setSel(i === sel ? null : i)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setSel(i)}
            >
              <title>{`${formatShortDate(p.date)} ${fmtNum(p.value)}${unit}`}</title>
            </rect>
          </g>
        ))}
      </svg>
      <dl className={styles.summary}>
        <div>
          <dt>{metric === 'assist' ? '最少' : '最高'}</dt>
          <dd>
            {fmtNum(best)}
            {unit}
          </dd>
        </div>
        <div>
          <dt>期間の変化</dt>
          <dd>
            {diff > 0 ? '+' : ''}
            {fmtNum(diff)}
            {unit}
          </dd>
        </div>
        <div>
          <dt>記録した日</dt>
          <dd>{points.length}日</dd>
        </div>
      </dl>
      <p className={styles.legendNote}>
        <span className={styles.bestMark} /> {metric === 'assist' ? '補助がそれまでで一番少なかった日' : 'それまでの記録を上回った日'}
      </p>
    </div>
  );
}

function WeekChart({ weeks }: { weeks: WeekXp[] }) {
  const [sel, setSel] = useState<number | null>(null);
  if (weeks.length === 0) return <p className={`sub ${styles.empty}`}>この期間の記録がありません</p>;

  const H = 170;
  const ticks = niceTicks(0, Math.max(10, ...weeks.map((w) => w.total)), 3);
  const yMax = ticks[ticks.length - 1];
  const plotW = W - PAD.l - PAD.r;
  const slot = plotW / weeks.length;
  const barW = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);
  // 最初は、記録のある一番新しい週の内訳を出す
  const latest = weeks.map((w) => w.total > 0).lastIndexOf(true);
  const shown = sel ?? (latest >= 0 ? latest : weeks.length - 1);
  const cur = weeks[shown];
  const usedParts = WEEK_PARTS.filter((p) => weeks.some((w) => w.parts[p] > 0));

  return (
    <div>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="週ごとのXP（部位別）">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.l - 6} y={y(t)} className={styles.axis} textAnchor="end" dominantBaseline="middle">
              {fmtNum(t)}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = PAD.l + slot * i + slot / 2;
          let top = y(0);
          return (
            <g key={w.week} className={sel !== null && i !== shown ? styles.dim : ''}>
              {WEEK_PARTS.map((p) => {
                const v = w.parts[p];
                if (v <= 0) return null;
                const h = y(0) - y(v);
                top -= h;
                // 部位の間に背景色のすき間（2px）を入れる
                return (
                  <rect
                    key={p}
                    x={cx - barW / 2}
                    y={top}
                    width={barW}
                    height={Math.max(0, h - 2)}
                    rx={barW > 6 ? 2 : 0}
                    style={{ fill: `var(--series-${p})` }}
                  />
                );
              })}
              <rect x={cx - slot / 2} y={PAD.t} width={slot} height={H - PAD.t - PAD.b} className={styles.hit} onClick={() => setSel(i === sel ? null : i)} onPointerEnter={(e) => e.pointerType === 'mouse' && setSel(i)}>
                <title>{`${formatShortDate(w.week)}の週 ${fmtNum(w.total)}XP`}</title>
              </rect>
            </g>
          );
        })}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} className={styles.baseline} />
        <text x={PAD.l} y={H - 6} className={styles.axis}>
          {formatShortDate(weeks[0].week)}
        </text>
        <text x={W - PAD.r} y={H - 6} className={styles.axis} textAnchor="end">
          {formatShortDate(weeks[weeks.length - 1].week)}
        </text>
      </svg>

      {/* 選んだ週の内訳（色だけに頼らず、数値でも読めるように） */}
      <div className={styles.breakdown}>
        <div className={styles.breakHead}>
          <span>{formatShortDate(cur.week)} からの週</span>
          <strong>{fmtNum(cur.total)} XP</strong>
        </div>
        <ul>
          {usedParts.map((p) => (
            <li key={p}>
              <span className={styles.swatch} style={{ background: `var(--series-${p})` }} />
              <span className={styles.partName}>{PART_LABEL[p]}</span>
              <span>{fmtNum(cur.parts[p])}</span>
            </li>
          ))}
        </ul>
        <p className="sub">棒を押すと、その週の内訳が出ます</p>
      </div>
    </div>
  );
}
