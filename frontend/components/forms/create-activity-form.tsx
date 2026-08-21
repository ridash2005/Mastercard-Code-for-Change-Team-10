"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SuccessState } from "@/components/states";
import { usePlatform } from "@/lib/data/platform-store";
import { useState } from "react";
import type { ActivityType, Difficulty, Domain, Participation, ProblemDomain, Requirement } from "@/lib/types";

const schema = z.object({
  title: z.string().min(4),
  description: z.string().min(12),
  type: z.enum(["course", "training", "mentoring", "project", "assignment", "milestone"]),
  domain: z.string().min(2),
  problemDomain: z.string().min(2),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  xpReward: z.coerce.number().min(10).max(800),
  requirement: z.enum(["mandatory", "optional"]),
  certificate: z.enum(["yes", "no"]),
  participation: z.enum(["individual", "team"]),
  startDate: z.string().min(4),
  dueDate: z.string().min(4),
  durationHours: z.coerce.number().min(0.5).max(80),
  instructions: z.string().min(8),
  attachmentName: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function CreateActivityForm() {
  const create = usePlatform((s) => s.createActivity);
  const [id, setId] = useState<string | null>(null);
  const form = useForm<Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "assignment",
      domain: "Software Engineering",
      problemDomain: "Campus Employability",
      difficulty: "beginner",
      xpReward: 80,
      requirement: "optional",
      certificate: "no",
      participation: "individual",
      startDate: "2026-08-22",
      dueDate: "2026-09-05",
      durationHours: 4,
      instructions: "",
      attachmentName: "",
    },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={form.handleSubmit((values) => {
        const created = create({
          title: values.title,
          description: values.description,
          type: values.type as ActivityType,
          domain: values.domain as Domain,
          problemDomain: values.problemDomain as ProblemDomain,
          category: values.type,
          difficulty: values.difficulty as Difficulty,
          xpReward: values.xpReward,
          startDate: values.startDate,
          dueDate: values.dueDate,
          durationHours: values.durationHours,
          requirement: values.requirement as Requirement,
          certificate: values.certificate === "yes",
          participation: values.participation as Participation,
          attachments: values.attachmentName ? [{ name: values.attachmentName, url: "#" }] : [],
          instructions: values.instructions,
        });
        setId(created);
        form.reset();
      })}
    >
      <Field label="Title" error={form.formState.errors.title?.message}>
        <Input {...form.register("title")} />
      </Field>
      <Field label="Activity type">
        <Select {...form.register("type")}>
          {["course", "training", "mentoring", "project", "assignment", "milestone"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Description" error={form.formState.errors.description?.message}>
          <Textarea rows={3} {...form.register("description")} />
        </Field>
      </div>
      <Field label="Domain">
        <Select {...form.register("domain")}>
          {["Software Engineering", "Data & AI", "Product", "Payments & Trust", "Communication", "Leadership"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </Field>
      <Field label="Problem-based domain">
        <Select {...form.register("problemDomain")}>
          {[
            "Financial Inclusion",
            "Digital Payments",
            "Cybersecurity",
            "Women in STEM",
            "Campus Employability",
            "Climate & Cities",
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </Field>
      <Field label="Difficulty">
        <Select {...form.register("difficulty")}>
          <option>beginner</option>
          <option>intermediate</option>
          <option>advanced</option>
        </Select>
      </Field>
      <Field label="XP" error={form.formState.errors.xpReward?.message}>
        <Input type="number" {...form.register("xpReward")} />
      </Field>
      <Field label="Mandatory / optional">
        <Select {...form.register("requirement")}>
          <option>mandatory</option>
          <option>optional</option>
        </Select>
      </Field>
      <Field label="Certificate">
        <Select {...form.register("certificate")}>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </Select>
      </Field>
      <Field label="Participation">
        <Select {...form.register("participation")}>
          <option>individual</option>
          <option>team</option>
        </Select>
      </Field>
      <Field label="Start date">
        <Input type="date" {...form.register("startDate")} />
      </Field>
      <Field label="Due date">
        <Input type="date" {...form.register("dueDate")} />
      </Field>
      <Field label="Duration (hours)">
        <Input type="number" step="0.5" {...form.register("durationHours")} />
      </Field>
      <Field label="Attachment name (UI only)">
        <Input {...form.register("attachmentName")} placeholder="Brief.pdf" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Instructions" error={form.formState.errors.instructions?.message}>
          <Textarea rows={4} {...form.register("instructions")} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Button type="submit">Publish activity</Button>
        {id ? <div className="mt-3"><SuccessState title={`Created ${id}. Students will see it on Explore.`} /></div> : null}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
