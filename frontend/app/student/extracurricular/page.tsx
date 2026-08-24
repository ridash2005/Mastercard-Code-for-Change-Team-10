"use client";

import { usePlatform } from "@/lib/data/platform-store";

export default function ExtraPage() {
  const items = usePlatform((s) => s.extracurricular);
  return (
    <div>
      <h1 className="font-serif text-3xl">Extracurricular development</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((x) => (
          <article key={x.id} className="k-card p-4">
            <p className="text-xs uppercase text-muted">{x.kind.replaceAll("_", " ")}</p>
            <h2 className="mt-1 font-medium">{x.title}</h2>
            <p className="mt-1 text-sm text-muted">{x.description}</p>
            <p className="mt-2 text-xs">
              {x.date} · {x.xpReward} XP
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
