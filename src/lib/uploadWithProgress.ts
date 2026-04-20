import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to a Supabase Storage bucket with progress reporting.
 * Uses XHR because supabase-js v2 does not expose upload progress events.
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token ?? apiKey}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("x-upsert", "false");
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
