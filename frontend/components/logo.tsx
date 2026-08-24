export function Logo({ className = "h-8", invert = false }: { className?: string; invert?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill={invert ? "#ffffff" : "var(--pink)"} />
        <path
          d="M9 8h3.6v6.15L20.7 8H25l-8.35 8.15L25 24h-4.4l-8-7.85V24H9V8z"
          fill={invert ? "var(--pink)" : "#ffffff"}
        />
        <path
          d="M24.2 4.6 25 6.8l2.4.28-1.8 1.78.5 2.36L24.2 10l-2.1 1.22.5-2.36-1.8-1.78 2.4-.28z"
          fill="var(--gold)"
        />
      </svg>
      <span className={`font-serif text-lg tracking-tight ${invert ? "text-white" : "text-plum"}`}>Katalyst</span>
    </span>
  );
}
