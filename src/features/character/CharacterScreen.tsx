import { useMemo } from 'react';
import { formatShortDate, toDateKey, weekStart } from '../../domain/date';
import { goalLabel, goalStatuses } from '../../domain/goals';
import { levelFromXp } from '../../domain/level';
import { BODY_PARTS, CATEGORY_LABEL, type Category } from '../../domain/types';
import { fmtNum, useAllData, useXp } from '../../data';
import styles from './CharacterScreen.module.css';

export function CharacterScreen() {
  const data = useAllData();
  const xp = useXp(data);

  const weekDays = useMemo(() => {
    if (!xp) return 0;
    const wk = weekStart(toDateKey());
    return xp.sessions.filter((s) => weekStart(s.date) === wk).length;
  }, [xp]);

  if (!data || !xp) return null;

  const lv = levelFromXp(xp.total, data.settings);
  const pct = lv.xpNeeded ? Math.min(100, (lv.xpInLevel / lv.xpNeeded) * 100) : 100;
  const exMap = new Map(data.exercises.map((e) => [e.id, e]));
  const goals = goalStatuses(data.goals, data.sets);
  const open = goals.filter((g) => !g.achieved);
  const done = goals.filter((g) => g.achieved);
  const questDays = data.settings.bonus.weeklyDays;

  return (
    <div className={styles.screen}>
      <section className={`card ${styles.hero}`}>
        <div className={styles.lvRow}>
          <span className={styles.lv}>
            Lv<strong>{lv.level}</strong>
          </span>
          <span className={styles.title}>{lv.title}</span>
        </div>
        <div className={styles.bar} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.xpRow}>
          <span>累計 {fmtNum(xp.total)} XP</span>
          <span>{lv.isMax ? 'レベル上限' : `次のレベルまで あと ${fmtNum(lv.remaining)} XP`}</span>
        </div>
      </section>

      <section className={`card ${styles.block}`}>
        <h2 className={styles.h2}>週間クエスト</h2>
        <div className={styles.quest}>
          {Array.from({ length: questDays }, (_, i) => (
            <span key={i} className={`${styles.dot} ${i < weekDays ? styles.dotOn : ''}`}>
              {i < weekDays ? '✓' : i + 1}
            </span>
          ))}
          <span className="sub">
            {weekDays >= questDays
              ? `今週は達成！（+${data.settings.bonus.weeklyQuest} XP）`
              : `今週 ${weekDays}/${questDays} 日　達成で +${data.settings.bonus.weeklyQuest} XP`}
          </span>
        </div>
      </section>

      <section className={`card ${styles.block}`}>
        <h2 className={styles.h2}>次の目標</h2>
        {goals.length === 0 && <p className="sub">設定画面で目標を追加できます</p>}
        <ul className={styles.goals}>
          {open.map(({ goal }) => (
            <li key={goal.id}>
              <span className={styles.mark}>○</span>
              {goalLabel(goal, exMap.get(goal.exerciseId))}
            </li>
          ))}
          {done.map(({ goal, achievedAt }) => (
            <li key={goal.id} className={styles.achieved}>
              <span className={styles.mark}>✓</span>
              {goalLabel(goal, exMap.get(goal.exerciseId))}
              {achievedAt && <span className="sub">（{formatShortDate(toDateKey(new Date(achievedAt)))} 達成）</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className={`card ${styles.block}`}>
        <h2 className={styles.h2}>部位ステータス</h2>
        <Radar values={xp.byCategory} />
      </section>
    </div>
  );
}

/** 4部位のレーダーチャート（最大値の部位を外周に合わせる） */
function Radar({ values }: { values: Record<Category, number> }) {
  const size = 260;
  const c = size / 2;
  const r = 88;
  const max = Math.max(1, ...BODY_PARTS.map((p) => values[p]));
  // 上・右・下・左
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / BODY_PARTS.length;
  const pt = (i: number, ratio: number) => [c + Math.cos(angle(i)) * r * ratio, c + Math.sin(angle(i)) * r * ratio];
  const poly = (ratio: (i: number) => number) => BODY_PARTS.map((_, i) => pt(i, ratio(i)).join(',')).join(' ');

  return (
    <svg className={styles.radar} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="部位ごとの累計XP">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={poly(() => k)} className={styles.grid} />
      ))}
      {BODY_PARTS.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className={styles.grid} />;
      })}
      <polygon points={poly((i) => Math.max(0.03, values[BODY_PARTS[i]] / max))} className={styles.area} />
      {BODY_PARTS.map((p, i) => {
        const [x, y] = pt(i, 1.28);
        return (
          <text key={p} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={styles.label}>
            <tspan x={x} dy="-0.5em">
              {CATEGORY_LABEL[p]}
            </tspan>
            <tspan x={x} dy="1.2em" className={styles.value}>
              {fmtNum(values[p])}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
