/** 端末のローカル日付を YYYY-MM-DD で返す */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parse(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** その日を含む週の月曜日（YYYY-MM-DD） */
export function weekStart(key: string): string {
  const d = parse(key);
  const dow = (d.getDay() + 6) % 7; // 月曜=0
  d.setDate(d.getDate() - dow);
  return toDateKey(d);
}

const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];

/** 例：11月3日（火） */
export function formatDate(key: string): string {
  const d = parse(key);
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY[d.getDay()]}）`;
}

/** 例：11/3 */
export function formatShortDate(key: string): string {
  const d = parse(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
