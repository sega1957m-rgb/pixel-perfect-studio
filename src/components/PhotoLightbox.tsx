import { useEffect, useState, useRef, useCallback } from "react";
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
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photo = photos[index];

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  const showAndScheduleHide = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    reset();
    showAndScheduleHide();
  }, [index]);

  useEffect(() => {
    showAndScheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.5, 5));
      if (e.key === "-") setZoom(z => Math.max(z - 0.5, 1));
      if (e.key === "0") reset();
      showAndScheduleHide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, showAndScheduleHide]);

  const next = () => onChange((index + 1) % photos.length);
  const prev = () => onChange((index - 1 + photos.length) % photos.length);

  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(z => Math.min(5, Math.max(1, z + delta)));
    showAndScheduleHide();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    showAndScheduleHide();
    if (!dragging) return;
    setPan({ x: e.clientX - dragging.x, y: e.clientY - dragging.y });
  };
  const onMouseUp = () => setDragging(null);

  const onImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom === 1) {
      setZoom(2);
    } else {
      reset();
    }
    showAndScheduleHide();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onMouseMove={showAndScheduleHide}
    >
      <div
        className={`absolute top-0 inset-x-0 flex items-center justify-between p-4 pr-20 z-10 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm text-white/80 tracking-widest">
          {index + 1} / {photos.length} {photo.title && `· ${photo.title}`}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => { setZoom(z => Math.max(1, z - 0.5)); showAndScheduleHide(); }} className="p-2 text-white hover:text-primary" aria-label="Zoom -">
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-xs text-white/80 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => { setZoom(z => Math.min(5, z + 0.5)); showAndScheduleHide(); }} className="p-2 text-white hover:text-primary" aria-label="Zoom +">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={() => { reset(); showAndScheduleHide(); }} className="p-2 text-white hover:text-primary" aria-label="Réinitialiser">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className={`fixed top-4 right-4 z-[100] p-3 rounded-full border border-white/40 bg-black/60 text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300 shadow-2xl backdrop-blur-md ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="Fermer"
      >
        <X className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className={`absolute left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-primary/30 text-white transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="Précédent"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "zoom-out") : "zoom-in" }}
      >
        <img
          src={photo.url}
          alt={photo.title || ""}
          draggable={false}
          onClick={onImageClick}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        />
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className={`absolute right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-primary/30 text-white transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="Suivant"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

export default PhotoLightbox;
