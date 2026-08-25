"use client";

import { cn } from "@/lib/utils";
import { useId, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-plum", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-plum placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function FileInput({
  className,
  buttonLabel = "Choose file",
  emptyLabel = "No file chosen",
  onChange,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { buttonLabel?: string; emptyLabel?: string }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <input
        id={inputId}
        type="file"
        className="peer sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setFileName(e.target.files?.[0]?.name ?? null);
          onChange?.(e);
        }}
        {...props}
      />
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-barbie px-3.5 py-2 text-sm font-medium text-white transition hover:bg-moss peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-barbie"
      >
        {buttonLabel}
      </label>
      <span className="truncate text-sm text-muted">{fileName ?? emptyLabel}</span>
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-plum",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-plum", className)}
      {...props}
    />
  );
}
