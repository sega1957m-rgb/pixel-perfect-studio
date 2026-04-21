import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Paginated from "@/components/Paginated";

interface Studio {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
}

const PAGE_SIZE = 50;

const Studios = () => {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("studios").select("*").order("name");
      setStudios((data as Studio[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return studios;
    return studios.filter(s => s.name.toLowerCase().includes(needle));
  }, [studios, q]);

  useEffect(() => { setPage(1); }, [q]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Collections</p>
        <h1 className="font-serif text-5xl md:text-6xl">Studios</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          {studios.length} studio{studios.length > 1 ? "s" : ""} disponible{studios.length > 1 ? "s" : ""}.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un studio…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun studio.</p>
        </div>
      ) : (
        <>
          {/* Compact list view (works well for hundreds of studios) */}
          <div className="border border-border rounded-sm divide-y divide-border bg-card">
            {paged.map((s) => (
              <Link
                key={s.id}
                to={`/studios/${s.id}`}
                className="group flex items-center gap-4 p-3 hover:bg-accent/30 transition-colors"
              >
                <div className="h-12 w-12 shrink-0 rounded-sm overflow-hidden bg-background border border-border">
                  {s.cover_url ? (
                    <img src={s.cover_url} alt={s.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-base group-hover:text-primary transition-colors truncate">
                    {s.name}
                  </h3>
                  {s.description && (
                    <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                  )}
                </div>
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground group-hover:text-primary">
                  Voir →
                </span>
              </Link>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </p>
          <Paginated page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Studios;
