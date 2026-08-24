/** Consecutive active days implied by streak count ending at lastActiveAt. Not a stored day log. */
export function inferredStreakDays(streak: number, lastActiveAt?: string) {
  const days = new Set<string>();
  if (streak <= 0 || !lastActiveAt) return days;
  const end = new Date(lastActiveAt);
  if (Number.isNaN(end.getTime())) return days;
  for (let i = 0; i < streak; i += 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.add(`${y}-${m}-${day}`);
  }
  return days;
}

export function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
