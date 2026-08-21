"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlatform } from "@/lib/data/platform-store";
import { Button } from "@/components/ui/button";

export function NotificationPanel({ audience, userId }: { audience: "student" | "admin"; userId: string | null }) {
  const store = usePlatform();
  const [open, setOpen] = useState(false);
  const items = useMemo(
    () =>
      store.notifications.filter((n) => n.audience === audience && (!n.userId || n.userId === userId)).slice(0, 8),
    [store.notifications, audience, userId],
  );
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <Button variant="outline" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Alerts{unread ? ` (${unread})` : ""}
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-medium">Notifications</p>
          <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto text-sm">
            {items.map((n) => (
              <li key={n.id}>
                <button className="w-full text-left" onClick={() => store.markNotificationRead(n.id)}>
                  <span className="font-medium">{n.title}</span>
                  <span className="block text-xs text-stone-500">{n.body}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link
            href={audience === "student" ? "/student/notifications" : "/admin/notifications"}
            className="mt-2 inline-block text-xs underline"
          >
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
