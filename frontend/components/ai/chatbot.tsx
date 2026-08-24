"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { chatbotReply, suggestedPrompts } from "@/lib/ai/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceAssist } from "@/components/voice/voice-assist";
import { VoiceMicButton } from "@/components/voice/voice-mic";

export const CHAT_OPEN_EVENT = "katalyst-open-chat";

export function ChatbotPanel({ seedQuery }: { seedQuery?: string }) {
  const [input, setInput] = useState(seedQuery ?? "");
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    {
      role: "bot",
      text: "General Katalyst help — courses, XP, navigation, complaints, rescheduling. For personalised coaching, use AI Coach.",
    },
  ]);
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    const reply = await chatbotReply(q);
    setMessages((m) => [...m, { role: "bot", text: reply }]);
    setBusy(false);
  }

  return (
    <div className="k-card flex h-[28rem] flex-col overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
        {messages.map((m, i) => (
          <p key={i} className={m.role === "user" ? "text-right" : ""}>
            <span className="inline-block rounded-lg bg-ivory px-3 py-1.5 text-plum">{m.text}</span>
          </p>
        ))}
        {busy ? <p className="text-xs text-muted">Thinking… (mock)</p> : null}
      </div>
      <div className="flex flex-wrap gap-1 border-t p-2">
        {suggestedPrompts.map((p) => (
          <button key={p} className="rounded-full border border-line bg-ivory px-2 py-1 text-[11px] text-plum" onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search with AI..." aria-label="Search with AI" />
        <VoiceMicButton onTranscript={setInput} />
        <Button type="submit">Send</Button>
      </form>
      <div className="px-2 pb-2">
        <VoiceAssist onTranscript={(t) => setInput(t)} />
      </div>
    </div>
  );
}

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");

  const onOpen = useCallback((e: Event) => {
    const detail = (e as CustomEvent<{ query?: string }>).detail;
    setSeed(detail?.query ?? "");
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener(CHAT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, onOpen);
  }, [onOpen]);

  return (
    <div className="fixed bottom-20 right-4 z-30 md:bottom-6">
      {open ? (
        <div className="mb-2 w-[min(24rem,calc(100vw-2rem))]">
          <ChatbotPanel seedQuery={seed} />
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        {open ? (
          <Link href="/student/chatbot" className="self-end text-xs font-medium text-plum underline">
            Open full
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Ask AI Coach"
          title="Ask AI Coach"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-plum text-white shadow-[0_10px_24px_-8px_rgba(26,22,48,0.55)] hover:bg-navy"
        >
          <Mic className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
