import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadWithProgress } from "@/lib/uploadWithProgress";
import { Progress } from "@/components/ui/progress";

interface Props {
  bucket: "thumbnails" | "studio-covers" | "photos";
  currentUrl: string | null;
  onUploaded: (url: string, path: string) => Promise<void> | void;
  label?: string;
}

const ThumbnailEdit = ({ bucket, currentUrl, onUploaded, label = "Miniature" }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { publicUrl } = await uploadWithProgress(bucket, path, file, setProgress);
      await onUploaded(publicUrl, path);
      toast.success(`${label} mise à jour`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <img src={currentUrl} alt="" className="h-12 w-16 object-cover rounded-sm border border-border" />
      ) : (
        <div className="h-12 w-16 flex items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> {progress}%
            </span>
          ) : (
            `Changer ${label.toLowerCase()}`
          )}
        </button>
        {uploading && <Progress value={progress} className="h-1 mt-1" />}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
};

export default ThumbnailEdit;
