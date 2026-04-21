import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Studio = { id: string; name: string };

interface Props {
  studios: Studio[];
  selected: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

const StudioPicker = ({ studios, selected, onChange, label = "Studios" }: Props) => {
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return studios.filter(s => s.name.toLowerCase().includes(needle)).slice(0, 30);
  }, [q, studios]);

  if (studios.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Aucun studio. Créez-en un dans l'onglet Studios.
      </p>
    );
  }

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectedStudios = studios.filter(s => selected.includes(s.id));

  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
        {label} {selected.length > 0 && <span className="text-primary">({selected.length})</span>}
      </p>

      {/* Selected chips */}
      {selectedStudios.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedStudios.map(s => (
            <span
              key={s.id}
              className="px-2.5 py-1 text-[11px] tracking-wider uppercase bg-primary text-primary-foreground border border-primary inline-flex items-center gap-1.5"
            >
              {s.name}
              <button type="button" onClick={() => toggle(s.id)} aria-label="Retirer">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search field */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={`Rechercher parmi ${studios.length} studios…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {matches.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-popover border border-border rounded-sm shadow-lg">
            {matches.map(s => {
              const on = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    on && "bg-accent/50",
                  )}
                >
                  <span>{s.name}</span>
                  {on && <span className="text-[10px] uppercase tracking-widest text-primary">✓ Sélectionné</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioPicker;
