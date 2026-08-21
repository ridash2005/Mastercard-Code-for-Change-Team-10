import { PublicShell } from "@/components/layout/public-shell";

export default function EmergencyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-xs uppercase tracking-wide text-red-800">Emergency — not a programme ticket</p>
          <h1 className="mt-2 font-serif text-3xl text-red-950">If you are in danger, call local emergency services first</h1>
          <p className="mt-3 text-sm text-red-900">
            Katalyst staff cannot replace police, medical, or campus security. Use the numbers below. Programme complaints
            and feedback forms are the wrong place for this.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-md bg-red-800 px-4 py-2 text-sm text-white" href="tel:112">
              Call 112
            </a>
            <a className="rounded-md border border-red-800 px-4 py-2 text-sm" href="tel:112">
              Campus security
            </a>
            <a className="rounded-md border border-red-800 px-4 py-2 text-sm" href="mailto:wellbeing@katalyst.edu">
              Wellbeing desk
            </a>
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
          <h2 className="font-serif text-xl text-stone-900">After you are safe</h2>
          <p className="mt-2">
            You may optionally notify a programme manager. That is administrative follow-up, not emergency response.
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
