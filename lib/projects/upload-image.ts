import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Upload a project image file directly from the browser to Supabase Storage.
 *
 * File upload must stay in the browser — server action request bodies are
 * capped at ~1MB, so binary files cannot pass through them. Only the
 * resulting DB row write goes through a server action (addProjectImageAction).
 *
 * The storage path follows the RLS policy: first segment must be the user's
 * auth.uid(), so `${userId}/${projectId}/${uuid}.${ext}` satisfies the check
 * `(storage.foldername(name))[1] = auth.uid()::text`.
 */
export async function uploadProjectImageFile(
  supabase: SupabaseClient,
  { userId, projectId, file }: { userId: string; projectId: string; file: File },
): Promise<{ storagePath: string; publicUrl: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${userId}/${projectId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(storagePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("project-images").getPublicUrl(storagePath);

  return { storagePath, publicUrl };
}
