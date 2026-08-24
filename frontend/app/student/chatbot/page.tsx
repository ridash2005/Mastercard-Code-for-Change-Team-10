"use client";

import { ChatbotPanel } from "@/components/ai/chatbot";

export default function ChatbotPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">AI Chatbot</h1>
      <p className="mt-1 text-sm text-muted">
        Ask a question, or ask it to act — enroll you, file feedback or a complaint, mark
        notifications read, reschedule a session, or design a course from a topic. For
        personalised performance advice, use AI Coach.
      </p>
      <div className="mt-6 max-w-xl">
        <ChatbotPanel />
      </div>
    </div>
  );
}
