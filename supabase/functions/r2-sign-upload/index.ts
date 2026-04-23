// Edge function: generates a presigned PUT URL for Cloudflare R2 (S3-compatible).
// The browser then uploads the file directly to R2, bypassing Lovable Cloud size limits.
import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { createClient } from "npm:@supabase/supabase-js";

const ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const ACCESS_KEY = Deno.env.get("R2_ACCESS_KEY_ID")!;
const SECRET_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const BUCKET = Deno.env.get("R2_BUCKET")!;
const PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") ?? "").replace(/\/+$/, "");

const REGION = "auto";
const SERVICE = "s3";
const HOST = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;

// --- AWS SigV4 helpers (presigned URL) ---
const enc = new TextEncoder();

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const buf = typeof data === "string" ? enc.encode(data) : data;
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
}

function encodeRfc3986(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function encodePath(path: string): string {
  return path.split("/").map(encodeRfc3986).join("/");
}

async function presignPutUrl(objectKey: string, expiresSeconds = 900): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${ACCESS_KEY}/${credentialScope}`;

  const canonicalUri = `/${BUCKET}/${encodePath(objectKey)}`;
  const signedHeaders = "host";

  const params = new URLSearchParams();
  params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  params.set("X-Amz-Credential", credential);
  params.set("X-Amz-Date", amzDate);
  params.set("X-Amz-Expires", String(expiresSeconds));
  params.set("X-Amz-SignedHeaders", signedHeaders);
  // R2 accepts UNSIGNED-PAYLOAD for presigned PUTs
  const canonicalQuery = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    `host:${HOST}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmac(enc.encode(`AWS4${SECRET_KEY}`), dateStamp);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, "aws4_request");
  const sig = await hmac(kSigning, stringToSign);
  const signature = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `https://${HOST}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth: only authenticated admins can request signed URLs
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const objectKey = String(body.objectKey ?? "").replace(/^\/+/, "");
    if (!objectKey || objectKey.length > 1024) {
      return new Response(JSON.stringify({ error: "Invalid objectKey" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploadUrl = await presignPutUrl(objectKey, 3600);
    const publicUrl = PUBLIC_URL ? `${PUBLIC_URL}/${objectKey.split("/").map(encodeURIComponent).join("/")}` : "";

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl, objectKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("r2-sign-upload error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
