import { cn } from "@/lib/utils";

type Studio = { id: string; name: string };

interface Props {
  studios: Studio[];
  selected: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

const StudioPicker = ({ studios, selected, onChange, label = "Studios" }: Props) => {
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

  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {studios.map(s => {
          const on = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                "px-3 py-1.5 text-[11px] tracking-wider uppercase border rounded-sm transition-colors",
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
              )}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudioPicker;
