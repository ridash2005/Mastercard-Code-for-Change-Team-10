"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StatusBadge, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import type { ComplaintPriority } from "@/lib/types";

export default function ComplaintPublicPage() {
  const store = usePlatform();
  const [ok, setOk] = useState(false);
  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-3xl">Complaint</h1>
        <p className="mt-2 text-sm text-stone-600">Tracked tickets. Not for emergencies — use Emergency Help.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            store.addComplaint({
              userId: store.sessionUserId ?? "public",
              category: String(fd.get("category")),
              subject: String(fd.get("subject")),
              description: String(fd.get("description")),
              priority: String(fd.get("priority")) as ComplaintPriority,
              attachmentName: String(fd.get("file") || "") || undefined,
            });
            setOk(true);
          }}
        >
          <div>
            <Label>Category</Label>
            <Select name="category">
              <option>Session access</option>
              <option>Grading</option>
              <option>Conduct</option>
              <option>Technical</option>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Input name="subject" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" required rows={4} />
          </div>
          <div>
            <Label>Priority</Label>
            <Select name="priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div>
            <Label>Attachment</Label>
            <Input name="file" type="file" />
          </div>
          <Button type="submit">File complaint</Button>
          {ok ? <SuccessState title="Complaint filed with status Submitted." /> : null}
        </form>
        <ul className="mt-8 space-y-2 text-sm">
          {store.complaints.map((c) => (
            <li key={c.id} className="flex justify-between rounded-lg border bg-white p-3">
              <span>{c.subject}</span>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
