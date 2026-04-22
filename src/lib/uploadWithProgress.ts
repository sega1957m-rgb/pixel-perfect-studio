import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to a Supabase Storage bucket with progress reporting.
 *
 * - Files <= 6 MB use a single POST (fast path).
 * - Files > 6 MB use the TUS resumable protocol so files up to 5 GB
 *   (or whatever the bucket allows) can be uploaded reliably without
 *   hitting the standard "object exceeded the maximum allowed size".
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (bucket === "videos" && file.size > 18 * 1024 * 1024 * 1024) {
    throw new Error("La taille maximale par vidéo est de 18 GB.");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token ?? apiKey;

  // Small file → single POST with XHR (gives us progress events)
  if (file.size <= 6 * 1024 * 1024) {
    await singleUpload(supabaseUrl, bucket, path, file, token, apiKey, onProgress);
    return;
  }

  // Large file → resumable TUS upload
  await tusUpload(supabaseUrl, bucket, path, file, token, apiKey, onProgress);
}

function singleUpload(
  supabaseUrl: string,
  bucket: string,
  path: string,
  file: File,
  token: string,
  apiKey: string,
  onProgress?: (p: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

/**
 * TUS 1.0.0 resumable upload — Supabase Storage supports it natively at
 * /storage/v1/upload/resumable. Chunks of 6 MB are sent sequentially.
 */
async function tusUpload(
  supabaseUrl: string,
  bucket: string,
  path: string,
  file: File,
  token: string,
  apiKey: string,
  onProgress?: (p: number) => void,
) {
  const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;
  const chunkSize = 6 * 1024 * 1024;

  const baseHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    apikey: apiKey,
    "Tus-Resumable": "1.0.0",
  };

  // 1. Create upload
  const metadata = {
    bucketName: bucket,
    objectName: path,
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
  };
  const metaHeader = Object.entries(metadata)
    .map(([k, v]) => `${k} ${btoa(unescape(encodeURIComponent(v)))}`)
    .join(",");

  const createRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...baseHeaders,
      "Upload-Length": String(file.size),
      "Upload-Metadata": metaHeader,
      "Content-Type": "application/offset+octet-stream",
    },
  });
  if (!createRes.ok) {
    const text = await createRes.text().catch(() => "");
    if (createRes.status === 413) {
      throw new Error(
        "Upload refusé par le serveur (413). La limite globale du projet Lovable Cloud est inférieure à la taille du fichier. Augmentez la 'Global file size limit' dans les paramètres Storage du projet (max 50 GB selon le plan).",
      );
    }
    throw new Error(`Resumable upload init failed (${createRes.status}): ${text}`);
  }
  const location = createRes.headers.get("Location");
  if (!location) throw new Error("Resumable upload: missing Location header");

  // 2. PATCH chunks
  let offset = 0;
  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    const chunk = file.slice(offset, end);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", location, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", apiKey);
      xhr.setRequestHeader("Tus-Resumable", "1.0.0");
      xhr.setRequestHeader("Upload-Offset", String(offset));
      xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const total = file.size;
          const sent = offset + e.loaded;
          onProgress(Math.min(100, Math.round((sent / total) * 100)));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Chunk upload failed (${xhr.status}): ${xhr.responseText}`));
      };
      xhr.onerror = () => reject(new Error("Network error during chunk upload"));
      xhr.send(chunk);
    });

    offset = end;
    onProgress?.(Math.min(100, Math.round((offset / file.size) * 100)));
  }
  onProgress?.(100);
}
