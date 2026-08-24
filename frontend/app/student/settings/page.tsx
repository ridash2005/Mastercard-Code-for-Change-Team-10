"use client";

import { Button } from "@/components/ui/button";
import { SuccessState } from "@/components/states";
import { InterestPicker } from "@/components/onboarding/interest-picker";
import { normalizeInterestIds } from "@/lib/data/interests";
import { usePlatform } from "@/lib/data/platform-store";
import { useState } from "react";

const DEFAULT_PREFS = { emailNotificationsEnabled: true, courseRecommendationEmails: true, meetingUpdateEmails: true };

export default function SettingsPage() {
  const store = usePlatform();
  const sid = store.sessionUserId ?? "";
  const profile = store.studentProfiles.find((p) => p.userId === sid);
  const [ok, setOk] = useState(false);
  const [interests, setInterests] = useState(() => normalizeInterestIds(profile?.interests ?? []));
  const [prefs, setPrefs] = useState(() => profile?.notificationPreferences ?? DEFAULT_PREFS);

  return (
    <div>
      <h1 className="font-serif text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted">Language lives in the top bar. Auth is real (backend/api, JWT).</p>
      <form
        className="mt-6 max-w-3xl space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (profile) store.updateProfile(sid, { interests, notificationPreferences: prefs });
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
        <fieldset className="space-y-2">
          <legend className="font-serif text-xl text-plum">Email notifications</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.emailNotificationsEnabled}
              onChange={(e) => setPrefs((p) => ({ ...p, emailNotificationsEnabled: e.target.checked }))}
            />
            Email notifications enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.courseRecommendationEmails}
              onChange={(e) => setPrefs((p) => ({ ...p, courseRecommendationEmails: e.target.checked }))}
            />
            Course recommendation emails
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.meetingUpdateEmails}
              onChange={(e) => setPrefs((p) => ({ ...p, meetingUpdateEmails: e.target.checked }))}
            />
            Meeting/session update emails
          </label>
        </fieldset>
        <Button type="submit">Save preferences</Button>
        {ok ? <SuccessState title="Preferences saved to your profile." /> : null}
      </form>
    </div>
  );
}
