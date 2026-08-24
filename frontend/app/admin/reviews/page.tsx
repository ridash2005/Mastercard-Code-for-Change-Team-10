"use client";

import { useMemo, useState } from "react";
import { SearchBar } from "@/components/activities/filters";
import { Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { usePlatform } from "@/lib/data/platform-store";
import { formatDate } from "@/lib/utils";

export default function ReviewsPage() {
  const store = usePlatform();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(store.feedbackRecords.map((f) => f.category))], [store.feedbackRecords]);
  const list = store.feedbackRecords.filter((f) => {
    const name = store.users.find((u) => u.id === f.userId)?.name ?? "";
    if (q && !`${name} ${f.message} ${f.category}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (category !== "all" && f.category !== category) return false;
    return true;
  });
  const selected = store.feedbackRecords.find((f) => f.id === openId);

  return (
    <div>
      <h1 className="font-serif text-3xl">Student Reviews</h1>
      <p className="mt-1 text-sm text-muted">Reviews are student feedback records already stored on the platform.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="w-full max-w-sm">
          <SearchBar value={q} onChange={setQ} />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {list.map((f) => (
          <li key={f.id}>
            <button type="button" className="w-full px-4 py-3 text-left hover:bg-ivory" onClick={() => setOpenId(f.id)}>
              <p className="font-medium text-plum">{store.users.find((u) => u.id === f.userId)?.name}</p>
              <p className="text-sm text-muted">
                {f.category} · {f.rating}/5 · {formatDate(f.createdAt)}
                {f.activityId ? ` · ${store.activities.find((a) => a.id === f.activityId)?.title ?? ""}` : ""}
              </p>
              <p className="mt-1 line-clamp-2 text-sm">{f.message}</p>
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={Boolean(selected)} title="Review" onClose={() => setOpenId(null)}>
        {selected ? (
          <div className="space-y-2 text-sm">
            <p>{store.users.find((u) => u.id === selected.userId)?.name}</p>
            <p className="text-muted">
              {selected.category} · {selected.rating}/5 · {formatDate(selected.createdAt)}
            </p>
            {selected.activityId ? <p>Activity: {store.activities.find((a) => a.id === selected.activityId)?.title}</p> : null}
            <p>{selected.message}</p>
            <p className="text-muted">Status: submitted</p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
