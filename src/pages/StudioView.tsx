import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Film, ImageIcon, Play } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";

interface Studio {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}
interface Video {
  id: string; title: string; description: string | null;
  quality: "4K" | "HD" | "Studio";
  video_url: string; thumbnail_url: string | null; duration_seconds: number | null;
}
interface Album {
  id: string; name: string; description: string | null; cover_url: string | null;
}

const StudioView = () => {
  const { id } = useParams<{ id: string }>();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: s }, { data: sv }, { data: sa }] = await Promise.all([
        supabase.from("studios").select("*").eq("id", id).maybeSingle(),
        supabase.from("studio_videos").select("video_id, videos(*)").eq("studio_id", id),
        supabase.from("studio_albums").select("album_id, albums(*)").eq("studio_id", id),
      ]);
      setStudio((s as Studio) || null);
      setVideos(((sv as any[]) || []).map(r => r.videos).filter(Boolean));
      setAlbums(((sa as any[]) || []).map(r => r.albums).filter(Boolean));
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="container py-20 text-muted-foreground">Chargement…</div>;
  if (!studio) return <div className="container py-20">Studio introuvable.</div>;

  return (
    <div className="container py-12">
      <Link to="/studios" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="h-4 w-4" /> Retour aux studios
      </Link>

      <div className="grid md:grid-cols-[2fr_3fr] gap-8 items-start mb-12">
        <div className="aspect-[4/3] overflow-hidden rounded-sm bg-card border border-border">
          {studio.cover_url ? (
            <img src={studio.cover_url} alt={studio.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Building2 className="h-16 w-16" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Studio</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{studio.name}</h1>
          {studio.description && <p className="text-muted-foreground">{studio.description}</p>}
        </div>
      </div>

      {/* Videos */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl mb-6 flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" /> Vidéos ({videos.length})
        </h2>
        {videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune vidéo dans ce studio.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(v => (
              <button key={v.id} onClick={() => setActive(v)} className="group text-left">
                <div className="aspect-video bg-card rounded-sm overflow-hidden relative border border-border">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="h-12 w-12" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-1 text-[10px] tracking-widest uppercase border border-primary/40 text-primary">
                    {v.quality}
                  </div>
                </div>
                <h3 className="font-serif text-lg mt-3 group-hover:text-primary transition-colors">{v.title}</h3>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Albums */}
      <section>
        <h2 className="font-serif text-2xl mb-6 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" /> Albums ({albums.length})
        </h2>
        {albums.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun album dans ce studio.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map(a => (
              <Link key={a.id} to={`/photos/${a.id}`} className="group block">
                <div className="aspect-square overflow-hidden rounded-sm bg-card border border-border relative">
                  {a.cover_url ? (
                    <img src={a.cover_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-10 w-10" /></div>
                  )}
                </div>
                <h3 className="font-serif text-lg mt-3 group-hover:text-primary transition-colors">{a.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {active && <VideoPlayer video={active} onClose={() => setActive(null)} />}
    </div>
  );
};

export default StudioView;
