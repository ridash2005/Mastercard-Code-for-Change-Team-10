"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StatusBadge, SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import type { ComplaintPriority } from "@/lib/types";

export default function StudentComplaints() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const [ok, setOk] = useState(false);
  return (
    <div>
      <h1 className="font-serif text-3xl">Complaints</h1>
      <form
        className="mt-6 max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          store.addComplaint({
            userId: sid,
            category: String(fd.get("category")),
            subject: String(fd.get("subject")),
            description: String(fd.get("description")),
            priority: String(fd.get("priority")) as ComplaintPriority,
            attachmentName: "note.pdf",
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
          </Select>
        </div>
        <div>
          <Label>Subject</Label>
          <Input name="subject" required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" required />
        </div>
        <div>
          <Label>Priority</Label>
          <Select name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <Button type="submit">Submit</Button>
        {ok ? <SuccessState title="Filed as Submitted." /> : null}
      </form>
      <ul className="mt-8 space-y-2">
        {store.complaints
          .filter((c) => c.userId === sid)
          .map((c) => (
            <li key={c.id} className="flex justify-between rounded-xl border bg-white p-3 text-sm">
              {c.subject} <StatusBadge status={c.status} />
            </li>
          ))}
      </ul>
    </div>
  );
}
