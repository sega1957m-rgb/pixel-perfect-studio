import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Film } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";

type Quality = "4K" | "HD" | "Studio";

interface Video {
  id: string;
  title: string;
  description: string | null;
  quality: Quality;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
}

const QUALITIES: (Quality | "ALL")[] = ["ALL", "4K", "HD", "Studio"];

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filter, setFilter] = useState<Quality | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      setVideos((data as Video[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? videos : videos.filter(v => v.quality === filter)),
    [videos, filter]
  );

  return (
    <div className="container py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Vidéothèque</p>
        <h1 className="font-serif text-5xl md:text-6xl">Films</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {QUALITIES.map(q => (
          <button
            key={q}
            onClick={() => setFilter(q)}
            className={cn(
              "px-5 py-2 text-xs tracking-[0.2em] uppercase border transition-all",
              filter === q
                ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-gold)]"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            )}
          >
            {q === "ALL" ? "Tous" : q}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucune vidéo {filter !== "ALL" && `en ${filter}`}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(v => (
            <button
              key={v.id}
              onClick={() => setActive(v)}
              className="group text-left"
            >
              <div className="aspect-video bg-card rounded-sm overflow-hidden relative border border-border">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Film className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-1 text-[10px] tracking-widest uppercase border border-primary/40 text-primary">
                  {v.quality}
                </div>
              </div>
              <h3 className="font-serif text-lg mt-3 group-hover:text-primary transition-colors">{v.title}</h3>
              {v.description && <p className="text-xs text-muted-foreground line-clamp-2">{v.description}</p>}
            </button>
          ))}
        </div>
      )}

      {active && <VideoPlayer video={active} onClose={() => setActive(null)} />}
    </div>
  );
};

export default Videos;
