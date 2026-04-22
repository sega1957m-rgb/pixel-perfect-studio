import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  video: { title: string; video_url: string; quality: string; description: string | null };
  onClose: () => void;
}

const VideoPlayer = ({ video, onClose }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[80] rounded-full border border-foreground/70 bg-background/85 p-3 text-foreground shadow-[var(--shadow-deep)] backdrop-blur-md transition-transform duration-200 hover:scale-105 hover:text-primary"
        aria-label="Fermer"
      >
        <X className="h-7 w-7" strokeWidth={2.75} />
      </button>
      <div className="w-full max-w-6xl" onClick={e => e.stopPropagation()}>
        <video
          src={video.video_url}
          controls
          autoPlay
          className="w-full aspect-video bg-black rounded-sm shadow-[var(--shadow-deep)]"
        />
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
