"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { canListen, listen, type RecognitionHandle } from "@/lib/voice/speech";
import { cn } from "@/lib/utils";

export function VoiceMicButton({
  onTranscript,
  className,
}: {
  onTranscript: (text: string) => void;
  className?: string;
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handle = useRef<RecognitionHandle | null>(null);

  useEffect(() => {
    return () => handle.current?.stop();
  }, []);

  const toggle = () => {
    if (listening) {
      handle.current?.stop();
      handle.current = null;
      setListening(false);
      return;
    }
    if (!canListen()) {
      setError("Voice input is unavailable in this browser. You can still type.");
      return;
    }
    setError(null);
    const rec = listen(
      (text) => {
        onTranscript(text);
        setListening(false);
        handle.current = null;
      },
      (msg) => {
        setError(msg);
        setListening(false);
        handle.current = null;
      },
    );
    if (!rec) return;
    handle.current = rec;
    setListening(true);
  };

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice search" : "Search with voice"}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-purple transition hover:bg-ivory",
          listening && "border-barbie bg-barbie text-white",
        )}
      >
        {listening ? <Square className="h-3.5 w-3.5" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
      </button>
      {listening ? <span className="text-xs font-medium text-barbie">Listening…</span> : null}
      {error ? <span className="text-xs text-muted">{error}</span> : null}
    </span>
  );
}
