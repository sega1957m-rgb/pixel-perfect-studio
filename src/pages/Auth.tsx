import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin");
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez vos emails si la confirmation est activée.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté");
        navigate("/admin");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-20">
      <Card className="p-8">
        <h1 className="font-serif text-3xl mb-2">{mode === "signin" ? "Connexion" : "Créer un compte"}</h1>
        <p className="text-sm text-muted-foreground mb-6">Espace réservé aux administrateurs.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-xs text-muted-foreground hover:text-primary mt-4 w-full text-center"
        >
          {mode === "signin" ? "Pas de compte ? Créer un compte" : "Déjà inscrit ? Se connecter"}
        </button>
      </Card>
    </div>
  );
};

export default Auth;
