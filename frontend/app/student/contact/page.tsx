"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useI18n } from "@/lib/i18n/provider";

export default function StudentContact() {
  const add = usePlatform((s) => s.addContact);
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">{t.contactSupportTitle}</h1>
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
            <option value="Access">{t.contactCategoryAccess}</option>
            <option value="Certificates">{t.certificatesLabel}</option>
            <option value="Mentoring">{t.mentoring}</option>
          </Select>
        </div>
        <div>
          <Label>{t.messageLabel}</Label>
          <Textarea name="message" required />
        </div>
        <Button type="submit">{t.send}</Button>
        {ok ? <SuccessState title={t.supportWillSeeNotice} /> : null}
      </form>
    </div>
  );
}
