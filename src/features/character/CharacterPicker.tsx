import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { CharacterCard } from '../../components/CharacterCard';
import { saveSettings } from '../../db/repo';
import { CHARACTERS, avatarOf } from '../../domain/avatar';
import type { Settings } from '../../domain/types';
import styles from './CharacterPicker.module.css';

/** 6人から自分のキャラを選び、名前を付ける */
export function CharacterPicker({ settings, stage, onClose }: { settings: Settings; stage: number; onClose: () => void }) {
  const current = avatarOf(settings);
  const [picked, setPicked] = useState(current.character.id);
  const [names, setNames] = useState<Record<string, string>>(settings.avatar?.names ?? {});
  const ch = CHARACTERS.find((c) => c.id === picked)!;

  const save = async () => {
    const cleaned = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    await saveSettings({ ...settings, avatar: { characterId: picked, names: cleaned } });
    onClose();
  };

  return (
    <Sheet title="キャラを選ぶ" onClose={onClose}>
      <ul className={styles.grid}>
        {CHARACTERS.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`${styles.item} ${picked === c.id ? styles.on : ''}`}
              aria-pressed={picked === c.id}
              onClick={() => setPicked(c.id)}
            >
              <CharacterCard character={c} stage={stage} small label={names[c.id] || c.defaultName} />
              <span className={styles.name}>{names[c.id]?.trim() || c.defaultName}</span>
            </button>
          </li>
        ))}
      </ul>
      <label className={styles.nameField}>
        <span>名前</span>
        <input
          className="field"
          value={names[ch.id] ?? ''}
          placeholder={ch.defaultName}
          maxLength={12}
          onChange={(e) => setNames({ ...names, [ch.id]: e.target.value })}
        />
      </label>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onClose}>
          やめる
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>
          このキャラにする
        </button>
      </div>
    </Sheet>
  );
}
