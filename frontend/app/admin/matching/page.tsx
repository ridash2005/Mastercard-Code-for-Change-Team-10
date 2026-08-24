"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { complementaryPair, skillBuckets, suggestPairs } from "@/lib/admin/matching";
import { usePlatform } from "@/lib/data/platform-store";

export default function MatchingPage() {
  const store = usePlatform();
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("Inclusion Wallet pairing");
  const suggestions = useMemo(() => suggestPairs(store.studentProfiles), [store.studentProfiles]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const chosen = selected
    .map((id) => store.studentProfiles.find((p) => p.userId === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const pair =
    chosen.length === 2 && chosen[0] && chosen[1] ? complementaryPair(chosen[0], chosen[1]) : null;
  const rationale =
    pair && chosen[0] && chosen[1]
      ? `${store.users.find((u) => u.id === chosen[0].userId)?.name} (${chosen[0].skills.join(", ")}) complements ${store.users.find((u) => u.id === chosen[1].userId)?.name} (${chosen[1].skills.join(", ")}) — ${pair.label}.`
      : chosen.length >= 2
        ? "Selected students do not map to complementary skill buckets from the recorded skills."
        : "Select two or more students.";

  return (
    <div>
      <h1 className="font-serif text-3xl">Collaborator Matching</h1>
      <p className="mt-1 text-sm text-muted">
        Matches use recorded student skills only. Students see a generic request until they accept.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl">Available students</h2>
          <ul className="mt-3 space-y-2">
            {store.studentProfiles.map((p) => {
              const u = store.users.find((x) => x.id === p.userId);
              const on = selected.includes(p.userId);
              return (
                <li key={p.userId}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.userId)}
                    className={`w-full rounded-xl border px-4 py-3 text-left ${on ? "border-barbie bg-ivory" : "border-line bg-card"}`}
                  >
                    <p className="font-medium text-plum">{u?.name}</p>
                    <p className="text-sm text-muted">Strengths: {p.skills.join(" · ") || "None recorded"}</p>
                    <p className="text-xs text-purple">{skillBuckets(p.skills).join(" · ") || "No mapped bucket"}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="k-card p-5">
          <h2 className="font-serif text-xl">Create collaboration</h2>
          {pair ? <p className="mt-2 text-sm font-medium text-blue">Suggested compatibility: {pair.label}</p> : null}
          <p className="mt-2 text-sm text-muted">{rationale}</p>
          <div className="mt-3">
            <Label>Project name</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Button
            className="mt-4"
            type="button"
            disabled={selected.length < 2 || !title.trim()}
            onClick={() => {
              store.createCollaboration({ studentIds: selected, projectTitle: title.trim(), adminRationale: rationale });
              setSelected([]);
            }}
          >
            Create collaboration
          </Button>
          <h3 className="mt-6 text-sm font-semibold text-plum">Suggested pairs</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {suggestions.map((s) => (
              <li key={`${s.a}-${s.b}`}>
                {store.users.find((u) => u.id === s.a)?.name} · {store.users.find((u) => u.id === s.b)?.name} — {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
