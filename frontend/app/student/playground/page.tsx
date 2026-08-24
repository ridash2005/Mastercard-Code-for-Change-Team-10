"use client";

import { CodePlayground } from "@/components/playground/code-playground";

export default function PlaygroundPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Code Playground</h1>
      <p className="mt-1 text-sm text-muted">
        Practice HTML, CSS, and JavaScript right here. Runs entirely in your browser in a sandboxed
        frame — nothing is sent to a server. Ask the chatbot for a snippet to try, or write your own.
      </p>
      <div className="mt-6">
        <CodePlayground />
      </div>
    </div>
  );
}
