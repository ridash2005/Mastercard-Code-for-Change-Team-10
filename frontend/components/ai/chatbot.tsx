"use client";

import Link from "next/link";
import { useState } from "react";
import { chatbotReply, suggestedPrompts } from "@/lib/ai/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceAssist } from "@/components/voice/voice-assist";

export function ChatbotPanel() {
  const [input, setInput] = useState("");
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
    <div className="flex h-[28rem] flex-col rounded-xl border border-stone-200 bg-white">
      <div className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
        {messages.map((m, i) => (
          <p key={i} className={m.role === "user" ? "text-right" : ""}>
            <span className={m.role === "user" ? "inline-block rounded-lg bg-sand px-3 py-1.5" : "inline-block rounded-lg bg-stone-100 px-3 py-1.5"}>
              {m.text}
            </span>
          </p>
        ))}
        {busy ? <p className="text-xs text-stone-500">Thinking… (mock)</p> : null}
      </div>
      <div className="flex flex-wrap gap-1 border-t p-2">
        {suggestedPrompts.map((p) => (
          <button key={p} className="rounded-full border px-2 py-1 text-[11px]" onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 border-t p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about Katalyst…" />
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
  return (
    <div className="fixed bottom-4 right-4 z-30">
      {open ? (
        <div className="mb-2 w-[min(24rem,calc(100vw-2rem))]">
          <ChatbotPanel />
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        {open ? (
          <Link href="/student/chatbot" className="self-end text-xs underline">
            Open full
          </Link>
        ) : null}
        <Button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Close chat" : "Chat"}
        </Button>
      </div>
    </div>
  );
}
