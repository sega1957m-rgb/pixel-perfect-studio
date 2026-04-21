import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Film } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import StudioFilterSelect from "@/components/StudioFilterSelect";
import Paginated from "@/components/Paginated";
import { cn } from "@/lib/utils";

type Quality = "4K" | "Full HD" | "HD" | "SD";
type Category = "Scene" | "BTS" | "Interview" | "Bonus Scene" | "Bloopers" | "Striptease" | "Photoshoot";

interface Video {
  id: string;
  title: string;
  description: string | null;
  quality: Quality;
  category: Category;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  studio_ids?: string[];
}

interface StudioOpt { id: string; name: string; }

const QUALITIES: (Quality | "ALL")[] = ["ALL", "4K", "Full HD", "HD", "SD"];
const CATEGORIES: (Category | "ALL")[] = ["ALL", "Scene", "BTS", "Interview", "Bonus Scene", "Bloopers", "Striptease", "Photoshoot"];

const PAGE_SIZE = 50;

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [studios, setStudios] = useState<StudioOpt[]>([]);
  const [filter, setFilter] = useState<Quality | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");
  const [studioFilter, setStudioFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: vids }, { data: links }, { data: studs }] = await Promise.all([
        supabase.from("videos").select("*").order("created_at", { ascending: false }),
        supabase.from("studio_videos").select("video_id, studio_id"),
        supabase.from("studios").select("id, name").order("name"),
      ]);
      const linkMap = new Map<string, string[]>();
      ((links as any[]) || []).forEach(l => {
        if (!linkMap.has(l.video_id)) linkMap.set(l.video_id, []);
        linkMap.get(l.video_id)!.push(l.studio_id);
      });
      setVideos(((vids as Video[]) || []).map(v => ({ ...v, studio_ids: linkMap.get(v.id) || [] })));
      setStudios((studs as StudioOpt[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => videos.filter(v =>
      (filter === "ALL" || v.quality === filter) &&
      (categoryFilter === "ALL" || v.category === categoryFilter) &&
      (studioFilter === "ALL" || v.studio_ids?.includes(studioFilter)),
    ),
    [videos, filter, categoryFilter, studioFilter],
  );
  useEffect(() => { setPage(1); }, [filter, categoryFilter, studioFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Vidéothèque</p>
        <h1 className="font-serif text-5xl md:text-6xl">Films</h1>
      </div>

      {/* Quality filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUALITIES.map(q => (
          <button
            key={q}
            onClick={() => setFilter(q)}
            className={cn(
              "px-5 py-2 text-xs tracking-[0.2em] uppercase border transition-all",
              filter === q
                ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-gold)]"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
            )}
          >
            {q === "ALL" ? "Toutes qualités" : q}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cn(
              "px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase border transition-all",
              categoryFilter === c
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
            )}
          >
            {c === "ALL" ? "Toutes catégories" : c}
          </button>
        ))}
      </div>

      {/* Studio filter (search-based, ok for hundreds of studios) */}
      {studios.length > 0 && (
        <StudioFilterSelect studios={studios} value={studioFilter} onChange={setStudioFilter} />
      )}

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucune vidéo.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map(v => (
              <button key={v.id} onClick={() => setActive(v)} className="group text-left">
                <div className="aspect-video bg-card rounded-sm overflow-hidden relative border border-border">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="h-12 w-12" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className="bg-background/90 backdrop-blur px-2 py-1 text-[10px] tracking-widest uppercase border border-primary/40 text-primary">
                      {v.quality}
                    </span>
                    <span className="bg-background/80 backdrop-blur px-2 py-1 text-[9px] tracking-widest uppercase border border-border text-foreground">
                      {v.category}
                    </span>
                  </div>
                </div>
                <h3 className="font-serif text-lg mt-3 group-hover:text-primary transition-colors">{v.title}</h3>
                {v.description && <p className="text-xs text-muted-foreground line-clamp-2">{v.description}</p>}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Affichage {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </p>
          <Paginated page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      {active && <VideoPlayer video={active} onClose={() => setActive(null)} />}
    </div>
  );
};

export default Videos;
