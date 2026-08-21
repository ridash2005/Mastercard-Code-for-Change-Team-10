"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";

const faqs = [
  { q: "How do I enrol?", a: "Open Explore, pick an activity, press Enrol. Mandatory items also appear on My Learning." },
  { q: "Who awards XP?", a: "Faculty approval of a submission. The mock ledger updates immediately in this demo." },
  { q: "Where is emergency help?", a: "Use Emergency Help — not the complaint form — for safety or wellbeing crises." },
];

export default function ContactPage() {
  const add = usePlatform((s) => s.addContact);
  const [ok, setOk] = useState(false);
  return (
    <PublicShell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
        <div>
          <h1 className="font-serif text-3xl">Contact</h1>
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
                <option>Programme access</option>
                <option>Technical</option>
                <option>Mentoring</option>
                <option>Certificates</option>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea name="message" required rows={4} />
            </div>
            <Button type="submit">Send</Button>
            {ok ? <SuccessState title="Message recorded for programme staff (demo)." /> : null}
          </form>
        </div>
        <div>
          <h2 className="font-serif text-2xl">FAQ</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1 text-stone-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </PublicShell>
  );
}
