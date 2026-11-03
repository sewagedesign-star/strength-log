// キャラの絵（2頭身・アニメ調）。図形だけで描くので、画像ファイルは使わない。
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

const mirrorX = (d: string) =>
  // 左右反転したパス（x → 200 − x）。数字の組「x,y」だけを使って書いたパスに限る
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)},${y}`);

const AURA = ['', '', '', '#5ab0ff', '#ff5a4a', '#ffd34a'];

export function Avatar({ look, stage, physique: p, variant = 'full', background = true, silhouette, className, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (k: string) => `${k}-${uid}`;
  const sil = '#262b3f';
  const c = (color: string) => (silhouette ? sil : color);

  const skin = c(look.skin);
  const skinLine = c(shade(look.skin, -0.38));
  const hair = c(look.hairColor);
  const hairDark = c(shade(look.hairColor, -0.28));
  const hairLine = c(shade(look.hairColor, -0.5));
  const hairLight = shade(look.hairColor, 0.5);
  const outfit = c(look.outfit);
  const outfitDark = c(shade(look.outfit, -0.3));

  // 体の寸法（体つきで太さが変わる）
  const sh = 23 * (0.5 * p.back + 0.5 * p.chest); // 肩幅の半分
  const waist = 16 * (0.75 + 0.25 * p.chest);
  const aw = 6 * p.arms; // 腕の太さの半分
  const lw = 6.5 * p.legs; // 脚の太さの半分
  const flex = stage >= 2;

  const shoulderL = [100 - sh + 4, 152];
  const handL = [100 - sh - 7, 190];
  const shoulderR = [100 + sh - 4, 152];
  const elbowR = [100 + sh + 20, 158];
  const handR = flex ? [100 + sh + 23, 128] : [100 + sh + 7, 190];
  const armR = flex
    ? `M${shoulderR.join(',')} L${elbowR.join(',')} L${handR.join(',')}`
    : `M${shoulderR.join(',')} L${handR.join(',')}`;
  const armL = `M${shoulderL.join(',')} L${handL.join(',')}`;
  const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const lastSegR = flex ? [elbowR, handR] : [shoulderR, handR];

  const torso = `M${100 - sh},148 Q${100 - sh - 2},170 ${100 - waist},192 L${100 + waist},192 Q${100 + sh + 2},170 ${100 + sh},148 Q100,141 ${100 - sh},148 Z`;
  const tank = `M${100 - sh + 7},147 L92,147 Q100,158 108,147 L${100 + sh - 7},147 Q${100 + sh + 1},170 ${100 + waist},192 L${100 - waist},192 Q${100 - sh - 1},170 ${100 - sh + 7},147 Z`;
  const pants = stage === 4 ? c('#f4f1e8') : stage === 5 ? c('#2a1f4a') : c('#2f3550');

  // 髪型ごとの後ろ髪
  const backHair: Record<AvatarLook['hairStyle'], string> = {
    short: 'M40,86 C32,16 168,16 160,86 Q156,114 142,120 L58,120 Q44,114 40,86 Z',
    bob: 'M38,82 C30,16 170,16 162,82 L164,128 Q148,139 133,127 L67,127 Q52,139 36,128 Z',
    long: 'M38,82 C30,16 170,16 162,82 Q170,140 168,192 Q150,204 132,190 L68,190 Q50,204 32,192 Q30,140 38,82 Z',
    twin: 'M40,86 C32,16 168,16 160,86 Q156,114 142,120 L58,120 Q44,114 40,86 Z',
  };
  const twinTail = 'M50,60 C16,78 10,150 28,196 C34,172 42,142 58,94 Z';
  const sideLock = look.hairStyle === 'short' ? 'M44,74 Q36,100 46,124 Q50,108 60,84 Z' : 'M44,74 Q34,112 44,146 Q50,124 61,86 Z';
  const bangs =
    'M42,90 C30,14 170,14 158,90 Q154,78 147,70 Q148,82 141,88 Q137,74 128,63 Q129,78 120,86 Q114,70 105,60 Q106,76 98,85 Q91,70 84,61 Q83,76 78,86 Q71,74 66,65 Q64,79 58,88 Q54,78 50,70 Q47,80 42,90 Z';

  const vb = variant === 'face' ? '36 8 128 128' : '0 0 200 250';

  return (
    <svg viewBox={vb} className={className} role="img" aria-label={title ?? look.name} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id('iris')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(look.eye, -0.55)} />
          <stop offset="0.55" stopColor={look.eye} />
          <stop offset="1" stopColor={shade(look.eye, 0.35)} />
        </linearGradient>
        <radialGradient id={id('aura')} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor={AURA[stage] || '#fff'} stopOpacity="0.75" />
          <stop offset="0.6" stopColor={AURA[stage] || '#fff'} stopOpacity="0.3" />
          <stop offset="1" stopColor={AURA[stage] || '#fff'} stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('eye')}>
          <path d="M-13,-4 Q0,-17 13,-5 Q12,12 0,14 Q-12,12 -13,-4 Z" />
        </clipPath>
      </defs>

      {variant === 'full' && background && <Background stage={stage} id={id} />}
      {variant === 'full' && <ellipse cx="100" cy="239" rx="46" ry="6" fill="#000" opacity="0.18" />}
      {variant === 'full' && AURA[stage] && !silhouette && <ellipse cx="100" cy="140" rx="92" ry="112" fill={`url(#${id('aura')})`} />}

      {/* マント（達人・伝説） */}
      {variant === 'full' && stage >= 4 && (
        <path
          d={`M${100 - sh - 2},147 Q58,200 50,238 L150,238 Q142,200 ${100 + sh + 2},147 Z`}
          fill={c(stage === 4 ? '#c0392b' : '#5b2a86')}
          stroke={c(stage === 4 ? '#7d2419' : '#f2c440')}
          strokeWidth="2"
        />
      )}

      {/* 後ろ髪 */}
      <path d={backHair[look.hairStyle]} fill={hairDark} stroke={hairLine} strokeWidth="1.5" />
      {look.hairStyle === 'twin' && (
        <>
          <path d={twinTail} fill={hair} stroke={hairLine} strokeWidth="1.5" />
          <path d={mirrorX(twinTail)} fill={hair} stroke={hairLine} strokeWidth="1.5" />
          <circle cx="51" cy="62" r="5" fill={outfit} />
          <circle cx="149" cy="62" r="5" fill={outfit} />
        </>
      )}

      {variant === 'full' && (
        <g>
          {/* 脚と靴 */}
          {[100 - waist * 0.5, 100 + waist * 0.5].map((x) => (
            <g key={x}>
              <rect x={x - lw} y="204" width={lw * 2} height="30" rx={lw} fill={skin} stroke={skinLine} strokeWidth="1.2" />
              <ellipse cx={x} cy="235" rx={lw + 4} ry="5.5" fill={c('#ffffff')} stroke={c('#9aa0b4')} strokeWidth="1.2" />
            </g>
          ))}
          {/* 胴 */}
          <path d={torso} fill={skin} stroke={skinLine} strokeWidth="1.2" />
          {stage === 0 && <path d={torso} fill={outfit} stroke={outfitDark} strokeWidth="1.2" />}
          {(stage === 1 || stage === 2 || stage === 3 || stage === 5) && (
            <path d={tank} fill={stage === 5 ? c('#2a1f4a') : outfit} stroke={stage === 5 ? c('#f2c440') : outfitDark} strokeWidth="1.4" />
          )}
          {stage === 4 && (
            <>
              <path d={torso} fill={c('#f7f5ef')} stroke={c('#c9c1ae')} strokeWidth="1.2" />
              <path d="M92,147 L100,170 L108,147 Z" fill={skin} />
              <path d="M90,147 L100,176 L110,147" fill="none" stroke={c('#c9c1ae')} strokeWidth="3" />
            </>
          )}
          {stage === 0 && <path d="M92,146 Q100,154 108,146" fill="none" stroke={outfitDark} strokeWidth="2" />}
          {/* 筋肉の線（中級者から） */}
          {stage >= 2 && stage !== 4 && !silhouette && (
            <g fill="none" stroke={shade(stage === 5 ? '#2a1f4a' : look.outfit, -0.35)} strokeWidth="1.4" opacity="0.7">
              <path d={`M${100 - sh * 0.62},164 Q${100 - sh * 0.3},171 100,164 Q${100 + sh * 0.3},171 ${100 + sh * 0.62},164`} />
              <path d="M100,166 L100,184" />
            </g>
          )}
          {/* ズボン */}
          <path
            d={`M${100 - waist - 1},188 L${100 + waist + 1},188 L${100 + waist + 4},212 L101,212 L100,203 L99,212 L${100 - waist - 4},212 Z`}
            fill={pants}
            stroke={c(shade(stage === 4 ? '#f4f1e8' : '#2f3550', -0.3))}
            strokeWidth="1.2"
          />
          {/* ベルト */}
          {stage === 3 && (
            <>
              <rect x={100 - waist - 2} y="181" width={(waist + 2) * 2} height="9" rx="2" fill={c('#2c2c38')} />
              <rect x="94" y="181.5" width="12" height="8" rx="1.5" fill={c('#f2c440')} />
            </>
          )}
          {stage === 4 && <rect x={100 - waist - 1} y="182" width={(waist + 1) * 2} height="7" fill={c('#1d1d24')} />}
          {stage === 5 && (
            <>
              <rect x={100 - waist - 3} y="179" width={(waist + 3) * 2} height="12" rx="3" fill={c('#f2c440')} stroke={c('#b8860b')} strokeWidth="1.2" />
              <ellipse cx="100" cy="185" rx="9" ry="7.5" fill={c('#fff2b0')} stroke={c('#b8860b')} strokeWidth="1.2" />
            </>
          )}

          {/* 腕（外側に濃い線を描いてから肌色を重ねる） */}
          {[armL, armR].map((d) => (
            <g key={d}>
              <path d={d} fill="none" stroke={skinLine} strokeWidth={aw * 2 + 2.4} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={skin} strokeWidth={aw * 2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {flex && (
            <ellipse cx={(shoulderR[0] + elbowR[0]) / 2 + 2} cy="150" rx={8.5 * p.arms} ry={6.5 * p.arms} fill={skin} stroke={skinLine} strokeWidth="1.2" />
          )}
          {/* 袖（Tシャツ・道着） */}
          {(stage === 0 || stage === 4) &&
            [
              [shoulderL, handL],
              [shoulderR, flex ? elbowR : handR],
            ].map(([a, b], i) => {
              const e = lerp(a, b, stage === 4 ? 0.75 : 0.4);
              return (
                <path
                  key={i}
                  d={`M${a.join(',')} L${e.join(',')}`}
                  stroke={stage === 4 ? c('#f7f5ef') : outfit}
                  strokeWidth={aw * 2 + 4}
                  strokeLinecap="round"
                />
              );
            })}
          {/* リストバンド（中級者から） */}
          {stage >= 2 &&
            [
              [shoulderL, handL],
              lastSegR,
            ].map(([a, b], i) => {
              const s = lerp(a, b, 0.72);
              const e = lerp(a, b, 0.84);
              return <path key={i} d={`M${s.join(',')} L${e.join(',')}`} stroke={c('#ffffff')} strokeWidth={aw * 2 + 2} />;
            })}
          {/* 手（中級者からグローブ） */}
          {[handL, handR].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={aw + 2} fill={stage >= 2 ? c('#2c2c38') : skin} stroke={stage >= 2 ? c('#14141c') : skinLine} strokeWidth="1.2" />
          ))}

          {/* 首 */}
          <rect x="93" y="122" width="14" height="28" fill={skin} />
          <path d="M93,128 Q100,134 107,128" fill="none" stroke={skinLine} strokeWidth="1" opacity="0.6" />
        </g>
      )}

      {/* 顔 */}
      <ellipse cx="51" cy="96" rx="6" ry="8" fill={skin} stroke={skinLine} strokeWidth="1.2" />
      <ellipse cx="149" cy="96" rx="6" ry="8" fill={skin} stroke={skinLine} strokeWidth="1.2" />
      <path d="M52,80 C52,44 148,44 148,80 C148,114 124,130 100,132 C76,130 52,114 52,80 Z" fill={skin} stroke={skinLine} strokeWidth="1.5" />

      {!silhouette && (
        <>
          {/* 目（左は外側が左、右はそれを左右反転） */}
          {[
            [79, 98, 1],
            [121, 98, -1],
          ].map(([x, y, s]) => (
            <g key={x} transform={`translate(${x},${y}) scale(${s},1)`}>
              <path d="M-13,-4 Q0,-17 13,-5 Q12,12 0,14 Q-12,12 -13,-4 Z" fill="#ffffff" />
              <g clipPath={`url(#${id('eye')})`}>
                <ellipse cx="1" cy="2" rx="9.5" ry="12.5" fill={`url(#${id('iris')})`} />
                <ellipse cx="1" cy="2" rx="4.2" ry="6.2" fill={shade(look.eye, -0.65)} />
                <path d="M-6,9 Q1,14 8,9" stroke={shade(look.eye, 0.6)} strokeWidth="2" fill="none" opacity="0.7" />
                <circle cx="-3" cy="-3" r="3.6" fill="#ffffff" />
                <circle cx="5" cy="7" r="1.7" fill="#ffffff" opacity="0.9" />
              </g>
              <path d="M-14,-3 Q-2,-19 14,-6" stroke="#2a1b22" strokeWidth="3.4" fill="none" strokeLinecap="round" />
              <path d="M-14,-3 L-18,-7" stroke="#2a1b22" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M-5,14 Q1,15.5 6,13.5" stroke="#2a1b22" strokeWidth="1" fill="none" opacity="0.45" />
            </g>
          ))}
          {/* ほお・鼻・口 */}
          <ellipse cx="66" cy="114" rx="9" ry="4.5" fill="#ff8fa3" opacity="0.42" />
          <ellipse cx="134" cy="114" rx="9" ry="4.5" fill="#ff8fa3" opacity="0.42" />
          <path d="M99.5,108 L100.5,110" stroke={skinLine} strokeWidth="1.2" strokeLinecap="round" />
          {stage >= 2 ? (
            <>
              <path d="M93,116 Q100,127 107,116 Z" fill="#8a2c3a" />
              <path d="M96,121 Q100,125 104,121 Q100,119 96,121 Z" fill="#ff8f9b" />
            </>
          ) : (
            <path d="M94,117 Q100,122 106,117" stroke="#7a3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          )}
        </>
      )}

      {/* 前髪・横髪・アホ毛 */}
      <path d={sideLock} fill={hair} stroke={hairLine} strokeWidth="1.3" />
      <path d={mirrorX(sideLock)} fill={hair} stroke={hairLine} strokeWidth="1.3" />
      <path d={bangs} fill={hair} stroke={hairLine} strokeWidth="1.5" strokeLinejoin="round" />
      {!silhouette && (
        <g fill="none" strokeLinecap="round">
          <path d="M70,44 Q80,58 78,80" stroke={hairDark} strokeWidth="1.6" opacity="0.7" />
          <path d="M100,40 Q104,58 100,76" stroke={hairDark} strokeWidth="1.6" opacity="0.7" />
          <path d="M128,46 Q118,60 120,78" stroke={hairDark} strokeWidth="1.6" opacity="0.7" />
          <path d="M62,46 Q100,30 138,46 Q100,38 62,46 Z" fill={hairLight} stroke="none" opacity="0.75" />
        </g>
      )}
      <path d="M98,34 Q103,12 122,15 Q107,21 104,36 Z" fill={hair} stroke={hairLine} strokeWidth="1.3" />

      {/* ハチマキ（初級者・中級者） */}
      {(stage === 1 || stage === 2) && (
        <g>
          <path d="M45,64 Q100,46 155,64 L156,73 Q100,55 44,73 Z" fill={outfit} stroke={outfitDark} strokeWidth="1.2" />
          <path d="M154,66 Q172,70 180,88 Q168,80 152,72 Z" fill={outfit} stroke={outfitDark} strokeWidth="1" />
          <path d="M154,68 Q166,78 166,98 Q160,86 151,74 Z" fill={outfit} stroke={outfitDark} strokeWidth="1" />
        </g>
      )}
      {/* 王冠（伝説） */}
      {stage === 5 && (
        <g>
          <path d="M74,42 L78,18 L89,32 L100,10 L111,32 L122,18 L126,42 Z" fill={c('#f2c440')} stroke={c('#a87a00')} strokeWidth="1.5" strokeLinejoin="round" />
          {!silhouette && (
            <>
              <circle cx="100" cy="33" r="3.5" fill="#e2483d" />
              <circle cx="85" cy="36" r="2.5" fill="#3a8ee6" />
              <circle cx="115" cy="36" r="2.5" fill="#3cb371" />
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
          <rect x="128" y="34" width="54" height="50" rx="3" fill="#bfe3ff" stroke="#b08a66" strokeWidth="4" />
          <path d="M155,34 L155,84 M128,59 L182,59" stroke="#b08a66" strokeWidth="3" />
          <rect x="18" y="44" width="34" height="44" rx="2" fill="#ffffff" stroke="#d9c4ad" strokeWidth="2" />
          <path d="M26,58 L44,58 M26,66 L44,66 M26,74 L38,74" stroke="#e2483d" strokeWidth="2.5" />
          <rect y="206" width="200" height="44" fill="#c9a27e" />
          <path d="M0,206 L200,206" stroke="#a9825f" strokeWidth="2" />
        </>
      )}
      {stage === 1 && (
        <>
          <circle cx="166" cy="38" r="15" fill="#ffd36b" />
          <ellipse cx="40" cy="56" rx="22" ry="9" fill="#ffffff" opacity="0.85" />
          <rect x="22" y="120" width="8" height="86" fill="#8a5a3c" />
          <circle cx="26" cy="112" r="26" fill="#5fb85a" />
          <circle cx="12" cy="128" r="16" fill="#4fa64c" />
          <rect y="200" width="200" height="50" fill="#8fd17a" />
          <path d="M0,200 Q100,190 200,200" fill="#7cc566" />
        </>
      )}
      {stage === 2 && (
        <>
          <rect x="124" y="30" width="62" height="100" rx="4" fill="#f5f8fc" stroke="#b9c0cc" strokeWidth="3" />
          <path d="M136,40 L150,62 M160,40 L174,62" stroke="#ffffff" strokeWidth="4" opacity="0.8" />
          <rect x="12" y="150" width="44" height="5" fill="#59606e" />
          {[18, 32, 46].map((x) => (
            <g key={x}>
              <rect x={x - 5} y="139" width="10" height="11" rx="2" fill="#2c2c38" />
            </g>
          ))}
          <rect y="206" width="200" height="44" fill="#7a7f8c" />
          <path d="M0,206 L200,206" stroke="#5b606c" strokeWidth="2" />
        </>
      )}
      {stage === 3 && (
        <>
          <path d="M20,0 L64,0 L110,210 L60,210 Z" fill="#ffffff" opacity="0.1" />
          <path d="M136,0 L180,0 L140,210 L90,210 Z" fill="#ffffff" opacity="0.1" />
          {[10, 30, 50, 150, 170, 190].map((x, i) => (
            <circle key={x} cx={x} cy={150 + (i % 3) * 8} r="7" fill="#2b2750" />
          ))}
          <ellipse cx="100" cy="232" rx="98" ry="22" fill="#4a3d72" />
          <ellipse cx="100" cy="232" rx="98" ry="22" fill="none" stroke="#e2483d" strokeWidth="3" />
        </>
      )}
      {stage === 4 && (
        <>
          <circle cx="150" cy="92" r="22" fill="#fff0c8" opacity="0.9" />
          <path d="M0,170 L40,120 L70,150 L110,96 L150,150 L175,128 L200,160 L200,250 L0,250 Z" fill="#8a6090" />
          <path d="M0,200 L30,176 L60,192 L100,160 L140,192 L170,178 L200,196 L200,250 L0,250 Z" fill="#6b4a7a" />
          <path d="M40,250 L72,214 L128,214 L160,250 Z" fill="#5a3d66" />
        </>
      )}
      {stage === 5 && (
        <>
          {[
            [18, 22], [44, 60], [70, 18], [152, 30], [178, 64], [128, 12], [30, 120], [176, 140], [10, 180], [190, 196], [60, 98], [140, 96],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} fill="#ffffff" opacity={i % 2 ? 0.7 : 1} />
          ))}
          <path d="M160,20 A16,16 0 1,0 176,44 A12,12 0 1,1 160,20 Z" fill="#fff4c2" />
          <ellipse cx="100" cy="234" rx="90" ry="14" fill="#3b2f7a" opacity="0.8" />
        </>
      )}
    </g>
  );
}
