import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import InlineEdit from "@/components/admin/InlineEdit";
import ThumbnailEdit from "@/components/admin/ThumbnailEdit";
import { uploadWithProgress } from "@/lib/uploadWithProgress";

type Studio = { id: string; name: string };
type StudioFull = { id: string; name: string; description: string | null; cover_url: string | null };

interface Props {
  studios: Studio[];
  onChange: () => void;
}

const StudioManager = ({ studios, onChange }: Props) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [full, setFull] = useState<StudioFull[]>([]);

  const loadFull = async () => {
    const { data } = await supabase.from("studios").select("id,name,description,cover_url").order("name");
    setFull((data as StudioFull[]) || []);
  };

  useEffect(() => { loadFull(); }, [studios]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setProgress(0);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        const path = `${crypto.randomUUID()}-${coverFile.name}`;
        const res = await uploadWithProgress("studio-covers", path, coverFile, setProgress);
        coverUrl = res.publicUrl;
      }
      const { error } = await supabase.from("studios").insert({
        name, description: desc || null, cover_url: coverUrl,
      });
      if (error) throw error;
      toast.success("Studio créé");
      setName(""); setDesc(""); setCoverFile(null);
      const input = document.getElementById("studio-cover-input") as HTMLInputElement | null;
      if (input) input.value = "";
      onChange();
      loadFull();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  const rename = async (id: string, newName: string) => {
    const { error } = await supabase.from("studios").update({ name: newName }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Studio renommé"); onChange(); loadFull(); }
  };

  const updateCover = async (id: string, url: string) => {
    const { error } = await supabase.from("studios").update({ cover_url: url }).eq("id", id);
    if (error) toast.error(error.message); else loadFull();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce studio ? Les vidéos et albums ne seront pas supprimés.")) return;
    const { error } = await supabase.from("studios").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Studio supprimé"); onChange(); loadFull(); }
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
          {submitting && coverFile && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Couverture</span><span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <Button type="submit" disabled={submitting}>
            <Upload className="h-4 w-4 mr-2" /> {submitting ? `Création… ${coverFile ? progress + "%" : ""}` : "Créer le studio"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl mb-4">Studios existants</h2>
        <div className="space-y-3">
          {full.map(s => (
            <div key={s.id} className="p-3 border border-border rounded-sm space-y-2">
              <div className="flex items-center justify-between gap-3">
                <InlineEdit value={s.name} onSave={(n) => rename(s.id, n)} />
                <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <ThumbnailEdit
                bucket="studio-covers"
                currentUrl={s.cover_url}
                onUploaded={(url) => updateCover(s.id, url)}
                label="Couverture"
              />
            </div>
          ))}
          {full.length === 0 && <p className="text-sm text-muted-foreground">Aucun studio.</p>}
        </div>
      </Card>
    </>
  );
};

export default StudioManager;
