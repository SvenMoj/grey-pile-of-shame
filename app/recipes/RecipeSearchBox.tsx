"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";

export function RecipeSearchBox({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`/recipes?${params.toString()}`);
    });
  }

  return (
    <Input
      placeholder="Search by title, paint name or brand…"
      defaultValue={defaultValue}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Search recipes"
    />
  );
}
