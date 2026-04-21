import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [q, setQ] = useState("");

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

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return studios.filter(s => s.name.toLowerCase().includes(needle)).slice(0, 20);
  }, [q, studios]);

  if (loading || studios.length === 0) {
    return studios.length === 0
      ? <p className="text-[10px] text-muted-foreground italic">Créez un studio pour pouvoir l'affecter.</p>
      : null;
  }

  const selectedList = studios.filter(s => selected.has(s.id));

  return (
    <div className="pt-1">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          Studios {selected.size > 0 && <span className="text-primary">({selected.size})</span>}
        </span>
        {selectedList.map(s => (
          <span
            key={s.id}
            className="px-2 py-0.5 text-[10px] tracking-wider uppercase bg-primary text-primary-foreground border border-primary inline-flex items-center gap-1"
          >
            {s.name}
            <button type="button" onClick={() => toggle(s.id)} aria-label="Retirer">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative max-w-sm">
        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un studio à affecter…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 h-8 text-xs"
        />
        {matches.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto bg-popover border border-border rounded-sm shadow-lg">
            {matches.map(s => {
              const on = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex items-center justify-between w-full text-left px-3 py-1.5 text-xs hover:bg-accent",
                    on && "bg-accent/50",
                  )}
                >
                  <span>{s.name}</span>
                  {on && <span className="text-[9px] uppercase tracking-widest text-primary">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioAssign;
