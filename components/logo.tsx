export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="6" fill="#1F3D2B" />
        <path d="M8 22V10h4l4 6 4-6h4v12h-3.2v-7.2L16.6 22h-1.2l-4.2-7.2V22H8z" fill="#F4EFE6" />
        <path d="M8 24h16" stroke="#B08D3E" strokeWidth="1.6" />
      </svg>
      <span className="font-serif text-lg tracking-tight">Katalyst</span>
    </span>
  );
}
