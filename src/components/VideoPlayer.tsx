import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUrl } from "@/hooks/useMediaUrl";

interface Props {
  video: { title: string; video_url: string; quality: string; description: string | null };
  onClose: () => void;
}

const VideoPlayer = ({ video, onClose }: Props) => {
  const { url, loading, error } = useMediaUrl(video.video_url);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.classList.add("viewer-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("viewer-open");
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <Button variant="outline" size="icon"
        onClick={onClose}
        className="fixed top-4 right-4 z-[80] rounded-full border border-foreground/70 bg-background/85 p-3 text-foreground shadow-[var(--shadow-deep)] backdrop-blur-md transition-transform duration-200 hover:scale-105 hover:text-primary"
        aria-label="Fermer"
      >
        <X className="h-7 w-7" strokeWidth={2.75} />
      </Button>
      <div className="w-full max-w-6xl" onClick={e => e.stopPropagation()}>
        {loading ? <div className="aspect-video flex items-center justify-center text-muted-foreground">Chargement…</div> : url && <video
          src={url}
          controls
          autoPlay
          playsInline
          onError={(event) => setPlaybackError(event.currentTarget.error?.code === 3 || event.currentTarget.error?.code === 4 ? "Cette vidéo est inaccessible ou son format n’est pas compatible avec ce navigateur." : "Impossible de charger la vidéo. Vérifiez votre connexion puis réessayez.")}
          onLoadedData={() => setPlaybackError(null)}
          className="w-full aspect-video bg-background rounded-sm shadow-[var(--shadow-deep)]"
        />}
        {(error || playbackError) && <p role="alert" className="mt-3 text-destructive">{playbackError || error?.message}</p>}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">{video.title}</h2>
            {video.description && <p className="text-sm text-muted-foreground mt-1">{video.description}</p>}
          </div>
          <span className="px-3 py-1 text-xs tracking-widest uppercase border border-primary/40 text-primary shrink-0">{video.quality}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
