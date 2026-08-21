"use client";

import { Button } from "@/components/ui/button";
import { SuccessState } from "@/components/states";
import { useState } from "react";

export default function SettingsPage() {
  const [ok, setOk] = useState(false);
  return (
    <div>
      <h1 className="font-serif text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-stone-600">Language lives in the top bar. Auth remains mock until Auth.js is wired.</p>
      <form
        className="mt-6 max-w-md space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setOk(true);
        }}
      >
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
