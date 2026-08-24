"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { VoiceAssist } from "@/components/voice/voice-assist";
import { VoiceMicButton } from "@/components/voice/voice-mic";
import { usePlatform } from "@/lib/data/platform-store";
import { levelFromXp } from "@/lib/utils";
import { NotificationPanel } from "@/components/notifications/panel";
import { Logo } from "@/components/logo";
import { CHAT_OPEN_EVENT } from "@/components/ai/chatbot";

export function Topbar({ variant, onOpenMenu }: { variant: "student" | "admin"; onOpenMenu?: () => void }) {
  const store = usePlatform();
  const router = useRouter();
  const user = store.users.find((u) => u.id === store.sessionUserId);
  const profile = store.studentProfiles.find((p) => p.userId === store.sessionUserId);
  const lvl = levelFromXp(profile?.xp ?? 0);
  return (
    <header className="portal-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="md:hidden">
          <Logo invert />
        </div>
        {variant === "student" && onOpenMenu ? (
          <button type="button" className="md:hidden" onClick={onOpenMenu} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        ) : variant === "admin" && onOpenMenu ? (
          <button type="button" className="md:hidden" onClick={onOpenMenu} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <p className="truncate text-sm font-medium text-white">
          {user?.name}
          {variant === "student" && profile ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-plum">
              L{lvl.level} · {profile.xp.toLocaleString()} XP
            </span>
          ) : null}
        </p>
      </div>
      {variant === "student" ? <AiSearchField /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <VoiceAssist />
        <LanguageSelector />
        <NotificationPanel audience={variant} userId={store.sessionUserId} />
        <Link href={variant === "student" ? "/student/profile" : "/admin/settings"} className="px-3 py-1.5 text-sm">
          Account
        </Link>
        <Button
          variant="ghost"
          onClick={() => {
            store.logout();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}

function AiSearchField() {
  const [q, setQ] = useState("");
  return (
    <form
      className="hidden min-w-[12rem] max-w-sm flex-1 items-center gap-1 lg:flex"
      onSubmit={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: { query: q } }));
      }}
    >
      <label className="sr-only" htmlFor="ai-search">
        Search with AI
      </label>
      <input
        id="ai-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search with AI..."
        className="h-9 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/70"
      />
      <VoiceMicButton
        onTranscript={(text) => {
          setQ(text);
          window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: { query: text } }));
        }}
      />
    </form>
  );
}
