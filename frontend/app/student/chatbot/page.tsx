"use client";

import { ChatbotPanel } from "@/components/ai/chatbot";
import { useI18n } from "@/lib/i18n/provider";

export default function ChatbotPage() {
  const { t } = useI18n();
  return (
    <div>
      <h1 className="font-serif text-3xl">{t.chatbot}</h1>
      <p className="mt-1 text-sm text-muted">{t.aiChatbotPageSubtitle}</p>
      <div className="mt-6 max-w-xl">
        <ChatbotPanel />
      </div>
    </div>
  );
}
