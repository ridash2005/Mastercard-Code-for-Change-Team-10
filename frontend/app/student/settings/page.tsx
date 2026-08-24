"use client";

import { Button } from "@/components/ui/button";
import { SuccessState } from "@/components/states";
import { InterestPicker } from "@/components/onboarding/interest-picker";
import { normalizeInterestIds } from "@/lib/data/interests";
import { usePlatform } from "@/lib/data/platform-store";
import { useState } from "react";

export default function SettingsPage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const [ok, setOk] = useState(false);
  const [interests, setInterests] = useState(() => normalizeInterestIds(profile?.interests ?? []));

  return (
    <div>
      <h1 className="font-serif text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted">Language lives in the top bar. Auth remains mock until Auth.js is wired.</p>
      <form
        className="mt-6 max-w-3xl space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (profile) store.updateProfile(sid, { interests });
          setOk(true);
        }}
      >
        {profile ? (
          <fieldset>
            <legend id="settings-interests" className="font-serif text-xl text-plum">
              Learning interests
            </legend>
            <p className="mt-1 mb-3 text-sm text-muted">You can change these any time. They personalize recommendations later.</p>
            <InterestPicker selected={interests} onChange={setInterests} labelledBy="settings-interests" />
          </fieldset>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Email reminders for deadlines
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Streak warnings
        </label>
        <Button type="submit">Save preferences</Button>
        {ok ? <SuccessState title="Preferences saved on this device." /> : null}
      </form>
    </div>
  );
}
