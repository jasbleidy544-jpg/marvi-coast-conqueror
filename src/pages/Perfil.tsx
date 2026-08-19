import { AppShell } from "@/components/marvi/AppShell";
import { StatsBar } from "@/components/marvi/StatsBar";
import { Award, MapPinned, Sparkles, Crown, Shield, Waves, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyProfile, useZones } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const { user, signOut } = useAuth();
  const { data: me } = useMyProfile();
  const { data: zones } = useZones();
  const navigate = useNavigate();

  const myZones = zones?.filter((z) => z.guardian_id === user?.id) ?? [];
  const tons = Number(me?.total_tons ?? 0);

  const badges = [
    { icon: Crown, label: "Defensor de la Bahía", earned: myZones.length >= 1, tone: "sea" },
    { icon: Shield, label: "Guardián Oficial", earned: myZones.length > 0, tone: "eco" },
    { icon: Waves, label: "Mil kilos", earned: tons >= 1, tone: "sea" },
    { icon: Sparkles, label: "Rey de la Costa", earned: tons >= 10, tone: "gold" },
    { icon: MapPinned, label: "10 zonas", earned: myZones.length >= 10, tone: "eco" },
    { icon: Award, label: "Patrocinado", earned: !!me?.brand_name, tone: "gold" },
  ];

  const initials = me?.display_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <div className="glass-card rounded-4xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-sea opacity-10" />
          <div className="relative flex flex-col md:flex-row items-center gap-5">
            <div className="size-24 rounded-3xl bg-gradient-sea grid place-items-center text-white font-display font-bold text-3xl shadow-glow">
              {initials}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="font-display text-3xl font-bold text-deep">{me?.display_name ?? "Guardián"}</h1>
              <p className="text-muted-foreground">{me?.handle ?? user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-gold/20 text-deep px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                <Crown className="size-3.5" /> {me?.badge ?? "Aprendiz del Mar"}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={async () => { await signOut(); toast.success("Hasta pronto."); navigate("/"); }}
            >
              <LogOut className="size-4" /> Salir
            </Button>
          </div>
        </div>

        <StatsBar />

        <section className="glass-card rounded-4xl p-5">
          <h2 className="font-display font-bold text-deep mb-4 flex items-center gap-2">
            <Award className="size-4 text-gold" /> Insignias
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <div
                key={b.label}
                className={cn(
                  "rounded-3xl p-4 text-center transition-all",
                  b.earned ? "bg-white shadow-soft" : "bg-muted/50 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "size-12 mx-auto rounded-2xl grid place-items-center mb-2",
                    b.tone === "sea" && "bg-gradient-sea text-white",
                    b.tone === "eco" && "bg-gradient-eco text-white",
                    b.tone === "gold" && "bg-gradient-coral text-white",
                    !b.earned && "grayscale",
                  )}
                >
                  <b.icon className="size-5" />
                </div>
                <p className="text-xs font-bold text-deep">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-4xl p-5">
          <h2 className="font-display font-bold text-deep mb-4 flex items-center gap-2">
            <MapPinned className="size-4 text-primary" /> Mis territorios ({myZones.length})
          </h2>
          <div className="space-y-2">
            {myZones.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Aún no has conquistado zonas. Ve al mapa y reclama una.</p>
            )}
            {myZones.map((z) => (
              <div key={z.id} className="flex items-center justify-between p-3 bg-white/60 rounded-2xl">
                <div>
                  <p className="font-bold text-deep">{z.name}</p>
                  <p className="text-xs text-muted-foreground">{z.meters}m · territorio oficial</p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                    z.status === "protected" && "bg-eco/20 text-eco-foreground",
                    z.status === "vulnerable" && "bg-gold/20 text-deep",
                    z.status === "critical" && "bg-coral/20 text-coral",
                  )}
                >
                  {z.status === "protected" ? "Protegida" : z.status === "vulnerable" ? "Vulnerable" : "Crítica"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Perfil;
