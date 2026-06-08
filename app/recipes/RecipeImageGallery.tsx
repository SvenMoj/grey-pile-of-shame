"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  addRecipeImageAction,
  removeRecipeImageAction,
  reorderRecipeImagesAction,
} from "@/lib/recipes/actions";
import type { RecipeImage } from "@/lib/recipes/types";

type Props = {
  recipeId: string;
  userId: string;
  initialImages: RecipeImage[];
  /** Called after any mutation so the parent can refresh its local state. */
  onImagesChange: (images: RecipeImage[]) => void;
};

export function RecipeImageGallery({ recipeId, userId, initialImages, onImagesChange }: Props) {
  const [images, setImages] = useState<RecipeImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: RecipeImage[]) {
    setImages(next);
    onImagesChange(next);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // File upload goes directly to Supabase Storage from the browser.
      // Server Action request bodies cap at ~1MB so binary files must not go through them.
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const storagePath = `${userId}/${recipeId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("recipe-images").getPublicUrl(storagePath);

      // DB row write goes through a server action (convention: only server actions mutate DB).
      const fd = new FormData();
      fd.append("recipeId", recipeId);
      fd.append("storage_path", storagePath);
      fd.append("image_url", publicUrl);
      fd.append("sort_order", String(images.length));

      const result = await addRecipeImageAction(fd);
      if (result.error) throw new Error(result.error);

      // Optimistically update local state with the data we know (no DB round-trip needed).
      const newImage: RecipeImage = {
        id: crypto.randomUUID(), // placeholder until next server-render; revalidatePath handles it
        storage_path: storagePath,
        image_url: publicUrl,
        sort_order: images.length,
      };
      update([...images, newImage]);
      toast.success("Photo added");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(img: RecipeImage) {
    try {
      const fd = new FormData();
      fd.append("imageId", img.id);
      fd.append("storage_path", img.storage_path);
      fd.append("recipeId", recipeId);

      const result = await removeRecipeImageAction(fd);
      if (result.error) throw new Error(result.error);

      update(images.filter((i) => i.id !== img.id));
      toast.success("Photo removed");
    } catch {
      toast.error("Could not remove photo");
    }
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const swap = index + direction;
    if (swap < 0 || swap >= images.length) return;
    const next = [...images];
    [next[index], next[swap]] = [next[swap], next[index]];
    try {
      const fd = new FormData();
      fd.append("recipeId", recipeId);
      fd.append("orderedIds", JSON.stringify(next.map((i) => i.id)));

      const result = await reorderRecipeImagesAction(fd);
      if (result.error) throw new Error(result.error);

      update(next.map((i, idx) => ({ ...i, sort_order: idx })));
    } catch {
      toast.error("Could not reorder photos");
    }
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              {/* Thumbnail */}
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <Image
                  src={img.image_url}
                  alt={`Recipe photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[10px] text-center py-0.5">
                    Cover
                  </span>
                )}
              </div>
              {/* Controls (appear on hover) */}
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => void handleReorder(index, -1)}
                  disabled={index === 0}
                  aria-label="Move photo left"
                >
                  <ChevronLeft className="size-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-6 w-6 p-0"
                  onClick={() => void handleRemove(img)}
                  aria-label="Remove photo"
                >
                  <Trash2 className="size-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => void handleReorder(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move photo right"
                >
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleUpload(e)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {uploading ? "Uploading…" : "Add photo"}
        </Button>
        {images.length === 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            First photo becomes the cover image.
          </p>
        )}
      </div>
    </div>
  );
}
