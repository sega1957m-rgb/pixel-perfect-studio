import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import StudioManager from "@/components/admin/StudioManager";
import StudioAssign from "@/components/admin/StudioAssign";
import StudioPicker from "@/components/admin/StudioPicker";

type Quality = "4K" | "Full HD" | "HD" | "SD";
type Album = { id: string; name: string; description: string | null; cover_url: string | null };
type Video = { id: string; title: string; quality: Quality };
type Studio = { id: string; name: string };

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);

  const [albumName, setAlbumName] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [photoStudioIds, setPhotoStudioIds] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoQuality, setVideoQuality] = useState<Quality>("HD");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoStudioIds, setVideoStudioIds] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const refresh = async () => {
    const [{ data: a }, { data: v }, { data: s }] = await Promise.all([
      supabase.from("albums").select("*").order("created_at", { ascending: false }),
      supabase.from("videos").select("id,title,quality").order("created_at", { ascending: false }),
      supabase.from("studios").select("id,name").order("name"),
    ]);
    setAlbums((a as Album[]) || []);
    setVideos((v as Video[]) || []);
    setStudios((s as Studio[]) || []);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const promoteSelf = async () => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    if (error) toast.error(error.message);
    else { toast.success("Vous êtes maintenant admin. Rechargez la page."); setTimeout(() => location.reload(), 800); }
  };

  if (loading) return <div className="container py-20">Chargement…</div>;

  if (!isAdmin) {
    return (
      <div className="container max-w-md py-20">
        <Card className="p-8 text-center">
          <h1 className="font-serif text-2xl mb-3">Accès admin requis</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Vous êtes connecté(e) mais n'avez pas le rôle administrateur.
            Le premier utilisateur peut s'auto-promouvoir.
          </p>
          <Button onClick={promoteSelf}>Devenir administrateur</Button>
        </Card>
      </div>
    );
  }

  const createAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("albums").insert({ name: albumName, description: albumDesc || null });
    if (error) toast.error(error.message);
    else { toast.success("Album créé"); setAlbumName(""); setAlbumDesc(""); refresh(); }
  };

  const deleteAlbum = async (id: string) => {
    if (!confirm("Supprimer cet album et toutes ses photos ?")) return;
    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); refresh(); }
  };

  const uploadPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbumId || !photoFiles?.length) return;
    setUploadingPhoto(true);
    try {
      const album = albums.find(a => a.id === selectedAlbumId);
      let firstUrl: string | null = null;
      for (const file of Array.from(photoFiles)) {
        const path = `${selectedAlbumId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
        if (!firstUrl) firstUrl = publicUrl;
        const { error: dbErr } = await supabase.from("photos").insert({
          album_id: selectedAlbumId, url: publicUrl, storage_path: path, title: file.name,
        });
        if (dbErr) throw dbErr;
      }
      if (album && !album.cover_url && firstUrl) {
        await supabase.from("albums").update({ cover_url: firstUrl }).eq("id", selectedAlbumId);
      }
      // Sync studio assignments for the album (add new ones, keep existing)
      if (photoStudioIds.length > 0) {
        const { data: existing } = await supabase
          .from("studio_albums").select("studio_id").eq("album_id", selectedAlbumId);
        const existingIds = new Set(((existing as any[]) || []).map(r => r.studio_id));
        const toAdd = photoStudioIds.filter(id => !existingIds.has(id))
          .map(sid => ({ album_id: selectedAlbumId, studio_id: sid }));
        if (toAdd.length > 0) {
          const { error: linkErr } = await supabase.from("studio_albums").insert(toAdd);
          if (linkErr) throw linkErr;
        }
      }
      toast.success(`${photoFiles.length} photo(s) ajoutée(s)`);
      setPhotoFiles(null);
      setPhotoStudioIds([]);
      (document.getElementById("photo-input") as HTMLInputElement).value = "";
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;
    setUploadingVideo(true);
    try {
      const vPath = `${crypto.randomUUID()}-${videoFile.name}`;
      const { error: vErr } = await supabase.storage.from("videos").upload(vPath, videoFile);
      if (vErr) throw vErr;
      const { data: { publicUrl: videoUrl } } = supabase.storage.from("videos").getPublicUrl(vPath);

      let thumbUrl: string | null = null;
      let thumbPath: string | null = null;
      if (thumbFile) {
        thumbPath = `${crypto.randomUUID()}-${thumbFile.name}`;
        const { error: tErr } = await supabase.storage.from("thumbnails").upload(thumbPath, thumbFile);
        if (tErr) throw tErr;
        thumbUrl = supabase.storage.from("thumbnails").getPublicUrl(thumbPath).data.publicUrl;
      }

      const { data: inserted, error: dbErr } = await supabase.from("videos").insert({
        title: videoTitle, description: videoDesc || null, quality: videoQuality,
        video_url: videoUrl, storage_path: vPath, thumbnail_url: thumbUrl, thumbnail_path: thumbPath,
      }).select("id").single();
      if (dbErr) throw dbErr;

      if (inserted && videoStudioIds.length > 0) {
        const rows = videoStudioIds.map(sid => ({ video_id: inserted.id, studio_id: sid }));
        const { error: linkErr } = await supabase.from("studio_videos").insert(rows);
        if (linkErr) throw linkErr;
      }

      toast.success("Vidéo ajoutée");
      setVideoTitle(""); setVideoDesc(""); setVideoFile(null); setThumbFile(null); setVideoStudioIds([]);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Supprimer cette vidéo ?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimée"); refresh(); }
  };

  return (
    <div className="container py-12 max-w-5xl">
      <h1 className="font-serif text-4xl mb-8">Console admin</h1>
      <Tabs defaultValue="photos">
        <TabsList>
          <TabsTrigger value="photos">Photos & albums</TabsTrigger>
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
          <TabsTrigger value="studios">Studios</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="space-y-8 mt-6">
          <Card className="p-6">
            <h2 className="font-serif text-xl mb-4">Créer un album</h2>
            <form onSubmit={createAlbum} className="space-y-3">
              <Input placeholder="Nom de l'album" value={albumName} onChange={e => setAlbumName(e.target.value)} required />
              <Textarea placeholder="Description (optionnel)" value={albumDesc} onChange={e => setAlbumDesc(e.target.value)} />
              <Button type="submit">Créer</Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-xl mb-4">Ajouter des photos</h2>
            <form onSubmit={uploadPhotos} className="space-y-3">
              <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
                <SelectTrigger><SelectValue placeholder="Choisir un album" /></SelectTrigger>
                <SelectContent>
                  {albums.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input id="photo-input" type="file" accept="image/*" multiple onChange={e => setPhotoFiles(e.target.files)} required />
              <StudioPicker studios={studios} selected={photoStudioIds} onChange={setPhotoStudioIds} label="Affecter à des studios (optionnel)" />
              <Button type="submit" disabled={uploadingPhoto || !selectedAlbumId}>
                <Upload className="h-4 w-4 mr-2" /> {uploadingPhoto ? "Envoi…" : "Uploader"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-xl mb-4">Albums existants</h2>
            <div className="space-y-3">
              {albums.map(a => (
                <div key={a.id} className="p-3 border border-border rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteAlbum(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <StudioAssign kind="album" itemId={a.id} studios={studios} />
                </div>
              ))}
              {albums.length === 0 && <p className="text-sm text-muted-foreground">Aucun album.</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-8 mt-6">
          <Card className="p-6">
            <h2 className="font-serif text-xl mb-4">Ajouter une vidéo</h2>
            <form onSubmit={uploadVideo} className="space-y-3">
              <Input placeholder="Titre" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} required />
              <Textarea placeholder="Description" value={videoDesc} onChange={e => setVideoDesc(e.target.value)} />
              <Select value={videoQuality} onValueChange={(v: any) => setVideoQuality(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4K">4K</SelectItem>
                  <SelectItem value="Full HD">Full HD</SelectItem>
                  <SelectItem value="HD">HD</SelectItem>
                  <SelectItem value="SD">SD</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <Label className="text-xs">Fichier vidéo</Label>
                <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} required />
              </div>
              <div>
                <Label className="text-xs">Miniature (image)</Label>
                <Input type="file" accept="image/*" onChange={e => setThumbFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={uploadingVideo}>
                <Upload className="h-4 w-4 mr-2" /> {uploadingVideo ? "Envoi…" : "Uploader la vidéo"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-xl mb-4">Vidéos existantes</h2>
            <div className="space-y-3">
              {videos.map(v => (
                <div key={v.id} className="p-3 border border-border rounded-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span>{v.title} <span className="text-xs text-primary ml-2">{v.quality}</span></span>
                    <Button variant="ghost" size="sm" onClick={() => deleteVideo(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <StudioAssign kind="video" itemId={v.id} studios={studios} />
                </div>
              ))}
              {videos.length === 0 && <p className="text-sm text-muted-foreground">Aucune vidéo.</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="studios" className="space-y-8 mt-6">
          <StudioManager studios={studios} onChange={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
