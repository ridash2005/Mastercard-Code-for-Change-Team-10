"use client";

import { usePlatform } from "@/lib/data/platform-store";

export default function StudentNotifications() {
  const store = usePlatform();
  const sid = store.sessionUserId;
  const items = store.notifications.filter((n) => n.audience === "student" && (!n.userId || n.userId === sid));
  return (
    <div>
      <h1 className="font-serif text-3xl">Notifications</h1>
      <ul className="mt-6 space-y-3">
        {items.map((n) => (
          <li key={n.id} className="k-card p-4">
            <button className="w-full text-left" onClick={() => store.markNotificationRead(n.id)}>
              <p className="font-medium">
                {n.title} {n.read ? "" : "· unread"}
              </p>
              <p className="text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-xs uppercase text-muted">{n.kind}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
