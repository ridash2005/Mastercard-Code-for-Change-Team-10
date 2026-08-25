"use client";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { InterestPicker } from "@/components/onboarding/interest-picker";
import { normalizeInterestIds } from "@/lib/data/interests";
import { usePlatform } from "@/lib/data/platform-store";
import { api } from "@/lib/services/api";
import { levelFromXp } from "@/lib/utils";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

export default function ProfilePage() {
  const store = usePlatform();
  const { t } = useI18n();
  const sid = store.sessionUserId ?? "";
  const user = store.users.find((u) => u.id === sid);
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const team = store.teams.find((t) => t.id === profile?.teamId);
  const lvl = levelFromXp(profile?.xp ?? 0);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [skills, setSkills] = useState(profile?.skills.join(", ") ?? "");
  const [interests, setInterests] = useState(() => normalizeInterestIds(profile?.interests ?? []));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="k-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-plum text-white">{user?.avatar}</div>
          <div>
            <h1 className="font-serif text-2xl">{user?.name}</h1>
            <p className="text-sm text-muted">{user?.programme}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>{t.totalXp} <strong>{profile?.xp}</strong></div>
          <div>{t.level} <strong>{lvl.level}</strong></div>
          <div>{t.streak} <strong>{profile?.streak}</strong></div>
          <div>{t.teamLabel} <strong>{team?.name}</strong></div>
        </dl>
        <div className="mt-4">
          <p className="text-sm font-medium text-plum">{t.certificatesLabel}</p>
          {(() => {
            const mine = store.certificates.filter((c) => c.studentId === sid);
            if (!mine.length) return <p className="mt-1 text-sm text-muted">{t.noneYet}</p>;
            return (
              <ul className="mt-2 space-y-1.5">
                {mine.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-ivory/50 px-3 py-2">
                    <span className="text-sm text-plum">{c.title}</span>
                    <a
                      href={api.certificates.downloadUrl(c.id)}
                      download
                      className="inline-flex items-center justify-center rounded-full bg-barbie px-3 py-1 text-xs font-semibold text-white hover:bg-moss"
                    >
                      {t.downloadPdf}
                    </a>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
        <p className="mt-3 text-sm">
          {t.completedCoursesLabel}: {profile?.completedCourseIds.length}
        </p>
      </div>
      <form
        className="space-y-3 k-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length < 3 || skills.trim().length < 3) return;
          store.updateProfile(sid, {
            name,
            skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
            interests,
          });
          setSaved(true);
        }}
      >
        <h2 className="font-serif text-xl">{t.editProfileHeading}</h2>
        <div>
          <Label htmlFor="name">{t.nameLabel}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={3} required />
        </div>
        <div>
          <Label htmlFor="skills">{t.skillsLabel}</Label>
          <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} required />
        </div>
        <div>
          <Label id="interests-label">{t.interestsLabel}</Label>
          <p className="mb-2 text-xs text-muted">{t.interestsHint}</p>
          <InterestPicker selected={interests} onChange={setInterests} labelledBy="interests-label" />
        </div>
        <Button type="submit">{t.save}</Button>
        {saved ? <SuccessState title={t.profileUpdated} /> : null}
      </form>
    </div>
  );
}
