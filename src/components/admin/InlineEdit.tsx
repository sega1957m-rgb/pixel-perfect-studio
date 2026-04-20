import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  className?: string;
}

const InlineEdit = ({ value, onSave, className }: Props) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!val.trim() || val === value) { setEditing(false); setVal(value); return; }
    setSaving(true);
    try { await onSave(val.trim()); setEditing(false); }
    finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
        <span>{value}</span>
        <button
          type="button"
          onClick={() => { setVal(value); setEditing(true); }}
          className="p-1 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Renommer"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setEditing(false); setVal(value); } }}
        autoFocus
        className="h-7 px-2 text-sm w-48"
        disabled={saving}
      />
      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={submit} disabled={saving}>
        <Check className="h-4 w-4 text-primary" />
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(false); setVal(value); }} disabled={saving}>
        <X className="h-4 w-4 text-destructive" />
      </Button>
    </span>
  );
};

export default InlineEdit;
