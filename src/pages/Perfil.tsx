import { AppShell } from "@/components/marvi/AppShell";
import { useMarvi } from "@/lib/marvi-store";
import { StatsBar } from "@/components/marvi/StatsBar";
import { Award, MapPinned, Sparkles, Crown, Shield, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const badges = [
  { icon: Crown, label: "Defensor de la Bahía", earned: true, tone: "sea" },
  { icon: Shield, label: "Centinela 7 días", earned: true, tone: "eco" },
  { icon: Waves, label: "Mil kilos", earned: true, tone: "sea" },
  { icon: Sparkles, label: "Rey de la Costa", earned: false, tone: "gold" },
  { icon: MapPinned, label: "10 zonas", earned: false, tone: "eco" },
  { icon: Award, label: "Patrocinado", earned: false, tone: "gold" },
];

const Perfil = () => {
  const me = useMarvi((s) => s.me());
  const zones = useMarvi((s) => s.zones).filter((z) => z.guardianId === me.id);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <div className="glass-card rounded-4xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-sea opacity-10" />
          <div className="relative flex flex-col md:flex-row items-center gap-5">
            <div className="size-24 rounded-3xl bg-gradient-sea grid place-items-center text-white font-display font-bold text-3xl shadow-glow">
              {me.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="font-display text-3xl font-bold text-deep">{me.name}</h1>
              <p className="text-muted-foreground">{me.handle}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-gold/20 text-deep px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                <Crown className="size-3.5" /> {me.badge}
              </div>
            </div>
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
            <MapPinned className="size-4 text-primary" /> Mis territorios ({zones.length})
          </h2>
          <div className="space-y-2">
            {zones.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Aún no has conquistado zonas. Ve al mapa y reclama una.</p>
            )}
            {zones.map((z) => (
              <div key={z.id} className="flex items-center justify-between p-3 bg-white/60 rounded-2xl">
                <div>
                  <p className="font-bold text-deep">{z.name}</p>
                  <p className="text-xs text-muted-foreground">{z.meters}m · racha {z.streak}/7</p>
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
