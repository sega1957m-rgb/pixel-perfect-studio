import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface Studio {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

const Studios = () => {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("studios").select("*").order("created_at", { ascending: false });
      setStudios((data as Studio[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container py-16">
      <div className="mb-12">
        <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Collections</p>
        <h1 className="font-serif text-5xl md:text-6xl">Studios</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Découvrez chaque studio et l'ensemble de ses vidéos et albums photos.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : studios.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun studio pour l'instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((s) => (
            <Link key={s.id} to={`/studios/${s.id}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden rounded-sm bg-card border border-border relative">
                {s.cover_url ? (
                  <img
                    src={s.cover_url}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Building2 className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                    {s.name}
                  </h3>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Studios;
