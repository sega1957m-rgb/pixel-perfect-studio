import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Studio = { id: string; name: string };

interface Props {
  kind: "video" | "album";
  itemId: string;
  studios: Studio[];
}

const StudioAssign = ({ kind, itemId, studios }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = kind === "video"
        ? await supabase.from("studio_videos").select("studio_id").eq("video_id", itemId)
        : await supabase.from("studio_albums").select("studio_id").eq("album_id", itemId);
      setSelected(new Set(((data as any[]) || []).map(r => r.studio_id)));
      setLoading(false);
    })();
  }, [itemId, kind]);

  const toggle = async (studioId: string) => {
    const isOn = selected.has(studioId);
    const next = new Set(selected);
    if (isOn) {
      next.delete(studioId);
      const { error } = kind === "video"
        ? await supabase.from("studio_videos").delete().eq("video_id", itemId).eq("studio_id", studioId)
        : await supabase.from("studio_albums").delete().eq("album_id", itemId).eq("studio_id", studioId);
      if (error) { toast.error(error.message); return; }
    } else {
      next.add(studioId);
      const { error } = kind === "video"
        ? await supabase.from("studio_videos").insert({ video_id: itemId, studio_id: studioId })
        : await supabase.from("studio_albums").insert({ album_id: itemId, studio_id: studioId });
      if (error) { toast.error(error.message); return; }
    }
    setSelected(next);
  };

  if (loading || studios.length === 0) {
    return studios.length === 0
      ? <p className="text-[10px] text-muted-foreground italic">Créez un studio pour pouvoir l'affecter.</p>
      : null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      <span className="text-[10px] tracking-widest uppercase text-muted-foreground self-center mr-1">Studios :</span>
      {studios.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => toggle(s.id)}
          className={cn(
            "px-2.5 py-1 text-[10px] tracking-wider uppercase border rounded-sm transition-colors",
            selected.has(s.id)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
};

export default StudioAssign;
