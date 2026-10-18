import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { r2ObjectKey } from "@/lib/mediaUrl";

export function useMediaUrl(source: string | null) {
  const objectKey = source ? r2ObjectKey(source) : null;
  const query = useQuery({
    queryKey: ["media-read-url", objectKey],
    enabled: Boolean(objectKey),
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("r2-sign-upload", {
        body: { action: "read", objectKey },
      });
      if (error || !data?.readUrl) throw new Error("Impossible d’accéder au fichier vidéo ou à sa miniature.");
      return data.readUrl as string;
    },
  });
  return { url: objectKey ? query.data : source || undefined, loading: Boolean(objectKey) && query.isPending, error: query.error };
}