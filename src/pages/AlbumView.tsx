import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import PhotoLightbox from "@/components/PhotoLightbox";

interface Photo {
  id: string;
  url: string;
  title: string | null;
}

const AlbumView = () => {
  const { id } = useParams();
  const [albumName, setAlbumName] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: album }, { data: photoData }] = await Promise.all([
        supabase.from("albums").select("name").eq("id", id).maybeSingle(),
        supabase.from("photos").select("id,url,title").eq("album_id", id).order("created_at"),
      ]);
      setAlbumName(album?.name || "Album");
      setPhotos(photoData || []);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="container py-12">
      <Link to="/photos" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" /> Tous les albums
      </Link>
      <h1 className="font-serif text-4xl md:text-5xl mb-2">{albumName}</h1>
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-10">{photos.length} photo{photos.length > 1 ? "s" : ""}</p>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : photos.length === 0 ? (
        <p className="text-muted-foreground">Aucune photo dans cet album.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActiveIndex(idx)}
              className="aspect-square overflow-hidden rounded-sm bg-card group relative"
            >
              <img
                src={p.url}
                alt={p.title || ""}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {activeIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChange={setActiveIndex}
        />
      )}
    </div>
  );
};

export default AlbumView;
