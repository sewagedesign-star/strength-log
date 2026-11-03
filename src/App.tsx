import { useState } from 'react';
import { ToastProvider } from './components/Toast';
import { TabBar, type Tab } from './components/TabBar';
import { RestTimerBar, RestTimerProvider } from './components/RestTimer';
import { MonthlyAuto } from './features/character/MonthlySummary';
import { RecordScreen } from './features/record/RecordScreen';
import { HistoryScreen } from './features/history/HistoryScreen';
import { CharacterScreen } from './features/character/CharacterScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import styles from './App.module.css';

export default function App() {
  const [tab, setTab] = useState<Tab>('record');
  return (
    <ToastProvider>
      <RestTimerProvider>
        <div className={styles.app}>
          <main className={styles.main}>
            {tab === 'record' && <RecordScreen />}
            {tab === 'history' && <HistoryScreen />}
            {tab === 'character' && <CharacterScreen />}
            {tab === 'settings' && <SettingsScreen />}
          </main>
          <RestTimerBar />
          <TabBar value={tab} onChange={setTab} />
        </div>
        <MonthlyAuto />
      </RestTimerProvider>
    </ToastProvider>
  );
}
