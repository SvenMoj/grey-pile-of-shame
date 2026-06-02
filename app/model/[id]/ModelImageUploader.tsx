"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * File-picker that uploads a photo to the model-images bucket and calls
 * onUpload with the resulting public URL.
 *
 * Path convention: <user_id>/<item_id>/<filename>
 * The bucket is public so the URL is stable and needs no signed-URL rotation.
 */
export function ModelImageUploader({
  userId,
  itemId,
  onUpload,
}: {
  userId: string;
  itemId: string;
  onUpload: (url: string) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${itemId}/photo.${ext}`;

      const { error } = await supabase.storage
        .from("model-images")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("model-images").getPublicUrl(path);

      await onUpload(publicUrl);
      toast.success("Photo uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed — please try again");
    } finally {
      setUploading(false);
      // reset so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void handleChange(e)}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {uploading ? "Uploading…" : "Upload photo"}
      </Button>
    </>
  );
}
