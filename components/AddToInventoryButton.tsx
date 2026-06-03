"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseInventoryStore } from "@/lib/inventory/supabase-store";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

type Props = {
  paintId: string;
};

/**
 * A small "Add to inventory" button embedded in catalog/brand pages.
 * Auth state comes from the shared AuthProvider — no per-button effects.
 * Hidden while auth is loading or when the user is not signed in.
 */
export function AddToInventoryButton({ paintId }: Props) {
  const { isAuthed, loading } = useAuth();
  const [adding, setAdding] = useState(false);

  if (loading || !isAuthed) return null;

  async function handleAdd() {
    setAdding(true);
    try {
      const store = createSupabaseInventoryStore(createClient());
      await store.add({ catalog_paint_id: paintId });
      toast.success("Added to inventory");
    } catch {
      toast.error("Could not add to inventory");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={adding}
      onClick={handleAdd}
      aria-label="Add to inventory"
      title="Add to inventory"
    >
      <Plus className="h-3.5 w-3.5" />
    </Button>
  );
}
