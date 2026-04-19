import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

type Studio = { id: string; name: string };

interface Props {
  studios: Studio[];
  onChange: () => void;
}

const StudioManager = ({ studios, onChange }: Props) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        const path = `${crypto.randomUUID()}-${coverFile.name}`;
        const { error: upErr } = await supabase.storage.from("studio-covers").upload(path, coverFile);
        if (upErr) throw upErr;
        coverUrl = supabase.storage.from("studio-covers").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("studios").insert({
        name, description: desc || null, cover_url: coverUrl,
      });
      if (error) throw error;
      toast.success("Studio créé");
      setName(""); setDesc(""); setCoverFile(null);
      (document.getElementById("studio-cover-input") as HTMLInputElement).value = "";
      onChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce studio ? Les vidéos et albums ne seront pas supprimés.")) return;
    const { error } = await supabase.from("studios").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Studio supprimé"); onChange(); }
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="font-serif text-xl mb-4">Créer un studio</h2>
        <form onSubmit={create} className="space-y-3">
          <Input placeholder="Nom du studio" value={name} onChange={e => setName(e.target.value)} required />
          <Textarea placeholder="Description (optionnel)" value={desc} onChange={e => setDesc(e.target.value)} />
          <div>
            <Label className="text-xs">Image de couverture (optionnel)</Label>
            <Input id="studio-cover-input" type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
          </div>
          <Button type="submit" disabled={submitting}>
            <Upload className="h-4 w-4 mr-2" /> {submitting ? "Création…" : "Créer le studio"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl mb-4">Studios existants</h2>
        <div className="space-y-2">
          {studios.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 border border-border rounded-sm">
              <span>{s.name}</span>
              <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {studios.length === 0 && <p className="text-sm text-muted-foreground">Aucun studio.</p>}
        </div>
      </Card>
    </>
  );
};

export default StudioManager;
