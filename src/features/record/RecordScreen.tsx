import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { lastSessionBefore, setMenu } from '../../db/repo';
import { formatDate, formatShortDate, toDateKey } from '../../domain/date';
import { levelFromXp } from '../../domain/level';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../../domain/types';
import { useAllData, useXp } from '../../data';
import { ExerciseSheet, setSummary } from './ExerciseSheet';
import { BackupBanner } from './BackupBanner';
import styles from './RecordScreen.module.css';

/** 日付が変わったら（日をまたいで開きっぱなしでも）今日に追従する */
function useToday(): string {
  const [today, setToday] = useState(toDateKey);
  useEffect(() => {
    const tick = () => setToday(toDateKey());
    const id = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return today;
}

export function RecordScreen() {
  const today = useToday();
  const data = useAllData();
  const xp = useXp(data);
  const prev = useLiveQuery(() => lastSessionBefore(today), [today]);
  const [category, setCategory] = useState<Category | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const session = data?.sessions.find((s) => s.date === today);
  const menu = session?.exerciseIds ?? [];
  const exMap = useMemo(() => new Map(data?.exercises.map((e) => [e.id, e])), [data]);
  const todaySets = useMemo(
    () => (session ? (data?.sets.filter((s) => s.sessionId === session.id) ?? []) : []),
    [data, session],
  );

  // 初めて開いたとき、今日のメニューがあればその分類を選んでおく
  useEffect(() => {
    if (category === null && menu.length > 0) {
      const first = exMap.get(menu[0]);
      if (first) setCategory(first.category);
    }
  }, [category, menu, exMap]);

  if (!data || !xp) return null;

  const level = levelFromXp(xp.total, data.settings);
  const listed = category ? data.exercises.filter((e) => e.category === category && (e.visible || menu.includes(e.id))) : [];
  const toggle = (id: string) => {
    const next = menu.includes(id) ? menu.filter((x) => x !== id) : [...menu, id];
    setMenu(today, next);
  };
  const open = openId ? exMap.get(openId) : undefined;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.date}>{formatDate(today)}</h1>
          <p className="sub">
            前回：
            {prev ? `${prev.categories.map((c) => CATEGORY_LABEL[c]).join('・')}（${formatShortDate(prev.date)}）` : 'まだ記録がありません'}
          </p>
        </div>
        <div className={styles.level}>
          <span className={styles.lv}>Lv {level.level}</span>
          <span className={styles.title}>{level.title}</span>
        </div>
      </header>

      <BackupBanner
        settings={data.settings}
        firstRecordAt={data.sets.length ? Math.min(...data.sets.map((s) => s.createdAt)) : null}
      />

      <div className={styles.cats} role="tablist" aria-label="分類">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            className={category === c ? styles.on : ''}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {category ? (
        <div className={styles.checks}>
          {listed.map((e) => {
            const checked = menu.includes(e.id);
            return (
              <button
                key={e.id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                className={`${styles.check} ${checked ? styles.checked : ''}`}
                onClick={() => toggle(e.id)}
              >
                <span className={styles.box}>{checked ? '✓' : ''}</span>
                <span className={styles.checkName}>{e.name}</span>
              </button>
            );
          })}
          {listed.length === 0 && <p className="sub">表示する種目がありません（設定で追加できます）</p>}
        </div>
      ) : (
        <p className={`sub ${styles.hint}`}>分類を選ぶと種目が出ます</p>
      )}

      <section className={styles.menu}>
        <h2 className={styles.menuTitle}>今日のメニュー</h2>
        {menu.length === 0 && <p className="sub">種目にチェックを入れると、ここに並びます</p>}
        {menu.map((id) => {
          const e = exMap.get(id);
          if (!e) return null;
          const done = todaySets.filter((s) => s.exerciseId === id).sort((a, b) => a.setNo - b.setNo);
          const lastSet = done.at(-1);
          return (
            <button key={id} type="button" className={`card ${styles.item}`} onClick={() => setOpenId(id)}>
              <span className={styles.itemName}>{e.name}</span>
              <span className={styles.itemState}>
                {lastSet ? (
                  <>
                    <span className={styles.done}>✓ {done.length}セット</span>
                    <span className="sub">{setSummary(lastSet)}</span>
                  </>
                ) : (
                  <span className="sub">タップして入力</span>
                )}
              </span>
              <span className={styles.chev}>›</span>
            </button>
          );
        })}
      </section>

      {open && (
        <ExerciseSheet
          key={open.id}
          date={today}
          exercise={open}
          settings={data.settings}
          todaySets={todaySets.filter((s) => s.exerciseId === open.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
