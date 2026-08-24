"use client";

import { ChatbotPanel } from "@/components/ai/chatbot";

export default function ChatbotPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">AI Chatbot</h1>
      <p className="mt-1 text-sm text-muted">
        General Katalyst assistance. For personalised performance advice, use AI Coach.
      </p>
      <div className="mt-6 max-w-xl">
        <ChatbotPanel />
      </div>
    </div>
  );
}
