import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { saveSettings, type AllData } from '../../db/repo';
import { evaluateAchievements } from '../../domain/achievements';
import { toDateKey } from '../../domain/date';
import { formatMonth, monthOf, monthSummary, monthsWithRecords, prevMonth, type MonthSummary } from '../../domain/monthly';
import type { XpSummary } from '../../domain/xp';
import { fmtNum, useAllData, useXp } from '../../data';
import styles from './MonthlySummary.module.css';

function useSummaries(data: AllData | undefined, xp: XpSummary | undefined) {
  return useMemo(() => {
    if (!data || !xp) return null;
    const ach = evaluateAchievements(data.sets, data.sessions, data.exercises, data.settings, xp);
    return (month: string) => monthSummary(month, data.sets, data.sessions, data.exercises, data.settings, xp, ach);
  }, [data, xp]);
}

/** 月が変わって初めて開いたとき、前の月に記録があれば1回だけ出す */
export function MonthlyAuto() {
  const data = useAllData();
  const xp = useXp(data);
  const summarize = useSummaries(data, xp);
  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    if (!data || !summarize || month) return;
    const thisMonth = monthOf(toDateKey());
    if (data.settings.monthlySeen === thisMonth) return;
    const last = prevMonth(thisMonth);
    saveSettings({ ...data.settings, monthlySeen: thisMonth });
    if (summarize(last).days > 0) setMonth(last);
  }, [data, summarize, month]);

  if (!month || !summarize) return null;
  return (
    <Sheet title={`${formatMonth(month)}のまとめ`} onClose={() => setMonth('')} center>
      <SummaryBody s={summarize(month)} prev={summarize(prevMonth(month))} />
    </Sheet>
  );
}

/** キャラ画面から開く、過去の月も選べるまとめ */
export function MonthlyBrowser({ data, xp, onClose }: { data: AllData; xp: XpSummary; onClose: () => void }) {
  const summarize = useSummaries(data, xp)!;
  const months = monthsWithRecords(xp);
  const [i, setI] = useState(0);
  const month = months[i];

  return (
    <Sheet title="月のまとめ" onClose={onClose}>
      {!month ? (
        <p className="sub">まだ記録がありません</p>
      ) : (
        <>
          <div className={styles.nav}>
            <button type="button" className="btn" disabled={i >= months.length - 1} onClick={() => setI(i + 1)} aria-label="前の月">
              ‹
            </button>
            <span className={styles.month}>{formatMonth(month)}</span>
            <button type="button" className="btn" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="次の月">
              ›
            </button>
          </div>
          <SummaryBody s={summarize(month)} prev={summarize(prevMonth(month))} />
        </>
      )}
    </Sheet>
  );
}

function Diff({ cur, prev, unit }: { cur: number; prev: number; unit: string }) {
  const d = Math.round((cur - prev) * 10) / 10;
  if (prev === 0 && cur === 0) return null;
  return (
    <span className={d > 0 ? styles.up : d < 0 ? styles.down : styles.same}>
      前の月より {d > 0 ? '+' : ''}
      {fmtNum(d)}
      {unit}
    </span>
  );
}

function SummaryBody({ s, prev }: { s: MonthSummary; prev: MonthSummary }) {
  const items: { label: string; value: string; cur: number; prev: number; unit: string }[] = [
    { label: '記録した日', value: `${s.days}日`, cur: s.days, prev: prev.days, unit: '日' },
    { label: 'セット数', value: `${s.sets}`, cur: s.sets, prev: prev.sets, unit: '' },
    { label: 'ボリューム', value: `${fmtNum(s.volume / 1000)}トン`, cur: s.volume / 1000, prev: prev.volume / 1000, unit: 'トン' },
    { label: '獲得XP', value: fmtNum(s.xp), cur: s.xp, prev: prev.xp, unit: '' },
    { label: '自己ベスト', value: `${s.pbCount}回`, cur: s.pbCount, prev: prev.pbCount, unit: '回' },
  ];
  return (
    <div className={styles.body}>
      <ul className={styles.grid}>
        {items.map((it) => (
          <li key={it.label}>
            <span className={styles.label}>{it.label}</span>
            <strong className={styles.value}>{it.value}</strong>
            <Diff cur={it.cur} prev={it.prev} unit={it.unit} />
          </li>
        ))}
        {s.top && (
          <li>
            <span className={styles.label}>一番やった種目</span>
            <strong className={styles.topName}>{s.top.name}</strong>
            <span className={styles.same}>{s.top.sets}セット</span>
          </li>
        )}
      </ul>
      <div>
        <h3 className={styles.h3}>取った実績</h3>
        {s.achievements.length === 0 ? (
          <p className="sub">この月はありません</p>
        ) : (
          <ul className={styles.badges}>
            {s.achievements.map((a) => (
              <li key={a.id}>
                <span aria-hidden="true">{a.icon}</span> {a.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
