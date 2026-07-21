import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import logo from "@/assets/logo.png";
import heroShop from "@/assets/hero-shop.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Connexion — BoutikBF" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsIframe(typeof window !== "undefined" && window.self !== window.top);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("boutikbf-theme");
      const isDarkTheme = saved !== "light";
      setIsDark(isDarkTheme || document.documentElement.classList.contains("dark"));
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setMousePos(mouseRef.current);
          rafRef.current = null;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const passwordRules = useMemo(
    () => [
      { label: "Minuscule (a-z)", test: (p: string) => /[a-z]/.test(p) },
      { label: "Majuscule (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
      { label: "Chiffre (0-9)", test: (p: string) => /[0-9]/.test(p) },
      { label: "Symbole (!@#$%...)", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
      { label: "6 caractères minimum", test: (p: string) => p.length >= 6 },
    ],
    [],
  );

  const passwordStrength = useMemo(() => {
    const passed = passwordRules.filter((r) => r.test(password)).length;
    if (password.length === 0) return { level: 0, label: "", color: "", bg: "" };
    if (passed <= 2) return { level: 1, label: "Faible", color: "text-red-500", bg: "bg-red-500" };
    if (passed <= 3)
      return { level: 2, label: "Moyen", color: "text-orange-500", bg: "bg-orange-500" };
    if (passed <= 4)
      return { level: 3, label: "Fort", color: "text-yellow-500", bg: "bg-yellow-500" };
    return { level: 4, label: "Très fort", color: "text-green-500", bg: "bg-green-500" };
  }, [password, passwordRules]);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError("Email invalide");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return toast.error("Email ou mot de passe incorrect");
      }
      return toast.error(error.message);
    }
    toast.success("Connecté");
    navigate({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError("Email invalide");
      return;
    }
    if (password !== confirmPassword) {
      return toast.error("Les mots de passe ne correspondent pas");
    }
    if (passwordStrength.level < 2) {
      return toast.error("Mot de passe trop faible");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé avec succès ! Bienvenue sur BoutikBF 🎉");
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined" && window.self !== window.top) {
        // En cas d'iframe (Preview AI Studio), Google bloque les redirections directes (X-Frame-Options: DENY).
        // On récupère l'URL d'authentification et on l'ouvre dans un nouvel onglet/popup.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + "/dashboard",
            skipBrowserRedirect: true,
          },
        });

        setLoading(false);

        if (error) {
          toast.error("Erreur de connexion Google : " + error.message);
          return;
        }

        if (data?.url) {
          const authWindow = window.open(data.url, "_blank");
          if (!authWindow) {
            toast.error(
              "Le bloqueur de fenêtres pop-up a bloqué l'ouverture. Veuillez l'autoriser ou ouvrir l'application dans un nouvel onglet.",
              { duration: 6000 },
            );
          } else {
            toast.info("Veuillez finaliser la connexion dans le nouvel onglet.");
          }
        }
      } else {
        // Hors iframe : redirection standard de Supabase
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin + "/dashboard" },
        });
        setLoading(false);
        if (error) {
          toast.error("Connexion Google impossible : " + error.message);
        }
      }
    } catch (err) {
      setLoading(false);
      toast.error("Une erreur s'est produite lors de la connexion Google.");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val.length > 0 && !isValidEmail(val)) {
      setEmailError("Format d'email invalide");
    } else {
      setEmailError("");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(resetEmail)) {
      toast.error("Veuillez entrer un email valide");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetSent(true);
    toast.success("Email de réinitialisation envoyé !");
  };

  const openResetDialog = () => {
    setResetEmail(email);
    setResetSent(false);
    setResetDialogOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      {/* Flag Top Line */}
      <div className="bf-flag-bar absolute inset-x-0 top-0 h-1.5 z-50" />

      {/* Ambient moving spotlight background */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        animate={{
          background: isDark
            ? `radial-gradient(650px circle at calc(50% + ${mousePos.x * 250}px) calc(50% + ${mousePos.y * 250}px), rgba(16, 185, 129, 0.08), rgba(252, 209, 22, 0.03) 40%, transparent 80%)`
            : `radial-gradient(650px circle at calc(50% + ${mousePos.x * 250}px) calc(50% + ${mousePos.y * 250}px), rgba(16, 185, 129, 0.04), rgba(252, 209, 22, 0.02) 40%, transparent 80%)`,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 28, mass: 0.1 }}
      />

      {/* Grid background lines */}
      <motion.div
        className={`absolute inset-0 bg-[size:40px_40px] pointer-events-none z-0 transition-opacity duration-500 ${
          isDark
            ? "opacity-10 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)]"
            : "opacity-30 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)]"
        }`}
        animate={{
          x: mousePos.x * 12,
          y: mousePos.y * 12,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 25, mass: 0.5 }}
      />

      {/* Burkina Faso red/gold/green theme glow orbs */}
      <motion.div
        className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] pointer-events-none z-0"
        animate={{
          x: mousePos.x * -30,
          y: mousePos.y * -30,
          scale: 1 + Math.abs(mousePos.x) * 0.05,
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.07)" : "rgba(16, 185, 129, 0.09)",
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full blur-[130px] pointer-events-none z-0"
        animate={{
          x: mousePos.x * 40,
          y: mousePos.y * 40,
          scale: 1 + Math.abs(mousePos.y) * 0.05,
          backgroundColor: isDark ? "rgba(252, 209, 22, 0.05)" : "rgba(252, 209, 22, 0.07)",
        }}
        transition={{ type: "spring", stiffness: 40, damping: 18 }}
      />

      <div className="grid min-h-screen md:grid-cols-12 relative z-10">
        {/* Left: image & value proposition side (7 cols) */}
        <div className="relative hidden overflow-hidden md:flex md:col-span-5 lg:col-span-6 flex-col justify-between p-12 text-white">
          <motion.img
            src={heroShop}
            alt="Commerce Burkinabè"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.15, filter: "brightness(0.35) contrast(1.05)" }}
            animate={{ scale: 1, filter: "brightness(0.4) contrast(1.02)" }}
            transition={{ duration: 20, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/80 via-black/45 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Header section on Left */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
              >
                <img
                  src={logo}
                  alt="BoutikBF"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="font-display text-2xl font-black tracking-wider text-white"
              >
                Boutik<span className="text-[#fcd116]">BF</span>
              </motion.span>
            </Link>
          </div>

          {/* Main Hero & Testimonial / Value prop section */}
          <div className="relative z-10 space-y-8 my-auto">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md shadow-inner"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                🇧🇫 Fait au Burkina Faso
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
              >
                Rejoignez plus de{" "}
                <span className="text-[#fcd116] underline decoration-amber-500 decoration-wavy decoration-2 underline-offset-4">
                  500+
                </span>{" "}
                commerçants
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-base text-white/80 leading-relaxed font-sans max-w-lg"
              >
                Boutiques, pharmacies, alimentations, quincailleries — tous digitalisés avec{" "}
                <span className="font-semibold text-emerald-400">BoutikBF</span>. Prenez le contrôle
                de vos ventes, de vos stocks et de vos clients.
              </motion.p>
            </div>

            {/* Micro-Features grid with beautiful details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="grid grid-cols-2 gap-6 border-t border-white/10 pt-8"
            >
              <div className="space-y-1">
                <span className="block text-2xl font-extrabold text-emerald-400">99.9%</span>
                <span className="block text-sm font-semibold text-white">Disponibilité Locale</span>
                <span className="text-xs text-white/50">Fonctionne même hors-ligne</span>
              </div>
              <div className="space-y-1">
                <span className="block text-2xl font-extrabold text-amber-400">F CFA</span>
                <span className="block text-sm font-semibold text-white">Prêt pour le Burkina</span>
                <span className="text-xs text-white/50">Factures conformes DGI</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Footer on Left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="relative z-10 text-xs text-white/50 border-t border-white/5 pt-4 flex justify-between items-center"
          >
            <span>© 2026 BoutikBF. Tous droits réservés.</span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Support Client 24/7
            </span>
          </motion.div>
        </div>

        {/* Right: form (5 cols) */}
        <div className="flex md:col-span-7 lg:col-span-6 flex-col justify-center px-6 py-10 relative md:px-12 lg:px-16 overflow-y-auto">
          {/* Top Back Home Button (Mobile layout) */}
          <div className="absolute top-6 left-6 md:left-12 lg:left-16 z-20">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors bg-secondary/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/50"
            >
              ← Retour à l'accueil
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-md mx-auto space-y-6 pt-10"
          >
            {/* Mobile Header Logo */}
            <div className="flex flex-col items-center text-center md:hidden mb-2">
              <img
                src={logo}
                alt="BoutikBF"
                width={56}
                height={56}
                className="h-14 w-14 object-contain mb-3 bg-secondary/80 p-2 rounded-2xl border border-border shadow"
              />
              <span className="font-display text-3xl font-extrabold tracking-wider">
                Boutik<span className="text-[#fcd116]">BF</span>
              </span>
            </div>

            <Card className="border-border/60 shadow-2xl backdrop-blur-md bg-card/75 relative overflow-hidden rounded-2xl">
              {/* Decorative accent flag line at the top of the card */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />

              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="font-display text-3xl font-extrabold tracking-tight">
                  Bienvenue
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground/80">
                  Connectez-vous ou créez votre boutique
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button
                  onClick={google}
                  variant="outline"
                  className="w-full relative py-5 border-border/80 hover:bg-secondary/70 hover:border-border transition-all duration-300 font-medium rounded-xl group shadow-sm flex items-center justify-center"
                  disabled={loading}
                >
                  <svg
                    className="mr-3.5 h-4.5 w-4.5 group-hover:scale-110 transition-transform duration-300"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuer avec Google
                </Button>

                {isIframe && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed shadow-sm">
                    ⚠️ <strong>Note pour l'aperçu AI Studio :</strong> Google bloque les connexions
                    dans les fenêtres intégrées (iframes). Si le bouton ci-dessus ne répond pas ou
                    affiche une erreur, veuillez{" "}
                    <a
                      href={`${window.location.origin}/auth`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
                    >
                      cliquer ici pour ouvrir l'application dans un nouvel onglet
                    </a>{" "}
                    puis réessayer.
                  </p>
                )}

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border/70"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    ou
                  </span>
                  <div className="flex-grow border-t border-border/70"></div>
                </div>

                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 p-1 bg-secondary/60 rounded-xl">
                    <TabsTrigger
                      value="signin"
                      className="rounded-lg py-2.5 font-medium transition-all"
                    >
                      Connexion
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-lg py-2.5 font-medium transition-all"
                    >
                      Inscription
                    </TabsTrigger>
                  </TabsList>

                  {/* ===== SIGN IN ===== */}
                  <TabsContent value="signin" className="mt-4 focus-visible:outline-none">
                    <form onSubmit={signIn} className="space-y-4" noValidate>
                      <div className="space-y-2">
                        <Label
                          htmlFor="si-email"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Email
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                          <Input
                            id="si-email"
                            type="email"
                            placeholder="exemple@email.com"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            className={`pl-10 h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all ${
                              emailError ? "border-red-500 focus-visible:ring-red-500/10" : ""
                            }`}
                            aria-invalid={!!emailError}
                            aria-describedby={emailError ? "si-email-error" : undefined}
                          />
                        </div>
                        {emailError && (
                          <p
                            id="si-email-error"
                            className="flex items-center gap-1.5 text-xs text-red-500 font-medium"
                          >
                            <AlertCircle className="h-3.5 w-3.5" /> {emailError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="si-password"
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            Mot de passe
                          </Label>
                          <button
                            type="button"
                            onClick={openResetDialog}
                            className="text-xs text-muted-foreground hover:text-emerald-500 hover:underline font-semibold transition-colors"
                          >
                            Mot de passe oublié ?
                          </button>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                          <Input
                            id="si-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 pr-10 h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 hover:from-emerald-700 hover:via-emerald-600 hover:to-amber-600 font-bold py-5 rounded-xl shadow-lg transition-all duration-300 transform active:scale-[0.98]"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Se connecter"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* ===== SIGN UP ===== */}
                  <TabsContent value="signup" className="mt-4 focus-visible:outline-none">
                    <form onSubmit={signUp} className="space-y-4" noValidate>
                      <div className="space-y-2">
                        <Label
                          htmlFor="su-name"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Nom complet
                        </Label>
                        <div className="relative group">
                          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                          <Input
                            id="su-name"
                            type="text"
                            placeholder="Votre nom complet"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="pl-10 h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="su-email"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Email
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                          <Input
                            id="su-email"
                            type="email"
                            placeholder="exemple@email.com"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            className={`pl-10 h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all ${
                              emailError ? "border-red-500 focus-visible:ring-red-500/10" : ""
                            }`}
                            aria-invalid={!!emailError}
                            aria-describedby={emailError ? "su-email-error" : undefined}
                          />
                        </div>
                        {emailError && (
                          <p
                            id="su-email-error"
                            className="flex items-center gap-1.5 text-xs text-red-500 font-medium"
                          >
                            <AlertCircle className="h-3.5 w-3.5" /> {emailError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="su-password"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Mot de passe
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                          <Input
                            id="su-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Créez un mot de passe sécurisé"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            required
                            minLength={6}
                            className="pl-10 pr-10 h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>

                        {/* Strength Indicator */}
                        {password.length > 0 && (
                          <div className="mt-1 space-y-1.5">
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i <= passwordStrength.level ? passwordStrength.bg : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className={`text-xs font-semibold ${passwordStrength.color}`}>
                              Mot de passe : {passwordStrength.label}
                            </p>
                          </div>
                        )}

                        {/* Checklist */}
                        {(password.length > 0 || passwordFocused) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2.5 space-y-1.5 rounded-xl border border-border/50 bg-muted/30 p-3.5 text-xs shadow-inner"
                          >
                            <p className="mb-2 font-semibold text-muted-foreground/90">
                              Critères de sécurité du mot de passe :
                            </p>
                            {passwordRules.map((rule) => {
                              const ok = rule.test(password);
                              return (
                                <div
                                  key={rule.label}
                                  className={`flex items-center gap-2 font-medium transition-colors ${
                                    ok
                                      ? "text-emerald-500 dark:text-emerald-400"
                                      : "text-muted-foreground/80"
                                  }`}
                                >
                                  {ok ? (
                                    <Check className="h-4 w-4 shrink-0 bg-emerald-500/15 p-0.5 rounded-full" />
                                  ) : (
                                    <X className="h-4 w-4 shrink-0 bg-muted-foreground/15 p-0.5 rounded-full" />
                                  )}
                                  <span>{rule.label}</span>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="su-confirm"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Confirmer le mot de passe
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                          <Input
                            id="su-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Répétez le mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={`pl-10 pr-10 h-11 border-border/80 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all ${
                              confirmPassword.length > 0 && !passwordsMatch
                                ? "border-red-500 focus-visible:ring-red-500/10"
                                : confirmPassword.length > 0 && passwordsMatch
                                  ? "border-emerald-500 focus-visible:ring-emerald-500/10"
                                  : ""
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showConfirmPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                        {confirmPassword.length > 0 && !passwordsMatch && (
                          <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" /> Les mots de passe ne
                            correspondent pas
                          </p>
                        )}
                        {confirmPassword.length > 0 && passwordsMatch && (
                          <p className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                            <Check className="h-3.5 w-3.5" /> Les mots de passe correspondent
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 hover:from-emerald-700 hover:via-emerald-600 hover:to-amber-600 font-bold py-5 rounded-xl shadow-lg transition-all duration-300 transform active:scale-[0.98]"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Créer mon compte"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Reset password dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Mot de passe oublié
            </DialogTitle>
            <DialogDescription>
              {resetSent
                ? "Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception."
                : "Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe."}
            </DialogDescription>
          </DialogHeader>

          {!resetSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary shadow-elegant"
                  disabled={resetLoading}
                >
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer le lien
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                <Mail className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p>
                  Un email a été envoyé à <strong>{resetEmail}</strong>
                </p>
                <p className="mt-1">
                  Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
