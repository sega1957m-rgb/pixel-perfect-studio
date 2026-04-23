import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file directly to Cloudflare R2 via a presigned PUT URL
 * obtained from the `r2-sign-upload` edge function.
 *
 * Buckets accepted: "videos" | "photos" | "thumbnails" | "studio-covers"
 *
 * The returned `path` (object key in R2) is what should be stored in
 * the database as `storage_path`. The matching public URL is what
 * `getPublicUrl(path)` previously returned for Supabase Storage —
 * here it is composed from R2_PUBLIC_URL on the server.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  // Hard cap to protect against runaway uploads (R2 itself supports much more)
  if (bucket === "videos" && file.size > 50 * 1024 * 1024 * 1024) {
    throw new Error("La taille maximale par vidéo est de 50 GB.");
  }

  const objectKey = `${bucket}/${path}`;

  // 1. Get presigned URL from edge function (admin-only)
  const { data, error } = await supabase.functions.invoke("r2-sign-upload", {
    body: { objectKey },
  });
  if (error) throw new Error(error.message || "Failed to get signed URL");
  const { uploadUrl } = data as { uploadUrl: string; publicUrl: string };
  if (!uploadUrl) throw new Error("Signed URL missing");

  // 2. PUT the file directly to R2 with XHR (for progress events)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

/**
 * Build the public URL for an object stored in R2.
 * Used as a replacement for `supabase.storage.from(bucket).getPublicUrl(path)`.
 */
export function getR2PublicUrl(bucket: string, path: string): string {
  const base = (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined)?.replace(/\/+$/, "");
  const key = `${bucket}/${path}`.split("/").map(encodeURIComponent).join("/");
  if (!base) {
    // Fallback to Supabase storage if env not configured (dev)
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  return `${base}/${key}`;
}
