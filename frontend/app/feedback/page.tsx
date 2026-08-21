"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

export default function FeedbackPublicPage() {
  const add = usePlatform((s) => s.addFeedback);
  const sid = usePlatform((s) => s.sessionUserId) ?? "public";
  const [ok, setOk] = useState(false);
  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-3xl">Feedback</h1>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            add({
              userId: sid,
              category: String(fd.get("category")),
              rating: Number(fd.get("rating")),
              message: String(fd.get("message")),
            });
            setOk(true);
          }}
        >
          <div>
            <Label>Category</Label>
            <Select name="category">
              <option>Learning design</option>
              <option>Platform</option>
              <option>Mentoring</option>
              <option>Other</option>
            </Select>
          </div>
          <div>
            <Label>Rating</Label>
            <Input name="rating" type="number" min={1} max={5} defaultValue={5} required />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea name="message" required rows={4} />
          </div>
          <Button type="submit">Submit feedback</Button>
          {ok ? <SuccessState title="Thank you. Programme design will see this in the demo store." /> : null}
        </form>
      </div>
    </PublicShell>
  );
}
