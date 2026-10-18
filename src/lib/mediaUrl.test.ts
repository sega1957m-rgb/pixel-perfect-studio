import { describe, expect, it } from "vitest";
import { r2ObjectKey } from "./mediaUrl";

describe("R2 media links", () => {
  it("extracts the exact uploaded key without its storage bucket", () => {
    expect(r2ObjectKey("https://example.r2.cloudflarestorage.com/media/videos/id-Test%20video.mp4")).toBe("videos/id-Test video.mp4");
  });
  it("leaves existing public storage and local server links unchanged", () => {
    expect(r2ObjectKey("https://mycloudft.ddns.net/media/video.mp4")).toBeNull();
    expect(r2ObjectKey("https://example.supabase.co/storage/v1/object/public/videos/a.mp4")).toBeNull();
  });
  it("does not mistake another host for R2", () => {
    expect(r2ObjectKey("https://example.r2.cloudflarestorage.com.invalid/media/videos/a.mp4")).toBeNull();
  });
});