"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "html" | "css" | "js";

const DEFAULT_HTML = `<h1>Hello, Katalyst!</h1>\n<button id="btn">Click me</button>`;
const DEFAULT_CSS = `body { font-family: sans-serif; padding: 1.5rem; }\nh1 { color: #d6336c; }\nbutton { padding: .5rem 1rem; border-radius: 8px; border: none; background: #6741d9; color: white; cursor: pointer; }`;
const DEFAULT_JS = `document.getElementById("btn").addEventListener("click", () => {\n  alert("Nice - the playground runs real JS.");\n});`;

/** Builds the sandboxed document srcDoc. Console output is forwarded to the
 * parent via postMessage since the iframe has no devtools of its own. */
function buildDoc(html: string, css: string, js: string) {
  return `<!doctype html><html><head><style>${css}</style></head><body>${html}
<script>
  const send = (level, args) => parent.postMessage({ source: "katalyst-playground", level, args: args.map(String) }, "*");
  ["log", "warn", "error"].forEach((level) => {
    const orig = console[level].bind(console);
    console[level] = (...args) => { send(level, args); orig(...args); };
  });
  window.addEventListener("error", (e) => send("error", [e.message]));
  try {
    ${js}
  } catch (err) {
    send("error", [String(err && err.message || err)]);
  }
</script>
</body></html>`;
}

export function CodePlayground({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("html");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [doc, setDoc] = useState(() => buildDoc(DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS));
  const [logs, setLogs] = useState<{ level: string; text: string }[]>([]);
  const [frameKey, setFrameKey] = useState(0);

  // One persistent listener for the panel's lifetime - the iframe is
  // remounted (via frameKey) on every run rather than reused, so there's
  // never more than one live sandboxed document posting messages at a time.
  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.data?.source !== "katalyst-playground") return;
      setLogs((l) => [...l, { level: event.data.level, text: event.data.args.join(" ") }]);
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  function run() {
    setLogs([]);
    setDoc(buildDoc(html, css, js));
    setFrameKey((k) => k + 1);
  }

  const value = tab === "html" ? html : tab === "css" ? css : js;
  const setValue = tab === "html" ? setHtml : tab === "css" ? setCss : setJs;

  return (
    <div className={compact ? "flex h-72 flex-col overflow-hidden rounded-lg border border-line" : "flex h-[32rem] flex-col overflow-hidden rounded-xl border border-line"}>
      <div className="flex items-center justify-between border-b border-line bg-ivory px-2 py-1.5">
        <div className="flex gap-1">
          {(["html", "css", "js"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded px-2 py-1 text-xs font-semibold uppercase ${tab === t ? "bg-barbie text-white" : "text-purple hover:bg-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button type="button" onClick={run} className="!py-1 !px-2 text-xs">
          <Play className="mr-1 inline h-3 w-3" aria-hidden />
          Run
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          className="min-h-0 resize-none border-r border-line bg-plum p-3 font-mono text-xs text-white outline-none"
        />
        <div className="flex min-h-0 flex-col">
          <iframe
            key={frameKey}
            title="Playground preview"
            srcDoc={doc}
            sandbox="allow-scripts"
            className="min-h-0 flex-1 bg-white"
          />
          <div className="max-h-20 overflow-y-auto border-t border-line bg-black p-2 font-mono text-[11px] text-lime-300">
            {logs.length === 0 ? (
              <p className="text-white/40">Console output appears here.</p>
            ) : (
              logs.map((l, i) => (
                <p key={i} className={l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-300" : ""}>
                  {l.text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
