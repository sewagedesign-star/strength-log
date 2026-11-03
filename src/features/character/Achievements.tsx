import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { TIER_LABEL, type AchievementStatus } from '../../domain/achievements';
import { formatDate } from '../../domain/date';
import { fmtNum } from '../../data';
import styles from './Achievements.module.css';

/** 取っていない実績の残り：「あと3日」など */
function remainText(a: AchievementStatus): string {
  const rest = Math.max(0, a.def.target - a.current);
  if (a.def.unit === '') return '未達成';
  return `あと ${fmtNum(Math.ceil(rest * 10) / 10)}${a.def.unit}`;
}

export function Achievements({ list }: { list: AchievementStatus[] }) {
  const [open, setOpen] = useState<AchievementStatus | null>(null);
  const got = list.filter((a) => a.achieved).length;

  return (
    <>
      <div className={styles.head}>
        <h2 className={styles.h2}>実績</h2>
        <span className="sub">
          {got} / {list.length}
        </span>
      </div>
      <ul className={styles.grid}>
        {list.map((a) => (
          <li key={a.def.id}>
            <button
              type="button"
              className={`${styles.badge} ${a.achieved ? styles[a.def.tier] : styles.locked}`}
              onClick={() => setOpen(a)}
              aria-label={`${a.def.name}（${a.achieved ? `${TIER_LABEL[a.def.tier]}・取得済み` : remainText(a)}）`}
            >
              <span className={styles.icon} aria-hidden="true">
                {a.def.icon}
              </span>
              <span className={styles.name}>{a.def.name}</span>
              {a.achieved ? (
                <span className={styles.tierTag}>{TIER_LABEL[a.def.tier]}</span>
              ) : (
                <>
                  <span className={styles.bar}>
                    <span style={{ width: `${(a.current / a.def.target) * 100}%` }} />
                  </span>
                  <span className={styles.remain}>{remainText(a)}</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <Sheet title={open.def.name} onClose={() => setOpen(null)} center>
          <div className={styles.detail}>
            <span className={`${styles.bigIcon} ${open.achieved ? styles[open.def.tier] : styles.locked}`} aria-hidden="true">
              {open.def.icon}
            </span>
            <p>
              <strong>{open.def.group}</strong>（{TIER_LABEL[open.def.tier]}）
            </p>
            <p>条件：{open.def.condition}</p>
            <p className="sub">
              {open.achieved && open.achievedDate
                ? `${formatDate(open.achievedDate)} に取得`
                : `今 ${fmtNum(open.current)}${open.def.unit} ／ ${fmtNum(open.def.target)}${open.def.unit}（${remainText(open)}）`}
            </p>
          </div>
        </Sheet>
      )}
    </>
  );
}
