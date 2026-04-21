import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Wraps content that should only be visible to logged-in users.
 * Redirects anonymous visitors to /auth.
 */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    }
  }, [user, loading, navigate, location.pathname, location.search]);

  if (loading) return <div className="container py-20 text-muted-foreground">Chargement…</div>;
  if (!user) return null;
  return <>{children}</>;
};

export default RequireAuth;
