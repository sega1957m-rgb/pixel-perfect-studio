import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Play } from "lucide-react";

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container text-center relative z-10 py-20">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6 animate-fade-in">Studio · 2026</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
            La beauté <span className="text-gradient-gold italic">capturée</span>
            <br />image après image
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
            Une galerie cinématographique de photographies et de films en 4K, HD et qualité Studio.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-yellow-600 text-primary-foreground border-0 hover:opacity-90 shadow-[var(--shadow-gold)]">
              <Link to="/photos"><Camera className="h-4 w-4 mr-2" /> Voir les photos</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/videos"><Play className="h-4 w-4 mr-2" /> Voir les vidéos</Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none" style={{ background: "var(--gradient-fade)" }} />
      </section>

      {/* Sections */}
      <section className="container py-20 grid md:grid-cols-2 gap-6">
        <Link to="/photos" className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent group-hover:from-primary/30 transition-all" />
          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2">01 — Photographies</p>
            <h2 className="font-serif text-4xl mb-3">Albums</h2>
            <p className="text-muted-foreground text-sm">Explorez chaque collection regroupée par dossier. Zoom haute résolution disponible.</p>
          </div>
        </Link>
        <Link to="/videos" className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-card">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-900/30 to-transparent group-hover:from-yellow-900/50 transition-all" />
          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2">02 — Films</p>
            <h2 className="font-serif text-4xl mb-3">Vidéothèque</h2>
            <p className="text-muted-foreground text-sm">Filtrez par qualité — 4K, HD, Studio — et lancez le lecteur immersif.</p>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default Home;
