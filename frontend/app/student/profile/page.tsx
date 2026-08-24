"use client";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { InterestPicker } from "@/components/onboarding/interest-picker";
import { normalizeInterestIds } from "@/lib/data/interests";
import { usePlatform } from "@/lib/data/platform-store";
import { levelFromXp } from "@/lib/utils";
import { useState } from "react";

export default function ProfilePage() {
  const store = usePlatform();
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
          <div>XP <strong>{profile?.xp}</strong></div>
          <div>Level <strong>{lvl.level}</strong></div>
          <div>Streak <strong>{profile?.streak}</strong></div>
          <div>Team <strong>{team?.name}</strong></div>
        </dl>
        <p className="mt-4 text-sm">Certificates: {store.certificates.filter((c) => c.studentId === sid).map((c) => c.title).join(", ") || "None yet"}</p>
        <p className="mt-2 text-sm">Completed courses: {profile?.completedCourseIds.length}</p>
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
        <h2 className="font-serif text-xl">Edit profile</h2>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={3} required />
        </div>
        <div>
          <Label htmlFor="skills">Skills</Label>
          <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} required />
        </div>
        <div>
          <Label id="interests-label">Interests</Label>
          <p className="mb-2 text-xs text-muted">Used for recommendations, missions and your learning path.</p>
          <InterestPicker selected={interests} onChange={setInterests} labelledBy="interests-label" />
        </div>
        <Button type="submit">Save</Button>
        {saved ? <SuccessState title="Profile updated." /> : null}
      </form>
    </div>
  );
}
