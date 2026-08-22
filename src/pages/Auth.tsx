import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Waves, Building2, Shield, Camera, Sparkles, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { AVATAR_SEEDS, generatedAvatar, uploadAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"guardian" | "sponsor">("guardian");
  const [brandName, setBrandName] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [seed, setSeed] = useState<string>(AVATAR_SEEDS[0]);
  const [welcome, setWelcome] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !welcome) navigate("/", { replace: true });
  }, [user, welcome, navigate]);

  const pickPhoto = (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("La foto debe pesar menos de 5 MB.");
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };


  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return toast.error("Tu correo aún no está confirmado. Intenta crear la cuenta de nuevo o contacta soporte.");
      }
      if (error.message.toLowerCase().includes("invalid login")) {
        return toast.error("Correo o contraseña incorrectos.");
      }
      return toast.error(error.message);
    }
    toast.success("¡Bienvenido de vuelta, guardián!");
    navigate("/", { replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: displayName || email.split("@")[0],
          role,
          brand_name: role === "sponsor" ? brandName : null,
          brand_tagline: role === "sponsor" ? brandTagline : null,
        },
      },
    });
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already")) {
        return toast.error("Ese correo ya está registrado. Intenta iniciar sesión.");
      }
      return toast.error(error.message);
    }
    // If no session returned (older accounts pending confirmation), force sign-in
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setLoading(false);
        return toast.error("Cuenta creada. Inicia sesión para continuar.");
      }
    }

    // Guardar avatar (foto subida o avatar generado)
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (uid) {
        const avatar_url = photo ? await uploadAvatar(uid, photo) : generatedAvatar(seed);
        await supabase.from("profiles").update({ avatar_url }).eq("id", uid);
      }
    } catch {
      toast.message("No pudimos guardar tu foto, puedes cambiarla luego en tu perfil.");
    }

    setLoading(false);
    setWelcome(true);
  };


  return (
    <div className="min-h-dvh bg-gradient-sand grid lg:grid-cols-2">
      {/* Left: brand */}
      <div className="hidden lg:flex relative bg-gradient-deep text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sea)/0.4),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-12 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
              <Waves className="size-6" />
            </div>
            <div>
              <p className="font-display text-3xl font-bold">MARVI</p>
              <p className="text-xs uppercase tracking-[0.3em] opacity-80">Guardianes de la Costa</p>
            </div>
          </div>
        </div>
        <div className="relative space-y-4">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Conquista la costa,<br />protege el mar.
          </h1>
          <p className="text-white/80 max-w-md">
            Cada kilo de basura que recolectas en Santa Marta te da poder para conquistar
            zonas de playa. Corre tu ronda, planta tu bandera y la zona es <b>oficialmente tuya</b> al instante.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md pt-4">
            <Stat n="15" l="zonas costeras" />
            <Stat n="0" l="días de espera" />
            <Stat n="∞" l="impacto real" />
          </div>
        </div>
        <div className="relative text-xs opacity-70">© MARVI · Santa Marta · Caribe</div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="size-12 rounded-2xl bg-gradient-sea grid place-items-center text-white">
              <Waves className="size-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-deep">MARVI</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Guardianes de la Costa
              </p>
            </div>
          </div>

          <Tabs defaultValue="signin" className="glass-card rounded-4xl p-6">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <Field label="Correo" type="email" value={email} onChange={setEmail} />
                <Field label="Contraseña" type="password" value={password} onChange={setPassword} />
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Entrando…" : "Entrar a la costa"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <RoleCard
                    active={role === "guardian"}
                    onClick={() => setRole("guardian")}
                    icon={<Shield className="size-4" />}
                    label="Guardián"
                    desc="Limpio playas"
                  />
                  <RoleCard
                    active={role === "sponsor"}
                    onClick={() => setRole("sponsor")}
                    icon={<Building2 className="size-4" />}
                    label="Marca"
                    desc="Patrocino guardianes"
                  />
                </div>
                <Field
                  label={role === "sponsor" ? "Nombre del responsable" : "Nombre público"}
                  value={displayName}
                  onChange={setDisplayName}
                />
                {role === "sponsor" && (
                  <>
                    <Field label="Nombre de la marca" value={brandName} onChange={setBrandName} />
                    <Field label="Tagline" value={brandTagline} onChange={setBrandTagline} />
                  </>
                )}

                {/* Foto o avatar */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-deep">
                    Tu foto o avatar 🐢
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="size-16 rounded-2xl overflow-hidden bg-gradient-sea grid place-items-center shrink-0">
                      <img
                        src={photoPreview ?? generatedAvatar(seed)}
                        alt="Vista previa del avatar"
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                      />
                      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
                        <Camera className="size-4" /> {photo ? "Cambiar foto" : "Subir foto"}
                      </Button>
                      {photo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                        >
                          Usar avatar generado
                        </Button>
                      )}
                    </div>
                  </div>
                  {!photo && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {AVATAR_SEEDS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSeed(s)}
                          className={cn(
                            "size-10 rounded-xl overflow-hidden border-2 transition-all",
                            seed === s ? "border-primary scale-105" : "border-transparent opacity-70",
                          )}
                        >
                          <img src={generatedAvatar(s)} alt={`Avatar ${s}`} className="size-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Field label="Correo" type="email" value={email} onChange={setEmail} />
                <Field label="Contraseña" type="password" value={password} onChange={setPassword} />

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Creando…" : "Unirme a MARVI"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-center text-xs text-muted-foreground">
            Al continuar aceptas el código de honor de los guardianes del mar.
          </p>
          <Link to="/" className="block text-center text-xs text-primary font-bold">
            ← Volver al mapa público
          </Link>
        </div>
      </div>

      {/* Bienvenida */}
      <Dialog open={welcome} onOpenChange={(o) => { if (!o) { setWelcome(false); navigate("/", { replace: true }); } }}>
        <DialogContent className="rounded-3xl max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-deep flex items-center justify-center gap-2">
              <PartyPopper className="size-6 text-gold" /> ¡Bienvenido, {displayName || "guardián"}!
            </DialogTitle>
            <DialogDescription>
              🌊 Ya eres parte de MARVI. Corre tu ronda, recoge residuos y planta tu bandera:
              cada kilo te da poder para conquistar territorios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 text-left text-sm text-deep bg-white/60 rounded-2xl p-3">
            <p>📍 Activa tu GPS para validar dónde limpias.</p>
            <p>🚩 Conquista una zona desde el mapa.</p>
            <p>📸 Sube evidencia de tu recolección.</p>
          </div>
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => { setWelcome(false); navigate("/", { replace: true }); }}
          >
            <Sparkles className="size-4" /> Empezar a conquistar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};


const Field = ({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold uppercase tracking-widest text-deep">{label}</Label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="h-12 rounded-2xl" />
  </div>
);

const RoleCard = ({
  active, onClick, icon, label, desc,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 rounded-2xl border-2 text-left transition-all ${
      active ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40"
    }`}
  >
    <div className={`flex items-center gap-1.5 font-bold text-sm ${active ? "text-primary" : "text-deep"}`}>
      {icon} {label}
    </div>
    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
  </button>
);

const Stat = ({ n, l }: { n: string; l: string }) => (
  <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
    <p className="font-display text-2xl font-bold">{n}</p>
    <p className="text-[10px] uppercase tracking-widest opacity-80">{l}</p>
  </div>
);

export default Auth;
