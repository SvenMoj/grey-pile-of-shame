"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseInventoryStore } from "@/lib/inventory/supabase-store";
import { Button } from "@/components/ui/button";

type Props = {
  paintId: string;
};

/**
 * A small "Add to inventory" button embedded in catalog/brand pages.
 * Renders nothing until auth state is known; hidden when not logged in.
 */
export function AddToInventoryButton({ paintId }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = loading
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, []);

  if (authed === null || !authed) return null;

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
