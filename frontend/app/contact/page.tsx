"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function ContactPage() {
  const add = usePlatform((s) => s.addContact);
  const { t } = useI18n();
  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
  ];
  const [ok, setOk] = useState(false);
  return (
    <PublicShell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
        <div>
          <h1 className="font-serif text-3xl">{t.publicContactTitle}</h1>
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
              <Label>{t.nameLabel}</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>{t.emailLabel}</Label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <Label>{t.categoryLabel}</Label>
              <Select name="category">
                <option value="Programme access">{t.contactCategoryProgrammeAccess}</option>
                <option value="Technical">{t.contactCategoryTechnical}</option>
                <option value="Mentoring">{t.mentoring}</option>
                <option value="Certificates">{t.certificatesLabel}</option>
              </Select>
            </div>
            <div>
              <Label>{t.messageLabel}</Label>
              <Textarea name="message" required rows={4} />
            </div>
            <Button type="submit">{t.send}</Button>
            {ok ? <SuccessState title={t.messageSentToStaff} /> : null}
          </form>
        </div>
        <div>
          <h2 className="font-serif text-2xl">{t.faqHeading}</h2>
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
