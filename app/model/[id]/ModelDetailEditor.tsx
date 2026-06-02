"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StageStepper } from "@/components/StageStepper";
import { EditItemForm } from "@/app/pile/EditItemForm";
import { ModelImageUploader } from "./ModelImageUploader";
import { createClient } from "@/lib/supabase/client";
import { createSupabasePileStore } from "@/lib/pile/supabase-store";
import type { PileItem } from "@/lib/pile/types";

/**
 * Owner-only client island on the model detail page.
 * Receives the server-fetched item as a prop; after each mutation it calls
 * router.refresh() so the parent server component re-fetches fresh data.
 */
export function ModelDetailEditor({
  item,
  userId,
}: {
  item: PileItem;
  userId: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Build the browser store once on mount (stable: createClient is cheap and idempotent)
  function getStore() {
    return createSupabasePileStore(createClient());
  }

  async function handleAdvance() {
    await getStore().advanceState(item.id);
    router.refresh();
  }

  async function handleVisibilityToggle(checked: boolean) {
    setTogglingVisibility(true);
    try {
      const newVis = checked ? "public" : "private";
      await getStore().update(item.id, { visibility: newVis });
      router.refresh();
      if (newVis === "public") {
        const url = `${window.location.origin}/model/${item.id}`;
        await navigator.clipboard.writeText(url);
        toast.success("Now public — share link copied!");
      } else {
        toast.success("Model set to private");
      }
    } catch {
      toast.error("Could not update visibility");
    } finally {
      setTogglingVisibility(false);
    }
  }

  async function handlePhotoUpload(url: string) {
    await getStore().update(item.id, { image_url: url });
    router.refresh();
  }

  async function handleRemove() {
    if (!confirm(`Remove "${item.display_name}"? This cannot be undone.`)) return;
    await getStore().remove(item.id);
    router.back();
  }

  const isPublic = item.visibility === "public";

  return (
    <div className="space-y-4">
      {/* ── Advance state ── */}
      {item.state !== "painted" && (
        <StageStepper state={item.state} onAdvance={() => void handleAdvance()} />
      )}

      {/* ── Photo upload ── */}
      <ModelImageUploader
        userId={userId}
        itemId={item.id}
        onUpload={(url) => void handlePhotoUpload(url)}
      />

      {/* ── Edit fields ── */}
      {editOpen ? (
        <EditItemForm
          item={item}
          onSave={async (patch) => {
            await getStore().update(item.id, patch);
            router.refresh();
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit details
        </Button>
      )}

      {/* ── Visibility toggle ── */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        {isPublic ? (
          <Globe className="size-4 text-green-600" />
        ) : (
          <Lock className="size-4 text-muted-foreground" />
        )}
        <div className="flex-1">
          <Label htmlFor="visibility-toggle" className="cursor-pointer text-sm font-medium">
            {isPublic ? "Public" : "Private"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {isPublic
              ? "Anyone with the link can view this model."
              : "Only you can see this model."}
          </p>
        </div>
        <Switch
          id="visibility-toggle"
          checked={isPublic}
          disabled={togglingVisibility}
          onCheckedChange={(checked) => void handleVisibilityToggle(checked)}
        />
      </div>

      {/* ── Remove ── */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => void handleRemove()}
      >
        <Trash2 />
        Remove model
      </Button>
    </div>
  );
}
