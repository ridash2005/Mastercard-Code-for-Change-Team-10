export default function StudentEmergency() {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-xs uppercase tracking-wide text-red-800">Separated from complaints</p>
      <h1 className="mt-2 font-serif text-3xl">Emergency help</h1>
      <p className="mt-3 text-sm">If you are unsafe, call 112 first. Katalyst is not emergency services.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a className="rounded-md bg-red-800 px-4 py-2 text-sm text-white" href="tel:112">
          Call 112
        </a>
        <a className="rounded-md border border-red-800 px-4 py-2 text-sm" href="mailto:wellbeing@katalyst.edu">
          Wellbeing desk
        </a>
      </div>
    </div>
  );
}
