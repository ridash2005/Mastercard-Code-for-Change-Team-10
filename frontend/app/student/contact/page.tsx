"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

export default function StudentContact() {
  const add = usePlatform((s) => s.addContact);
  const [ok, setOk] = useState(false);
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">Contact support</h1>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          add(String(fd.get("name")), String(fd.get("email")), String(fd.get("category")), String(fd.get("message")));
          setOk(true);
        }}
      >
        <div>
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <Label>Category</Label>
          <Select name="category">
            <option>Access</option>
            <option>Certificates</option>
            <option>Mentoring</option>
          </Select>
        </div>
        <div>
          <Label>Message</Label>
          <Textarea name="message" required />
        </div>
        <Button type="submit">Send</Button>
        {ok ? <SuccessState title="Support will see this in admin notifications." /> : null}
      </form>
    </div>
  );
}
