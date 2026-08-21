"use client";

import { usePlatform } from "@/lib/data/platform-store";

export default function AdminNotifications() {
  const store = usePlatform();
  const items = store.notifications.filter((n) => n.audience === "admin");
  return (
    <div>
      <h1 className="font-serif text-3xl">Admin notifications</h1>
      <ul className="mt-6 space-y-3">
        {items.map((n) => (
          <li key={n.id} className="rounded-xl border bg-white p-4">
            <button className="w-full text-left text-sm" onClick={() => store.markNotificationRead(n.id)}>
              <p className="font-medium">{n.title}</p>
              <p className="text-stone-600">{n.body}</p>
              <p className="mt-1 text-xs uppercase text-stone-400">{n.kind}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
