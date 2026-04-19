import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  title: string | null;
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

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => { reset(); }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.5, 5));
      if (e.key === "-") setZoom(z => Math.max(z - 0.5, 1));
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length]);

  const next = () => onChange((index + 1) % photos.length);
  const prev = () => onChange((index - 1 + photos.length) % photos.length);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(z => Math.min(5, Math.max(1, z + delta)));
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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 z-10" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-muted-foreground tracking-widest">
          {index + 1} / {photos.length} {photo.title && `· ${photo.title}`}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-2 hover:text-primary text-foreground" aria-label="Zoom -">
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="p-2 hover:text-primary text-foreground" aria-label="Zoom +">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={reset} className="p-2 hover:text-primary text-foreground" aria-label="Réinitialiser">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:text-primary text-foreground" aria-label="Fermer">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 z-10 p-3 rounded-full bg-background/40 hover:bg-primary/30 text-foreground"
        aria-label="Précédent"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Image */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          src={photo.url}
          alt={photo.title || ""}
          draggable={false}
          onClick={() => zoom === 1 && setZoom(2)}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        />
      </div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 z-10 p-3 rounded-full bg-background/40 hover:bg-primary/30 text-foreground"
        aria-label="Suivant"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

export default PhotoLightbox;
