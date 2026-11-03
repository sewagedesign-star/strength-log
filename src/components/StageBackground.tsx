// 演出の段階ごとの背景（200×250 の座標で描く）

export function Background({ stage, id }: { stage: number; id: (k: string) => string }) {
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
