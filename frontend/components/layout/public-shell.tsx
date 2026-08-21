"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSelector } from "@/components/language-selector";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = [
    { href: "/", label: "Home" },
    { href: "/contact", label: t.contact },
    { href: "/feedback", label: t.feedback },
    { href: "/complaint", label: t.complaints },
    { href: "/emergency", label: t.emergency },
  ];
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Katalyst home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={pathname === l.href ? "font-medium" : "text-stone-600"}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Link href="/login" className="rounded-md px-3 py-1.5 text-sm hover:bg-stone-100">
              {t.signIn}
            </Link>
            <Link href="/register" className="rounded-md bg-forest px-3 py-1.5 text-sm text-white">
              {t.getStarted}
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-stone-200 px-4 py-8 text-center text-xs text-stone-500">
        Katalyst is a programme engagement demo for Mastercard Code for Change. Mock data only.
      </footer>
    </div>
  );
}
