export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

type Rec = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: { 0?: { 0?: { transcript?: string } } } }) => void) | null;
  onerror: (() => void) | null;
};

export function canListen() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export type RecognitionHandle = { stop: () => void };

export function listen(onResult: (text: string) => void, onError: (msg: string) => void): RecognitionHandle | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    onError("Voice input is not available in this browser. You can still type.");
    return null;
  }
  const rec = new Ctor();
  rec.lang = "en-IN";
  rec.interimResults = false;
  rec.onresult = (e) => {
    onResult(e.results[0]?.[0]?.transcript ?? "");
  };
  rec.onerror = () => onError("Microphone was blocked or unavailable. Typing still works.");
  try {
    rec.start();
  } catch {
    onError("Could not start voice input.");
    return null;
  }
  return { stop: () => rec.stop() };
}
