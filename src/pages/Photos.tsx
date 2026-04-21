import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Folder, ImageIcon } from "lucide-react";
import StudioFilterSelect from "@/components/StudioFilterSelect";
import Paginated from "@/components/Paginated";

interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  photo_count?: number;
  studio_ids?: string[];
}
interface StudioOpt { id: string; name: string; }

const PAGE_SIZE = 50;

const Photos = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [studios, setStudios] = useState<StudioOpt[]>([]);
  const [studioFilter, setStudioFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: alb }, { data: links }, { data: studs }] = await Promise.all([
        supabase.from("albums").select("*, photos(count)").order("created_at", { ascending: false }),
        supabase.from("studio_albums").select("album_id, studio_id"),
        supabase.from("studios").select("id, name").order("name"),
      ]);
      const linkMap = new Map<string, string[]>();
      ((links as any[]) || []).forEach(l => {
        if (!linkMap.has(l.album_id)) linkMap.set(l.album_id, []);
        linkMap.get(l.album_id)!.push(l.studio_id);
      });
      setAlbums(
        (alb || []).map((a: any) => ({
          ...a,
          photo_count: a.photos?.[0]?.count ?? 0,
          studio_ids: linkMap.get(a.id) || [],
        })),
      );
      setStudios((studs as StudioOpt[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => albums.filter(a => studioFilter === "ALL" || a.studio_ids?.includes(studioFilter)),
    [albums, studioFilter],
  );
  useEffect(() => { setPage(1); }, [studioFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Galerie</p>
        <h1 className="font-serif text-5xl md:text-6xl">Albums</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Cliquez sur un album pour voir les miniatures, puis sur une photo pour la qualité originale avec zoom.
        </p>
      </div>

      {studios.length > 0 && (
        <StudioFilterSelect studios={studios} value={studioFilter} onChange={setStudioFilter} />
      )}

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun album.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paged.map((a) => (
              <Link key={a.id} to={`/photos/${a.id}`} className="group block">
                <div className="aspect-square overflow-hidden rounded-sm bg-card border border-border relative">
                  {a.cover_url ? (
                    <img src={a.cover_url} alt={a.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-3 left-3 bg-background/80 backdrop-blur px-2 py-1 text-xs tracking-wider uppercase">
                    {a.photo_count} photo{(a.photo_count || 0) > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-serif text-lg group-hover:text-primary transition-colors">{a.name}</h3>
                  {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                </div>
              </Link>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Affichage {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </p>
          <Paginated page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Photos;
