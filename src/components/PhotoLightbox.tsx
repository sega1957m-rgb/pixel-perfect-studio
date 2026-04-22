import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  title: string | null;
  type?: "image" | "video";
}

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}

const PhotoLightbox = ({ photos, index, onClose, onChange }: Props) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);

  const photo = photos[index];
  const isVideo = photo?.type === "video" || /\.(mp4|webm|mov|ogg)(\?|$)/i.test(photo?.url || "");

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    reset();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
      if (!isVideo) {
        if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 5));
        if (e.key === "-") setZoom((z) => Math.max(z - 0.5, 1));
        if (e.key === "0") reset();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, isVideo, onClose, onChange, photos.length]);

  const next = () => onChange((index + 1) % photos.length);
  const prev = () => onChange((index - 1 + photos.length) % photos.length);

  const onWheel = (e: React.WheelEvent) => {
    if (isVideo) return;
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((z) => Math.min(5, Math.max(1, z + delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragging.x, y: e.clientY - dragging.y });
  };

  const onMouseUp = () => setDragging(null);

  const onImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVideo) return;
    if (zoom === 1) setZoom(2);
    else reset();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/95 backdrop-blur-sm" onClick={onClose}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 z-[340] rounded-full border border-foreground/70 bg-background/85 p-3 text-foreground shadow-[var(--shadow-deep)] backdrop-blur-md transition-transform duration-200 hover:scale-105"
        aria-label="Fermer"
      >
        <X className="h-7 w-7" strokeWidth={2.75} />
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="fixed left-4 top-1/2 z-[320] -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-foreground shadow-[var(--shadow-deep)] backdrop-blur-md transition-transform duration-200 hover:scale-105"
          aria-label="Précédent"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <div
        className="flex h-full w-full items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: isVideo ? "default" : zoom > 1 ? (dragging ? "grabbing" : "zoom-out") : "zoom-in" }}
      >
        {isVideo ? (
          <video
            src={photo.url}
            controls
            autoPlay
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={photo.url}
            alt={photo.title || ""}
            draggable={false}
            onClick={onImageClick}
            className="max-h-full max-w-full select-none object-contain transition-transform duration-200"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
        )}
      </div>

      {!isVideo && (
        <div
          className="fixed bottom-4 left-1/2 z-[320] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/85 px-3 py-2 text-foreground shadow-[var(--shadow-deep)] backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="p-2 transition-colors hover:text-primary" aria-label="Zoom -">
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(5, z + 0.5))} className="p-2 transition-colors hover:text-primary" aria-label="Zoom +">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={reset} className="p-2 transition-colors hover:text-primary" aria-label="Reset">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      )}

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="fixed right-4 top-1/2 z-[320] -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-foreground shadow-[var(--shadow-deep)] backdrop-blur-md transition-transform duration-200 hover:scale-105"
          aria-label="Suivant"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default PhotoLightbox;
