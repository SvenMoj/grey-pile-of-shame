"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A locally-staged image — file + preview URL, not yet uploaded to Storage. */
export type StagedImage = {
  id: string; // temp UUID for UI keying
  file: File;
  previewUrl: string; // blob: URL via URL.createObjectURL
};

type Props = {
  images: StagedImage[];
  /** Called after every mutation with the updated list. */
  onChange: (next: StagedImage[]) => void;
};

/**
 * A create-mode image gallery that holds File objects in client state.
 * Nothing is uploaded or persisted — the parent flushes all staged files to
 * Supabase Storage after the recipe is successfully created.
 *
 * Uses plain <img> for previews because next/image rejects blob: URLs
 * without additional remote-pattern / unoptimized config.
 */
export function StagedImageGallery({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const next: StagedImage = {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    };
    onChange([...images, next]);
    // Reset so the same file can be re-selected if removed and re-added.
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(img: StagedImage) {
    URL.revokeObjectURL(img.previewUrl);
    onChange(images.filter((i) => i.id !== img.id));
  }

  function handleReorder(index: number, direction: -1 | 1) {
    const swap = index + direction;
    if (swap < 0 || swap >= images.length) return;
    const next = [...images];
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              {/* Thumbnail */}
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Staged photo ${index + 1}`}
                  className="h-full w-full object-cover"
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
                  onClick={() => handleRemove(img)}
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
          onChange={handleAdd}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload />
          Add photo
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
