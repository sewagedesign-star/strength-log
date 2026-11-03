// 効果音。音声ファイルは使わず、その場で音を作る（オフラインでも鳴る）。
// iPhone では、ボタンを押した瞬間に primeAudio() を呼んでおかないと鳴らない。

let ctx: AudioContext | null = null;

/** ボタンを押した処理の最初（await より前）に呼ぶ */
export function primeAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', vol = 0.14): void {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** 保存したとき：短い「ピコッ」 */
export function playSave(): void {
  tone(880, 0, 0.09);
  tone(1320, 0.07, 0.14);
}

/** レベルアップ・実績・目標達成：短いファンファーレ */
export function playFanfare(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, i * 0.09, 0.22, 'square', 0.07));
  tone(1046.5, 0.38, 0.5, 'triangle', 0.12);
}
