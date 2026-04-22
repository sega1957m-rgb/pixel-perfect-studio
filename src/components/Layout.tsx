import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Film, LogOut, Settings } from "lucide-react";

const Layout = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm tracking-widest uppercase transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="grain min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border lb-hide">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Film className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-serif text-xl tracking-wide">Lumière</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" end className={navClass}>Accueil</NavLink>
            <NavLink to="/photos" className={navClass}>Photos</NavLink>
            <NavLink to="/videos" className={navClass}>Vidéos</NavLink>
            <NavLink to="/studios" className={navClass}>Studios</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <Settings className="h-4 w-4 mr-1" /> Admin
              </Button>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-0">
        <Outlet />
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="container text-center text-xs text-muted-foreground tracking-widest uppercase">
          © Lumière — Studio cinématographique
        </div>
      </footer>
    </div>
  );
};

export default Layout;
