export function DonutChart({
  value,
  total,
  label,
  size = 148,
}: {
  value: number;
  total: number;
  label: string;
  size?: number;
}) {
  const pct = total ? value / total : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={label}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--track)" strokeWidth="16" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - pct * c}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--navy)">
        {value}/{total}
      </text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill="var(--muted)">
        active
      </text>
    </svg>
  );
}

export function BarRows({
  rows,
}: {
  rows: { label: string; pct: number; hint?: string }[];
}) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-plum">{row.label}</span>
            <span className="text-muted">
              {row.pct}%{row.hint ? ` · ${row.hint}` : ""}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuenow={row.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${row.label} ${row.pct}%`}>
            <div className="h-full rounded-full bg-blue" style={{ width: `${row.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
