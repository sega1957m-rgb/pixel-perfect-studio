import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StudioOpt { id: string; name: string }

interface Props {
  studios: StudioOpt[];
  value: string; // "ALL" or studio id
  onChange: (v: string) => void;
}

/**
 * Compact studio filter for visitor pages.
 * Shows current selection + a search field that opens a list (max ~12 items),
 * works fine even with hundreds of studios.
 */
const StudioFilterSelect = ({ studios, value, onChange }: Props) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const current = studios.find(s => s.id === value);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return studios.slice(0, 50);
    return studios.filter(s => s.name.toLowerCase().includes(needle)).slice(0, 50);
  }, [studios, q]);

  return (
    <div className="mb-10 max-w-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Studio</span>
        <button
          onClick={() => onChange("ALL")}
          className={cn(
            "px-3 py-1 text-[10px] tracking-widest uppercase border transition-colors",
            value === "ALL"
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
          )}
        >
          Tous
        </button>
        {current && (
          <span className="px-3 py-1 text-[10px] tracking-widest uppercase bg-primary text-primary-foreground border border-primary inline-flex items-center gap-1">
            {current.name}
            <button onClick={() => onChange("ALL")} aria-label="Retirer">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
      <div className="relative">
        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={`Rechercher parmi ${studios.length} studios…`}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-9 h-9 text-sm"
        />
        {open && matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-popover border border-border rounded-sm shadow-lg">
            {matches.map(s => (
              <button
                key={s.id}
                onMouseDown={(e) => { e.preventDefault(); onChange(s.id); setQ(""); setOpen(false); }}
                className={cn(
                  "block w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  value === s.id && "bg-accent text-accent-foreground",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioFilterSelect;
