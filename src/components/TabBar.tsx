import styles from './TabBar.module.css';

export type Tab = 'record' | 'history' | 'character' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  // アイコンは 24×24 の SVG パス
  { id: 'record', label: '記録', icon: 'M5 12h2M17 12h2M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10' },
  { id: 'history', label: '履歴', icon: 'M4 6h16M4 12h16M4 18h10' },
  { id: 'character', label: 'キャラ', icon: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z' },
  {
    id: 'settings',
    label: '設定',
    icon: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  },
];

export function TabBar({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className={styles.bar}>
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.tab} ${value === t.id ? styles.on : ''}`}
          aria-current={value === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d={t.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
