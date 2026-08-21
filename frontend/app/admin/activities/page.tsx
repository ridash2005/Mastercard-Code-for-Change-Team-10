"use client";

import Link from "next/link";
import { ActivityCard } from "@/components/cards";
import { SearchBar } from "@/components/activities/filters";
import { usePlatform } from "@/lib/data/platform-store";
import { useState } from "react";

export default function AdminActivities() {
  const activities = usePlatform((s) => s.activities);
  const [q, setQ] = useState("");
  const list = activities.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-3xl">Activities</h1>
        <Link href="/admin/activities/create" className="rounded-md bg-forest px-3 py-2 text-sm text-white">
          Create
        </Link>
      </div>
      <div className="mt-4 max-w-md">
        <SearchBar value={q} onChange={setQ} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <ActivityCard key={a.id} activity={a} href="/admin/submissions" />
        ))}
      </div>
    </div>
  );
}
