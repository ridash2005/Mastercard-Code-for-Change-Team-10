"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { complementaryPair, skillBuckets, suggestPairs } from "@/lib/admin/matching";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatT } from "@/lib/i18n/format";

export default function MatchingPage() {
  const store = usePlatform();
  const { t } = useI18n();
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
      ? formatT(t.complementsRationale, {
          a: store.users.find((u) => u.id === chosen[0].userId)?.name ?? "",
          askills: chosen[0].skills.join(", "),
          b: store.users.find((u) => u.id === chosen[1].userId)?.name ?? "",
          bskills: chosen[1].skills.join(", "),
          label: pair.label,
        })
      : chosen.length >= 2
        ? t.noComplementaryMapping
        : t.selectTwoOrMore;

  return (
    <div>
      <h1 className="font-serif text-3xl">{t.collaboratorMatchingTitle}</h1>
      <p className="mt-1 text-sm text-muted">{t.matchingSubtitle}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl">{t.availableStudentsHeading}</h2>
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
                    <p className="text-sm text-muted">{t.strengthsLabel}: {p.skills.join(" · ") || t.noneRecorded}</p>
                    <p className="text-xs text-purple">{skillBuckets(p.skills).join(" · ") || t.noMappedBucket}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="k-card p-5">
          <h2 className="font-serif text-xl">{t.createCollaborationHeading}</h2>
          {pair ? <p className="mt-2 text-sm font-medium text-blue">{t.suggestedCompatibilityLabel}: {pair.label}</p> : null}
          <p className="mt-2 text-sm text-muted">{rationale}</p>
          <div className="mt-3">
            <Label>{t.projectNameLabel}</Label>
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
            {t.createCollaborationHeading}
          </Button>
          <h3 className="mt-6 text-sm font-semibold text-plum">{t.suggestedPairsHeading}</h3>
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
