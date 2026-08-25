"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SuccessState, ErrorState } from "@/components/states";
import { api } from "@/lib/services/api";
import { useI18n } from "@/lib/i18n/provider";

export default function VolunteerPage() {
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-serif text-3xl">{t.volunteerTitle}</h1>
        <p className="mt-2 text-sm text-stone-600">{t.volunteerSubtitle}</p>
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
              setError(err instanceof Error ? err.message : t.couldNotSubmitApplication);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <Label>{t.nameLabel}</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>{t.emailLabel}</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>{t.interestsCommaSeparated}</Label>
            <Input name="interests" placeholder="Mentoring, Career Guidance" />
          </div>
          <div>
            <Label>{t.skillsCommaSeparated}</Label>
            <Input name="skills" placeholder="React, SQL" />
          </div>
          <div>
            <Label>{t.collegeOptional}</Label>
            <Input name="college" />
          </div>
          <div>
            <Label>{t.anythingElseOptional}</Label>
            <Textarea name="message" rows={3} />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? t.submitting : t.submitApplication}
          </Button>
          {error ? <ErrorState title={error} /> : null}
          {ok ? <SuccessState title={t.applicationSubmittedNotice} /> : null}
        </form>
      </div>
    </PublicShell>
  );
}
