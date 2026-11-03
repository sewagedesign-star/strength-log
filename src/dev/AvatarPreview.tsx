// 開発用：キャラの見本を並べる画面（本番のビルドには入らない）
import { createRoot } from 'react-dom/client';
import { Avatar } from '../components/Avatar';
import { DEFAULT_LOOK, EYE_COLORS, HAIR_COLORS, OUTFIT_COLORS, STAGE_INFO, type AvatarLook, type Physique } from '../domain/avatar';
import { DEFAULT_SETTINGS } from '../domain/defaults';

const titles = DEFAULT_SETTINGS.titles;
const grow = (k: number): Physique => ({ arms: 1 + 0.6 * k, chest: 1 + 0.5 * k, back: 1 + 0.5 * k, legs: 1 + 0.45 * k });

const looks: AvatarLook[] = [
  DEFAULT_LOOK,
  { ...DEFAULT_LOOK, hairStyle: 'twin', hairColor: HAIR_COLORS[0], eye: EYE_COLORS[3], outfit: OUTFIT_COLORS[1] },
  { ...DEFAULT_LOOK, hairStyle: 'long', hairColor: HAIR_COLORS[6], eye: EYE_COLORS[2], outfit: OUTFIT_COLORS[5] },
  { ...DEFAULT_LOOK, hairStyle: 'bob', hairColor: HAIR_COLORS[1], eye: EYE_COLORS[4], outfit: OUTFIT_COLORS[3], skin: '#e2a77f' },
];

function Preview() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 16, background: '#f4f5f8' }}>
      <h2 style={{ margin: '0 0 8px' }}>1. 姿の6段階（ショート・青髪・赤い服）</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 180px)', gap: 10 }}>
        {STAGE_INFO.map((s, i) => (
          <figure key={i} style={{ margin: 0, background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
            <Avatar look={DEFAULT_LOOK} stage={i} physique={grow(i / 5)} />
            <figcaption style={{ fontSize: 13 }}>
              <b>{titles[i].name}</b>（Lv{titles[i].minLevel}〜）
              <br />
              {s.outfit}・{s.place}
            </figcaption>
          </figure>
        ))}
      </div>
      <h2 style={{ margin: '16px 0 8px' }}>2. 髪型と色の例（中級者）／ 3. 体つき（腕だけ鍛えた／脚だけ鍛えた）／ 4. 顔だけ・影</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 180px)', gap: 10 }}>
        {looks.map((l, i) => (
          <figure key={i} style={{ margin: 0, background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
            <Avatar look={l} stage={2} physique={grow(0.4)} />
            <figcaption style={{ fontSize: 13 }}>{['ショート', 'ツインテール', 'ロング', 'ボブ'][i]}</figcaption>
          </figure>
        ))}
        <figure style={{ margin: 0, background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
          <Avatar look={DEFAULT_LOOK} stage={3} physique={{ arms: 1.6, chest: 1.2, back: 1.2, legs: 1.15 }} />
          <figcaption style={{ fontSize: 13 }}>腕を鍛えた上級者</figcaption>
        </figure>
        <figure style={{ margin: 0, background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
          <Avatar look={DEFAULT_LOOK} stage={3} physique={{ arms: 1.15, chest: 1.2, back: 1.2, legs: 1.6 }} />
          <figcaption style={{ fontSize: 13 }}>脚を鍛えた上級者</figcaption>
        </figure>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
        {looks.map((l, i) => (
          <div key={i} style={{ width: 64, height: 64, background: '#fff', borderRadius: 32, overflow: 'hidden' }}>
            <Avatar look={l} stage={i} physique={grow(0)} variant="face" />
          </div>
        ))}
        <div style={{ width: 180 }}>
          <Avatar look={DEFAULT_LOOK} stage={5} physique={grow(1)} silhouette />
        </div>
        <span style={{ fontSize: 13 }}>← 記録画面の右上に出す顔 ／ 図鑑でまだの姿（影）</span>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
