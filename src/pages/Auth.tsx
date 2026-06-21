import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/photos";
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(redirectTo);
  }, [user, navigate, redirectTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez vos emails si la confirmation est activée.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email de réinitialisation envoyé. Vérifiez votre boîte.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté");
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "signin" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié";

  return (
    <div className="container max-w-md py-20">
      <Card className="p-8">
        <h1 className="font-serif text-3xl mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" && "Connectez-vous pour accéder aux photos et vidéos."}
          {mode === "signup" && "Créez un compte visiteur pour accéder au contenu."}
          {mode === "forgot" && "Entrez votre email pour recevoir un lien de réinitialisation."}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer le compte" : "Envoyer le lien"}
          </Button>
        </form>
        <div className="flex flex-col gap-2 mt-4 text-center">
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Mot de passe oublié ?
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {mode === "signin" ? "Pas de compte ? Créer un compte visiteur" : "Déjà inscrit ? Se connecter"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
