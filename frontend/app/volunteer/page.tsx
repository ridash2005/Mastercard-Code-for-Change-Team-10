"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SuccessState, ErrorState } from "@/components/states";
import { api } from "@/lib/services/api";

export default function VolunteerPage() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-serif text-3xl">Volunteer with Katalyst</h1>
        <p className="mt-2 text-sm text-stone-600">
          Mentor a student, run a clinic, or support a programme event. Applications are reviewed by
          programme staff.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const fd = new FormData(e.currentTarget);
            const splitList = (v: FormDataEntryValue | null) =>
              String(v ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            try {
              await api.volunteerApplications.create({
                name: String(fd.get("name")),
                email: String(fd.get("email")),
                interests: splitList(fd.get("interests")),
                skills: splitList(fd.get("skills")),
                college: String(fd.get("college") ?? "") || undefined,
                message: String(fd.get("message") ?? "") || undefined,
              });
              setOk(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not submit your application.");
            } finally {
              setBusy(false);
            }
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
            <Label>Interests (comma separated)</Label>
            <Input name="interests" placeholder="Mentoring, Career Guidance" />
          </div>
          <div>
            <Label>Skills (comma separated)</Label>
            <Input name="skills" placeholder="React, SQL" />
          </div>
          <div>
            <Label>College (optional)</Label>
            <Input name="college" />
          </div>
          <div>
            <Label>Anything else? (optional)</Label>
            <Textarea name="message" rows={3} />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit application"}
          </Button>
          {error ? <ErrorState title={error} /> : null}
          {ok ? <SuccessState title="Application submitted — programme staff will review it." /> : null}
        </form>
      </div>
    </PublicShell>
  );
}
