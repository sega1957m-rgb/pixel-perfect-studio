export function r2ObjectKey(source: string): string | null {
  try {
    const url = new URL(source);
    if (!url.hostname.endsWith(".r2.cloudflarestorage.com")) return null;
    const [, bucket, ...parts] = url.pathname.split("/");
    if (!bucket || !parts.length) return null;
    return parts.map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}