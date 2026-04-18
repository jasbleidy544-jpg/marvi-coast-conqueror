import { AppShell } from "@/components/marvi/AppShell";
import { useMarvi } from "@/lib/marvi-store";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, Crown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Patrocinios = () => {
  const sponsors = useMarvi((s) => s.sponsors);
  const guardians = useMarvi((s) => s.guardians);
  const adopt = useMarvi((s) => s.adoptGuardian);

  // Top guardian by tons + zones (composite score)
  const topGuardians = [...guardians]
    .sort((a, b) => (b.totalTons * 2 + b.zonesOwned) - (a.totalTons * 2 + a.zonesOwned))
    .slice(0, 4);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <header>
          <div className="inline-flex items-center gap-2 bg-sand text-deep px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Building2 className="size-3.5" /> Marcas Locales · Santa Marta
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-deep">Panel de Patrocinios</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Las marcas pueden adoptar al guardián con más territorio y residuos recolectados.
            Tu logo aparece en su zona como respaldo oficial.
          </p>
        </header>

        {/* Top performers */}
        <section className="space-y-3">
          <h2 className="font-display font-bold text-deep flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Guardianes destacados (esta semana)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topGuardians.map((g, i) => (
              <div
                key={g.id}
                className={cn(
                  "glass-card rounded-3xl p-4 relative",
                  i === 0 && "ring-2 ring-gold shadow-glow",
                )}
              >
                {i === 0 && (
                  <div className="absolute -top-2 left-3 bg-gold text-deep text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Top
                  </div>
                )}
                <div className="size-12 rounded-2xl bg-gradient-sea grid place-items-center text-white font-bold mb-3">
                  {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <p className="font-bold text-deep truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground truncate mb-2">{g.badge}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-primary font-bold">{g.totalTons.toFixed(1)}t</span>
                  <span className="text-muted-foreground">{g.zonesOwned} zonas</span>
                </div>
                {g.sponsor && (
                  <div className="mt-2 text-[10px] bg-gold/20 text-deep px-2 py-1 rounded-md font-bold text-center truncate">
                    Adoptado por {g.sponsor}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sponsors */}
        <section className="space-y-3">
          <h2 className="font-display font-bold text-deep flex items-center gap-2">
            <Sparkles className="size-4 text-gold" /> Marcas activas
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {sponsors.map((s) => {
              const adopted = guardians.find((g) => g.id === s.adoptedGuardianId);
              return (
                <div key={s.id} className="glass-card rounded-4xl p-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "size-14 rounded-3xl grid place-items-center text-white font-display font-bold text-lg shrink-0",
                        s.color === "eco" && "bg-gradient-eco",
                        s.color === "sea" && "bg-gradient-sea",
                        s.color === "primary" && "bg-primary",
                        s.color === "gold" && "bg-gradient-coral",
                      )}
                    >
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-bold text-deep">{s.name}</h3>
                      <p className="text-sm text-muted-foreground">{s.tagline}</p>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-2xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Guardián adoptado
                    </p>
                    {adopted ? (
                      <div className="flex items-center gap-2">
                        <Crown className="size-4 text-gold" />
                        <span className="font-bold text-deep">{adopted.name}</span>
                        <span className="text-xs text-muted-foreground">· {adopted.totalTons.toFixed(2)}t</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sin guardián adoptado</p>
                    )}
                  </div>

                  <Button
                    variant="hero"
                    onClick={() => {
                      adopt(s.id, topGuardians[0].id);
                      toast.success(`${s.name} adoptó a ${topGuardians[0].name}`);
                    }}
                  >
                    Adoptar al líder de la semana
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Patrocinios;
