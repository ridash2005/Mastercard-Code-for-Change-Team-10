"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { canListen, canSpeak, listen, speak, stopSpeak } from "@/lib/voice/speech";

export function VoiceAssist({ textToRead, onTranscript }: { textToRead?: string; onTranscript?: (t: string) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (!canSpeak()) {
            setMsg("Text-to-speech is not supported here.");
            return;
          }
          speak(textToRead || document.querySelector("main")?.innerText.slice(0, 400) || "Katalyst");
        }}
      >
        Listen
      </Button>
      <Button type="button" variant="ghost" onClick={stopSpeak}>
        Stop
      </Button>
      {onTranscript ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!canListen()) {
              setMsg("Voice input is unavailable. Type instead — no microphone required for the rest of the app.");
              return;
            }
            listen(
              (t) => {
                onTranscript(t);
                setMsg(null);
              },
              (e) => setMsg(e),
            );
          }}
        >
          Voice input
        </Button>
      ) : null}
      {msg ? <p className="text-xs text-muted">{msg}</p> : null}
    </div>
  );
}
