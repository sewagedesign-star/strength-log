// キャラのカード：段階ごとの背景・枠・オーラの上にキャラの画像を置く。
import { useId } from 'react';
import type { CharacterDef } from '../domain/avatar';
import { Background } from './StageBackground';
import styles from './CharacterCard.module.css';

const imgSrc = (ch: CharacterDef) => `${import.meta.env.BASE_URL}${ch.file}`;

interface Props {
  character: CharacterDef;
  /** 演出の段階 0〜5 */
  stage: number;
  /** まだの段階を影で見せる（進化の図鑑） */
  silhouette?: boolean;
  /** 小さく出すとき（図鑑・選択）は動きを止める */
  small?: boolean;
  className?: string;
  label?: string;
}

export function CharacterCard({ character, stage, silhouette, small, className, label }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (k: string) => `${k}-${uid}`;
  return (
    <div
      className={`${styles.card} ${styles[`stage${stage}`]} ${silhouette ? styles.silhouette : ''} ${small ? styles.small : ''} ${className ?? ''}`}
      role="img"
      aria-label={label ?? character.defaultName}
    >
      <svg className={styles.bg} viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Background stage={stage} id={id} />
      </svg>
      {!silhouette && stage >= 3 && <div className={styles.aura} aria-hidden="true" />}
      {!silhouette && stage >= 2 && (
        <div className={styles.sparkles} aria-hidden="true">
          {Array.from({ length: stage >= 4 ? 10 : 6 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 92 + 4}%`, top: `${(i * 53) % 70 + 8}%`, animationDelay: `${(i % 5) * 0.4}s` }} />
          ))}
        </div>
      )}
      <img className={styles.char} src={imgSrc(character)} alt="" draggable={false} />
      {stage === 5 && !silhouette && (
        <svg className={styles.crown} viewBox="0 0 60 40" aria-hidden="true">
          <path d="M6,34 L4,8 L18,20 L30,2 L42,20 L56,8 L54,34 Z" fill="#f2c440" stroke="#8a6400" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="30" cy="24" r="4" fill="#e2483d" />
          <circle cx="17" cy="27" r="3" fill="#3a8ee6" />
          <circle cx="43" cy="27" r="3" fill="#3cb371" />
        </svg>
      )}
    </div>
  );
}

/** 顔だけを丸く出す（記録画面の右上など） */
export function CharacterFace({ character, size }: { character: CharacterDef; size: number }) {
  const { cx, cy, size: f } = character.face;
  const imgH = size / f; // 顔の部分がちょうど丸に入る大きさ
  const imgW = imgH * character.aspect;
  return (
    <span className={styles.face} style={{ width: size, height: size }} aria-hidden="true">
      <img
        src={imgSrc(character)}
        alt=""
        draggable={false}
        style={{ width: imgW, height: imgH, left: size / 2 - cx * imgW, top: size / 2 - cy * imgH }}
      />
    </span>
  );
}
