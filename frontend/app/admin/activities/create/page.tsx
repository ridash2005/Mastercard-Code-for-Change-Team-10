import { CreateActivityForm } from "@/components/forms/create-activity-form";

export default function CreateActivityPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Create activity</h1>
      <p className="mt-1 text-sm text-stone-600">Validated with Zod. Published activities appear on student Explore immediately.</p>
      <div className="mt-6 rounded-xl border bg-white p-5">
        <CreateActivityForm />
      </div>
    </div>
  );
}
