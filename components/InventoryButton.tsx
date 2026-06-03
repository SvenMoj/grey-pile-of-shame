"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseInventoryStore } from "@/lib/inventory/supabase-store";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  paintId: string;
  /** Server-computed initial ownership state. Component takes over from here. */
  initialOwned: boolean;
};

/**
 * Shows "In inventory" when owned, "+  Add" when not.
 * Flips to owned immediately on click without requiring a page reload.
 * Hidden while auth is loading or the user is signed out.
 */
export function InventoryButton({ paintId, initialOwned }: Props) {
  const { isAuthed, loading } = useAuth();
  const [owned, setOwned] = useState(initialOwned);
  const [adding, setAdding] = useState(false);

  if (loading || !isAuthed) return null;

  if (owned) {
    return <Badge variant="secondary">In inventory</Badge>;
  }

  async function handleAdd() {
    setAdding(true);
    try {
      const store = createSupabaseInventoryStore(createClient());
      await store.add({ catalog_paint_id: paintId });
      setOwned(true);
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
