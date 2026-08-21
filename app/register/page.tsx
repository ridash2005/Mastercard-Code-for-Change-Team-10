"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { extractFromDocument } from "@/lib/ocr/service";
import { usePlatform } from "@/lib/data/platform-store";
import { ErrorState, LoadingState, SuccessState } from "@/components/states";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const register = usePlatform((s) => s.register);
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [ocr, setOcr] = useState<"idle" | "processing" | "ready">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [programme, setProgramme] = useState("Katalyst Fellows 2026");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-3xl">Register</h1>
        <p className="mt-2 text-sm text-stone-600">
          Role first, then optional OCR on an ID or offer letter. Review extracted fields before you continue. Passwords
          are never stored.
        </p>
        <div className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="student">Student</option>
              <option value="admin">Admin / management</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="doc">Document (mock OCR)</Label>
            <Input
              id="doc"
              type="file"
              accept="image/*,.pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setOcr("processing");
                const data = await extractFromDocument(file);
                setName(data.name);
                setEmail(data.email);
                setCollege(data.college);
                setProgramme(data.programme);
                setOcr("ready");
                setVerified(false);
              }}
            />
            {ocr === "processing" ? <div className="mt-2"><LoadingState title="Reading document…" /></div> : null}
            {ocr === "ready" ? <p className="mt-2 text-xs text-stone-500">Extracted. Edit anything that looks wrong.</p> : null}
          </div>
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="College" value={college} onChange={setCollege} />
          <Field label="Programme" value={programme} onChange={setProgramme} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            I have verified the details above
          </label>
          <Button
            disabled={!verified}
            onClick={() => {
              const res = register({ name, email, college, programme, role });
              if (!res.ok) {
                setError(res.error ?? "Could not register");
                return;
              }
              setOk(true);
              router.push(role === "admin" ? "/admin" : "/student");
            }}
          >
            Create account
          </Button>
          {error ? <ErrorState title={error} /> : null}
          {ok ? <SuccessState title="Welcome to Katalyst." /> : null}
        </div>
      </div>
    </PublicShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => setValue(onChange, e.target.value)} required />
    </div>
  );
}

function setValue(fn: (v: string) => void, v: string) {
  fn(v);
}
