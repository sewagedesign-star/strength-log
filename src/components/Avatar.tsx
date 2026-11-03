// キャラの絵（2頭身・アニメ調）。図形だけで描くので、画像ファイルは使わない。
// 太めの濃い輪郭線・大きなツヤのある瞳・開いた口・斜線入りのほお・ふんわりした髪が特徴。
import { useId } from 'react';
import type { AvatarLook, Physique } from '../domain/avatar';

interface Props {
  look: AvatarLook;
  /** 姿の段階 0〜5 */
  stage: number;
  physique: Physique;
  /** face は顔だけ（記録画面の右上など） */
  variant?: 'full' | 'face';
  /** 背景を描くか（full のとき） */
  background?: boolean;
  /** まだの姿を影で描く（進化の図鑑） */
  silhouette?: boolean;
  className?: string;
  title?: string;
}

/** 色を白（amt>0）か黒（amt<0）に寄せる */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** 左右反転したパス（x → 200 − x）。数字の組「x,y」だけで書いたパスに限る */
const mirrorX = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)},${y}`);

const AURA = ['', '', '', '#5ab0ff', '#ff5a4a', '#ffd34a'];
/** 輪郭線の色と太さ */
const LINE = '#2b2433';
const LW = 2.2;

// 顔まわりの形（すべて 200×250 の座標）
const FACE = 'M48,86 C48,46 152,46 152,86 C152,118 130,136 100,138 C70,136 48,118 48,86 Z';
const BACK_HAIR: Record<AvatarLook['hairStyle'], string> = {
  short: 'M34,94 C24,8 176,8 166,94 Q166,118 154,128 L46,128 Q34,118 34,94 Z',
  bob: 'M32,94 C22,6 178,6 168,94 Q172,132 158,146 Q148,140 144,130 L56,130 Q52,140 42,146 Q28,132 32,94 Z',
  long: 'M32,94 C22,6 178,6 168,94 Q178,150 172,204 Q152,214 136,198 L64,198 Q48,214 28,204 Q22,150 32,94 Z',
  twin: 'M34,94 C24,8 176,8 166,94 Q166,118 154,128 L46,128 Q34,118 34,94 Z',
};
const TWIN_TAIL = 'M44,62 C10,76 2,150 24,206 C30,186 30,170 36,150 C40,124 48,100 58,82 Z';
// 前髪：額をおおう長めの毛束（毛先の位置をずらして自然に）
const HAIR_CAP = 'M38,98 C26,4 174,4 162,98 Q156,76 146,66 Q100,48 54,66 Q44,76 38,98 Z';
// 前髪の毛束（丸みのある先細り。すき間から額が少し見える）
const LOCKS = [
  'M42,66 C46,82 46,96 40,106 C54,98 62,84 64,66 Z',
  'M56,60 C64,74 68,88 66,100 C78,90 84,76 82,58 Z',
  'M76,54 C86,70 92,84 95,99 C102,86 104,70 102,52 Z',
  'M98,52 C108,66 116,80 124,92 C127,76 126,62 122,52 Z',
  'M118,54 C130,66 138,80 145,96 C148,80 146,66 140,58 Z',
  'M136,62 C148,74 156,90 160,106 C164,90 162,74 156,64 Z',
];
const BANGS = [HAIR_CAP, ...LOCKS].join(' ');
const SIDE_LOCK: Record<AvatarLook['hairStyle'], string> = {
  short: 'M42,72 Q30,108 40,136 Q48,128 54,116 Q54,96 62,80 Z',
  bob: 'M42,72 Q28,118 40,154 Q50,146 56,130 Q56,100 64,80 Z',
  long: 'M42,72 Q28,124 36,164 Q48,152 56,134 Q56,100 64,80 Z',
  twin: 'M42,72 Q28,118 40,154 Q50,146 56,130 Q56,100 64,80 Z',
};

export function Avatar({ look, stage, physique: p, variant = 'full', background = true, silhouette, className, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (k: string) => `${k}-${uid}`;
  const sil = '#262b3f';
  const c = (color: string) => (silhouette ? sil : color);
  const line = silhouette ? sil : LINE;

  const skin = c(look.skin);
  const skinShadow = c(shade(look.skin, -0.14));
  const hairFill = silhouette ? sil : `url(#${id('hair')})`;
  const hairDark = c(shade(look.hairColor, -0.3));
  const outfit = c(look.outfit);

  // 体の寸法（体つきで太さが変わる）
  const sh = 20 * (0.5 * p.back + 0.5 * p.chest); // 肩幅の半分
  const waist = 14 * (0.75 + 0.25 * p.chest);
  const aw = 5 * p.arms; // 腕の太さの半分
  const lw = 5.2 * p.legs; // 脚の太さの半分
  const flex = stage >= 2;

  const shoulderL = [100 - sh + 4, 158];
  const handL = [100 - sh - 6, 194];
  const shoulderR = [100 + sh - 4, 158];
  const elbowR = [100 + sh + 18, 164];
  const handR = flex ? [100 + sh + 21, 137] : [100 + sh + 6, 194];
  const armR = flex
    ? `M${shoulderR.join(',')} L${elbowR.join(',')} L${handR.join(',')}`
    : `M${shoulderR.join(',')} L${handR.join(',')}`;
  const armL = `M${shoulderL.join(',')} L${handL.join(',')}`;
  const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const lastSegR = flex ? [elbowR, handR] : [shoulderR, handR];

  const torso = `M${100 - sh},154 Q${100 - sh - 2},176 ${100 - waist},198 L${100 + waist},198 Q${100 + sh + 2},176 ${100 + sh},154 Q100,147 ${100 - sh},154 Z`;
  const tank = `M${100 - sh + 6},153 L93,153 Q100,163 107,153 L${100 + sh - 6},153 Q${100 + sh + 1},176 ${100 + waist},198 L${100 - waist},198 Q${100 - sh - 1},176 ${100 - sh + 6},153 Z`;
  const pantsColor = stage === 4 ? '#f4f1e8' : stage === 5 ? '#2a1f4a' : '#2f3550';

  const vb = variant === 'face' ? '28 6 144 144' : '0 0 200 250';

  return (
    <svg viewBox={vb} className={className} role="img" aria-label={title ?? look.name} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id('iris')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(look.eye, -0.62)} />
          <stop offset="0.45" stopColor={look.eye} />
          <stop offset="1" stopColor={shade(look.eye, 0.5)} />
        </linearGradient>
        <linearGradient id={id('hair')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(look.hairColor, 0.12)} />
          <stop offset="0.6" stopColor={look.hairColor} />
          <stop offset="1" stopColor={shade(look.hairColor, -0.18)} />
        </linearGradient>
        <radialGradient id={id('aura')} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor={AURA[stage] || '#fff'} stopOpacity="0.75" />
          <stop offset="0.6" stopColor={AURA[stage] || '#fff'} stopOpacity="0.3" />
          <stop offset="1" stopColor={AURA[stage] || '#fff'} stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('face')}>
          <path d={FACE} />
        </clipPath>
        <clipPath id={id('eye')}>
          <path d="M-15,-7 Q-1,-21 15,-10 Q17,9 3,18 Q-12,18 -15,-7 Z" />
        </clipPath>
      </defs>

      {variant === 'full' && background && <Background stage={stage} id={id} />}
      {variant === 'full' && <ellipse cx="100" cy="241" rx="44" ry="6" fill="#000" opacity="0.18" />}
      {variant === 'full' && AURA[stage] && !silhouette && <ellipse cx="100" cy="140" rx="92" ry="112" fill={`url(#${id('aura')})`} />}

      {/* マント（達人・伝説） */}
      {variant === 'full' && stage >= 4 && (
        <path
          d={`M${100 - sh - 2},153 Q58,204 50,240 L150,240 Q142,204 ${100 + sh + 2},153 Z`}
          fill={c(stage === 4 ? '#c0392b' : '#5b2a86')}
          stroke={c(stage === 4 ? LINE : '#f2c440')}
          strokeWidth={LW}
          strokeLinejoin="round"
        />
      )}

      {/* 後ろ髪 */}
      <path d={BACK_HAIR[look.hairStyle]} fill={hairDark} stroke={line} strokeWidth={LW} strokeLinejoin="round" />
      {look.hairStyle === 'twin' && (
        <>
          <path d={TWIN_TAIL} fill={hairFill} stroke={line} strokeWidth={LW} strokeLinejoin="round" />
          <path d={mirrorX(TWIN_TAIL)} fill={hairFill} stroke={line} strokeWidth={LW} strokeLinejoin="round" />
          {!silhouette && (
            <>
              <path d="M24,120 Q28,150 30,186" stroke={shade(look.hairColor, 0.45)} strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
              <path d="M176,120 Q172,150 170,186" stroke={shade(look.hairColor, 0.45)} strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
            </>
          )}
          <circle cx="50" cy="66" r="5.5" fill={outfit} stroke={line} strokeWidth="1.6" />
          <circle cx="150" cy="66" r="5.5" fill={outfit} stroke={line} strokeWidth="1.6" />
        </>
      )}

      {variant === 'full' && (
        <g strokeLinejoin="round">
          {/* 脚・くつ下・くつ */}
          {[100 - waist * 0.5, 100 + waist * 0.5].map((x) => (
            <g key={x}>
              <rect x={x - lw} y="208" width={lw * 2} height="30" rx={lw} fill={skin} stroke={line} strokeWidth={LW} />
              <rect x={x - lw - 0.2} y="224" width={lw * 2 + 0.4} height="12" fill={c('#ffffff')} />
              <path d={`M${x - lw},224 L${x + lw},224`} stroke={line} strokeWidth="1.2" />
              <path d={`M${x - lw - 4},242 Q${x - lw - 4},233 ${x},233 Q${x + lw + 5},233 ${x + lw + 5},242 Z`} fill={c('#e95b5b')} stroke={line} strokeWidth={LW} />
              <path d={`M${x - lw - 4},241 L${x + lw + 5},241`} stroke={c('#ffffff')} strokeWidth="2" />
            </g>
          ))}
          {/* 胴 */}
          <path d={torso} fill={skin} stroke={line} strokeWidth={LW} />
          {stage === 0 && <path d={torso} fill={outfit} stroke={line} strokeWidth={LW} />}
          {(stage === 1 || stage === 2 || stage === 3 || stage === 5) && (
            <path d={tank} fill={stage === 5 ? c('#2a1f4a') : outfit} stroke={stage === 5 ? c('#f2c440') : line} strokeWidth={LW} />
          )}
          {stage === 4 && (
            <>
              <path d={torso} fill={c('#f7f5ef')} stroke={line} strokeWidth={LW} />
              <path d="M93,153 L100,174 L107,153 Z" fill={skin} />
              <path d="M91,153 L100,180 L109,153" fill="none" stroke={c('#c9c1ae')} strokeWidth="3" />
            </>
          )}
          {stage === 0 && <path d="M93,152 Q100,160 107,152" fill="none" stroke={line} strokeWidth="1.6" />}
          {/* 服のかげ */}
          {!silhouette && stage !== 4 && (
            <path d={`M${100 - waist},198 L${100 + waist},198 L${100 + waist + 1},190 L${100 - waist - 1},190 Z`} fill="#000" opacity="0.1" />
          )}
          {/* 筋肉の線（中級者から） */}
          {stage >= 2 && stage !== 4 && !silhouette && (
            <g fill="none" stroke={shade(stage === 5 ? '#2a1f4a' : look.outfit, -0.4)} strokeWidth="1.4" opacity="0.75">
              <path d={`M${100 - sh * 0.62},170 Q${100 - sh * 0.3},177 100,170 Q${100 + sh * 0.3},177 ${100 + sh * 0.62},170`} />
              <path d="M100,172 L100,188" />
            </g>
          )}
          {/* ズボン */}
          <path
            d={`M${100 - waist - 1},194 L${100 + waist + 1},194 L${100 + waist + 4},216 L101,216 L100,208 L99,216 L${100 - waist - 4},216 Z`}
            fill={c(pantsColor)}
            stroke={line}
            strokeWidth={LW}
          />
          {/* ベルト */}
          {stage === 3 && (
            <>
              <rect x={100 - waist - 2} y="187" width={(waist + 2) * 2} height="9" rx="2" fill={c('#2c2c38')} stroke={line} strokeWidth="1.4" />
              <rect x="94" y="187.5" width="12" height="8" rx="1.5" fill={c('#f2c440')} stroke={line} strokeWidth="1" />
            </>
          )}
          {stage === 4 && <rect x={100 - waist - 1} y="188" width={(waist + 1) * 2} height="7" fill={c('#1d1d24')} />}
          {stage === 5 && (
            <>
              <rect x={100 - waist - 3} y="185" width={(waist + 3) * 2} height="12" rx="3" fill={c('#f2c440')} stroke={line} strokeWidth="1.4" />
              <ellipse cx="100" cy="191" rx="9" ry="7.5" fill={c('#fff2b0')} stroke={line} strokeWidth="1.4" />
            </>
          )}

          {/* 腕（濃い輪郭を描いてから肌色を重ねる） */}
          {[armL, armR].map((d) => (
            <g key={d}>
              <path d={d} fill="none" stroke={line} strokeWidth={aw * 2 + LW * 2} strokeLinecap="round" />
              <path d={d} fill="none" stroke={skin} strokeWidth={aw * 2} strokeLinecap="round" />
            </g>
          ))}
          {flex && (
            <ellipse cx={(shoulderR[0] + elbowR[0]) / 2 + 2} cy="156" rx={7.5 * p.arms} ry={5.8 * p.arms} fill={skin} stroke={line} strokeWidth="1.6" />
          )}
          {/* 袖（Tシャツ・道着） */}
          {(stage === 0 || stage === 4) &&
            [
              [shoulderL, handL],
              [shoulderR, flex ? elbowR : handR],
            ].map(([a, b], i) => {
              const e = lerp(a, b, stage === 4 ? 0.75 : 0.42);
              const d = `M${a.join(',')} L${e.join(',')}`;
              return (
                <g key={i}>
                  <path d={d} stroke={line} strokeWidth={aw * 2 + 4 + LW * 2} strokeLinecap="round" />
                  <path d={d} stroke={stage === 4 ? c('#f7f5ef') : outfit} strokeWidth={aw * 2 + 4} strokeLinecap="round" />
                </g>
              );
            })}
          {/* リストバンド（中級者から） */}
          {stage >= 2 &&
            [[shoulderL, handL], lastSegR].map(([a, b], i) => {
              const s = lerp(a, b, 0.7);
              const e = lerp(a, b, 0.83);
              return <path key={i} d={`M${s.join(',')} L${e.join(',')}`} stroke={c('#ffffff')} strokeWidth={aw * 2 + 1} />;
            })}
          {/* 手（中級者からグローブ） */}
          {[handL, handR].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={aw + 2.2} fill={stage >= 2 ? c('#2c2c38') : skin} stroke={line} strokeWidth={LW} />
          ))}

          {/* 首とあごの下のかげ */}
          <rect x="93" y="128" width="14" height="28" fill={skin} />
          <path d="M93,134 Q100,142 107,134 L107,130 L93,130 Z" fill={skinShadow} />
          <path d="M93,130 L93,154 M107,130 L107,154" stroke={line} strokeWidth="1.4" />
        </g>
      )}

      {/* 顔 */}
      <ellipse cx="47" cy="100" rx="6" ry="8" fill={skin} stroke={line} strokeWidth="1.8" />
      <ellipse cx="153" cy="100" rx="6" ry="8" fill={skin} stroke={line} strokeWidth="1.8" />
      <path d={FACE} fill={skin} stroke={line} strokeWidth={LW} />
      {/* 前髪の下のかげ */}
      {!silhouette && <path d={BANGS} transform="translate(0,6)" fill={skinShadow} clipPath={`url(#${id('face')})`} />}

      {!silhouette && (
        <>
          {/* 目（左は外側が左、右はそれを左右反転） */}
          {[
            [78, 103, 1],
            [122, 103, -1],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x},${y}) scale(${s * 1.18},1.18)`}>
              <path d="M-15,-7 Q-1,-21 15,-10 Q17,9 3,18 Q-12,18 -15,-7 Z" fill="#ffffff" />
              <g clipPath={`url(#${id('eye')})`}>
                <ellipse cx="1.5" cy="2" rx="12" ry="16.5" fill={`url(#${id('iris')})`} stroke={shade(look.eye, -0.65)} strokeWidth="1.2" />
                <ellipse cx="1.5" cy="1" rx="5.5" ry="8" fill={shade(look.eye, -0.7)} />
                <path d="M-8,10 Q1.5,17 11,10 Q1.5,14 -8,10 Z" fill={shade(look.eye, 0.75)} opacity="0.8" />
                <ellipse cx="-3.5" cy="-5" rx="5" ry="5.8" fill="#ffffff" transform="rotate(-20 -3.5 -5)" />
                <circle cx="7" cy="9" r="2.3" fill="#ffffff" />
                <circle cx="-5" cy="9" r="1.2" fill="#ffffff" opacity="0.9" />
              </g>
              {/* 上まつげ（太く、目じりを跳ね上げる） */}
              <path d="M-17,-5 Q-4,-24 17,-12 L16,-8 Q-3,-17 -15,-1 Z" fill={LINE} />
              <path d="M-16,-4 L-22,-10 L-13,-7 Z" fill={LINE} />
              <path d="M-9,18 Q-2,20.5 5,18.5" stroke={LINE} strokeWidth="1.3" fill="none" opacity="0.7" strokeLinecap="round" />
            </g>
          ))}
          {/* ほお（斜線入り）・鼻・口 */}
          {[62, 138].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="125" rx="10" ry="5.5" fill="#ffa8b8" opacity="0.5" />
              <path d={`M${x - 5},127 L${x - 3},123 M${x - 1},127 L${x + 1},123 M${x + 3},127 L${x + 5},123`} stroke="#f58aa0" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
            </g>
          ))}
          <circle cx="100" cy="114" r="1" fill={c(shade(look.skin, -0.45))} />
          {stage >= 1 ? (
            <g stroke={LINE} strokeWidth="1.6" strokeLinejoin="round">
              <path d="M88,120 Q100,123 112,120 Q110,136 100,137 Q90,136 88,120 Z" fill="#8a2c3a" />
              <path d="M90,121 Q100,124 110,121 L109,124 Q100,126 91,124 Z" fill="#ffffff" stroke="none" />
              <path d="M93,132 Q100,126 107,132 Q100,137 93,132 Z" fill="#ff8f9b" stroke="none" />
            </g>
          ) : (
            <g stroke={LINE} strokeWidth="1.6" strokeLinejoin="round">
              <path d="M91,121 Q100,124 109,121 Q107,132 100,133 Q93,132 91,121 Z" fill="#8a2c3a" />
              <path d="M94,129 Q100,125 106,129 Q100,133 94,129 Z" fill="#ff8f9b" stroke="none" />
            </g>
          )}
        </>
      )}

      {/* 前髪・横髪・アホ毛 */}
      <path d={SIDE_LOCK[look.hairStyle]} fill={hairFill} stroke={line} strokeWidth={LW} strokeLinejoin="round" />
      <path d={mirrorX(SIDE_LOCK[look.hairStyle])} fill={hairFill} stroke={line} strokeWidth={LW} strokeLinejoin="round" />
      {/* 頭の上の髪：外側だけ輪郭線（額をよこぎる線は描かない） */}
      <path d={HAIR_CAP} fill={hairFill} />
      <path d="M38,98 C26,4 174,4 162,98" fill="none" stroke={line} strokeWidth={LW} strokeLinecap="round" />
      {LOCKS.map((d) => (
        <path key={d} d={d} fill={hairFill} stroke={line} strokeWidth={LW} strokeLinejoin="round" />
      ))}
      {!silhouette && (
        <>
          {/* 毛の流れ（濃い線）とツヤ（明るい帯） */}
          <g fill="none" stroke={hairDark} strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
            <path d="M70,64 Q74,76 72,88" />
            <path d="M90,60 Q94,72 94,86" />
            <path d="M112,60 Q116,70 120,82" />
            <path d="M132,66 Q138,76 142,88" />
          </g>
          <g fill={shade(look.hairColor, 0.6)} opacity="0.85">
            <path d="M58,52 Q64,38 74,34 Q68,46 66,58 Z" />
            <path d="M82,40 Q90,30 100,29 Q92,36 88,48 Z" />
            <path d="M112,32 Q124,32 132,40 Q122,38 116,44 Z" />
          </g>
          {/* ヘアピン */}
          <path d="M140,70 L154,62" stroke={outfit} strokeWidth="4" strokeLinecap="round" />
          <path d="M142,78 L156,70" stroke={shade(look.outfit, 0.35)} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      <path d="M98,28 Q103,6 124,9 Q108,16 104,30 Z" fill={hairFill} stroke={line} strokeWidth="1.8" strokeLinejoin="round" />

      {/* ハチマキ（初級者・中級者） */}
      {(stage === 1 || stage === 2) && (
        <g stroke={line} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M40,62 Q100,42 160,62 L161,72 Q100,52 39,72 Z" fill={outfit} />
          <path d="M159,64 Q178,68 186,88 Q172,80 157,72 Z" fill={outfit} />
          <path d="M159,66 Q172,78 172,100 Q164,86 156,74 Z" fill={outfit} />
        </g>
      )}
      {/* 王冠（伝説） */}
      {stage === 5 && (
        <g>
          <path d="M72,34 L76,10 L88,24 L100,2 L112,24 L124,10 L128,34 Z" fill={c('#f2c440')} stroke={line} strokeWidth="1.8" strokeLinejoin="round" />
          {!silhouette && (
            <>
              <circle cx="100" cy="25" r="3.5" fill="#e2483d" />
              <circle cx="85" cy="28" r="2.5" fill="#3a8ee6" />
              <circle cx="115" cy="28" r="2.5" fill="#3cb371" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

function Background({ stage, id }: { stage: number; id: (k: string) => string }) {
  const sky = [
    ['#f6ebdd', '#efdcc6'],
    ['#bfe6ff', '#fff4d6'],
    ['#e4e8ef', '#d3d8e2'],
    ['#1b1f3a', '#3a2f5e'],
    ['#ff9a5a', '#ffd9a0'],
    ['#070b26', '#2a2060'],
  ][stage];
  return (
    <g>
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="200" height="250" fill={`url(#${id('bg')})`} />
      {stage === 0 && (
        <>
          <rect x="138" y="30" width="50" height="46" rx="3" fill="#bfe3ff" stroke="#b08a66" strokeWidth="4" />
          <path d="M163,30 L163,76 M138,53 L188,53" stroke="#b08a66" strokeWidth="3" />
          <rect x="10" y="40" width="30" height="40" rx="2" fill="#ffffff" stroke="#d9c4ad" strokeWidth="2" />
          <path d="M17,52 L33,52 M17,60 L33,60 M17,68 L28,68" stroke="#e2483d" strokeWidth="2.5" />
          <rect y="210" width="200" height="40" fill="#c9a27e" />
          <path d="M0,210 L200,210" stroke="#a9825f" strokeWidth="2" />
        </>
      )}
      {stage === 1 && (
        <>
          <circle cx="172" cy="34" r="14" fill="#ffd36b" />
          <ellipse cx="34" cy="40" rx="20" ry="8" fill="#ffffff" opacity="0.85" />
          <rect x="12" y="124" width="8" height="86" fill="#8a5a3c" />
          <circle cx="16" cy="116" r="24" fill="#5fb85a" />
          <rect y="206" width="200" height="44" fill="#8fd17a" />
          <path d="M0,206 Q100,196 200,206" fill="#7cc566" />
        </>
      )}
      {stage === 2 && (
        <>
          <rect x="150" y="26" width="44" height="96" rx="4" fill="#f5f8fc" stroke="#b9c0cc" strokeWidth="3" />
          <path d="M158,36 L170,58 M174,36 L186,58" stroke="#ffffff" strokeWidth="4" opacity="0.8" />
          <rect x="6" y="160" width="36" height="5" fill="#59606e" />
          {[12, 24, 36].map((x) => (
            <rect key={x} x={x - 5} y="149" width="10" height="11" rx="2" fill="#2c2c38" />
          ))}
          <rect y="210" width="200" height="40" fill="#7a7f8c" />
          <path d="M0,210 L200,210" stroke="#5b606c" strokeWidth="2" />
        </>
      )}
      {stage === 3 && (
        <>
          <path d="M14,0 L58,0 L106,214 L56,214 Z" fill="#ffffff" opacity="0.1" />
          <path d="M142,0 L186,0 L144,214 L94,214 Z" fill="#ffffff" opacity="0.1" />
          {[8, 24, 186, 170].map((x, i) => (
            <circle key={x} cx={x} cy={158 + (i % 2) * 8} r="7" fill="#2b2750" />
          ))}
          <ellipse cx="100" cy="236" rx="98" ry="20" fill="#4a3d72" />
          <ellipse cx="100" cy="236" rx="98" ry="20" fill="none" stroke="#e2483d" strokeWidth="3" />
        </>
      )}
      {stage === 4 && (
        <>
          <circle cx="160" cy="70" r="20" fill="#fff0c8" opacity="0.9" />
          <path d="M0,170 L40,120 L70,150 L110,96 L150,150 L175,128 L200,160 L200,250 L0,250 Z" fill="#8a6090" />
          <path d="M0,200 L30,176 L60,192 L100,160 L140,192 L170,178 L200,196 L200,250 L0,250 Z" fill="#6b4a7a" />
          <path d="M40,250 L72,218 L128,218 L160,250 Z" fill="#5a3d66" />
        </>
      )}
      {stage === 5 && (
        <>
          {[
            [12, 22], [30, 60], [16, 100], [188, 30], [180, 76], [192, 118], [10, 160], [190, 170], [40, 12], [160, 8],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} fill="#ffffff" opacity={i % 2 ? 0.7 : 1} />
          ))}
          <path d="M168,16 A14,14 0 1,0 182,38 A10,10 0 1,1 168,16 Z" fill="#fff4c2" />
          <ellipse cx="100" cy="238" rx="90" ry="12" fill="#3b2f7a" opacity="0.8" />
        </>
      )}
    </g>
  );
}
