"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { uploadProjectImageFile } from "@/lib/projects/upload-image";
import { addProjectImageAction, removeProjectImageAction } from "@/lib/projects/actions";
import type { ProjectImage } from "@/lib/projects/types";

type Props = {
  projectId: string;
  userId: string;
  initialImages: ProjectImage[];
  /** Called after any mutation so the parent can refresh its local state. */
  onImagesChange: (images: ProjectImage[]) => void;
};

/**
 * Edit-mode project image gallery.
 * Uploads go directly to Supabase Storage from the browser (server-action body
 * cap is ~1MB); only DB row writes go through server actions.
 */
export function ProjectImageGallery({ projectId, userId, initialImages, onImagesChange }: Props) {
  const [images, setImages] = useState<ProjectImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: ProjectImage[]) {
    setImages(next);
    onImagesChange(next);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { storagePath, publicUrl } = await uploadProjectImageFile(supabase, {
        userId,
        projectId,
        file,
      });

      const fd = new FormData();
      fd.append("projectId", projectId);
      fd.append("storage_path", storagePath);
      fd.append("image_url", publicUrl);
      fd.append("sort_order", String(images.length));

      const result = await addProjectImageAction(fd);
      if (result.error) throw new Error(result.error);

      const newImage: ProjectImage = {
        id: crypto.randomUUID(),
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

  async function handleRemove(img: ProjectImage) {
    try {
      const fd = new FormData();
      fd.append("imageId", img.id);
      fd.append("storage_path", img.storage_path);

      const result = await removeProjectImageAction(fd);
      if (result.error) throw new Error(result.error);

      update(images.filter((i) => i.id !== img.id));
      toast.success("Photo removed");
    } catch {
      toast.error("Could not remove photo");
    }
  }

  function handleReorder(index: number, direction: -1 | 1) {
    const swap = index + direction;
    if (swap < 0 || swap >= images.length) return;
    const next = [...images];
    [next[index], next[swap]] = [next[swap], next[index]];
    update(next.map((img, idx) => ({ ...img, sort_order: idx })));
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <Image
                  src={img.image_url}
                  alt={`Project photo ${index + 1}`}
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
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={() => handleReorder(index, -1)}
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
                  onClick={() => handleReorder(index, 1)}
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
