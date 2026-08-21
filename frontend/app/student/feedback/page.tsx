"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

export default function StudentFeedback() {
  const store = usePlatform();
  const [ok, setOk] = useState(false);
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">Feedback</h1>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          store.addFeedback({
            userId: store.sessionUserId ?? "",
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
          </Select>
        </div>
        <div>
          <Label>Rating 1–5</Label>
          <Input name="rating" type="number" min={1} max={5} defaultValue={4} />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea name="message" required rows={4} />
        </div>
        <Button type="submit">Send</Button>
        {ok ? <SuccessState title="Feedback saved." /> : null}
      </form>
    </div>
  );
}
