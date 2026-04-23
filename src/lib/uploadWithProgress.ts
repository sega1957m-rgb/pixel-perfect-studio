import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file directly to Cloudflare R2 via a presigned PUT URL.
 * Returns the public URL composed by the edge function from R2_PUBLIC_URL.
 *
 * Buckets: "videos" | "photos" | "thumbnails" | "studio-covers"
 * Objects are stored under `${bucket}/${path}` inside the single R2 bucket.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ publicUrl: string; objectKey: string }> {
  if (bucket === "videos" && file.size > 50 * 1024 * 1024 * 1024) {
    throw new Error("La taille maximale par vidéo est de 50 GB.");
  }

  const objectKey = `${bucket}/${path}`;

  // 1. Get presigned URL from edge function (admin-only)
  const { data, error } = await supabase.functions.invoke("r2-sign-upload", {
    body: { objectKey },
  });
  if (error) throw new Error(error.message || "Failed to get signed URL");
  const { uploadUrl, publicUrl } = (data ?? {}) as {
    uploadUrl?: string;
    publicUrl?: string;
  };
  if (!uploadUrl) throw new Error("Signed URL missing");

  // 2. PUT the file directly to R2 with XHR (gives us progress events)
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

  return { publicUrl: publicUrl ?? "", objectKey };
}
