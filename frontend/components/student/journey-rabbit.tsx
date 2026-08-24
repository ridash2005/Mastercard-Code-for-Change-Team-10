export function JourneyRabbit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} role="img" aria-label="Your place on the learning path">
      <ellipse cx="32" cy="66" rx="14" ry="3.5" fill="#1a1630" opacity="0.12" />
      <path className="rabbit-ear" d="M18 18c-1-12 6-18 10-8 1 3 1 10 0 14" fill="#f7f4ee" stroke="#1a1630" strokeWidth="1.4" />
      <path className="rabbit-ear rabbit-ear-right" d="M46 18c1-12-6-18-10-8-1 3-1 10 0 14" fill="#f7f4ee" stroke="#1a1630" strokeWidth="1.4" />
      <path d="M20 20c-1-10 5-14 8-6" fill="#f1c9d6" opacity="0.85" />
      <path d="M44 20c1-10-5-14-8-6" fill="#f1c9d6" opacity="0.85" />
      <ellipse cx="32" cy="38" rx="16" ry="18" fill="#fffcf7" stroke="#1a1630" strokeWidth="1.5" />
      <ellipse cx="32" cy="52" rx="12" ry="10" fill="#fffcf7" stroke="#1a1630" strokeWidth="1.5" />
      <circle cx="26" cy="36" r="2.1" fill="#1a1630" />
      <circle cx="38" cy="36" r="2.1" fill="#1a1630" />
      <ellipse cx="32" cy="42" rx="2.2" ry="1.6" fill="#ec1975" />
      <path d="M32 43.5c-3 3-6 2.2-7 0" fill="none" stroke="#1a1630" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 43.5c3 3 6 2.2 7 0" fill="none" stroke="#1a1630" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="22" cy="41" r="3" fill="#f3c4c8" opacity="0.7" />
      <circle cx="42" cy="41" r="3" fill="#f3c4c8" opacity="0.7" />
    </svg>
  );
}
