import { fmtKg } from "@/lib/units";
import { AppShell } from "@/components/marvi/AppShell";
import { useGuardians, useAdoptGuardian, useSponsorAdoptions, type AdoptionWithProfiles } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/marvi-queries";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, Crown, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const Patrocinios = () => {
  const { user, role } = useAuth();
  const { data: me } = useMyProfile();
  const { data: guardians, isLoading } = useGuardians();
  const { data: adoptions } = useSponsorAdoptions();
  const adopt = useAdoptGuardian();

  const topGuardians = (guardians ?? [])
    .filter((g) => !g.brand_name) // excluye marcas
    .sort((a, b) => (Number(b.total_tons) * 2 + b.zones_owned) - (Number(a.total_tons) * 2 + a.zones_owned))
    .slice(0, 4);

  const adoptionsByGuardian = new Map<string, string[]>();
  adoptions?.forEach((a: AdoptionWithProfiles) => {
    const list = adoptionsByGuardian.get(a.guardian_id) ?? [];
    list.push(a.sponsor?.brand_name ?? a.sponsor?.display_name ?? "Marca");
    adoptionsByGuardian.set(a.guardian_id, list);
  });

  const handleAdopt = async (guardianId: string, name: string) => {
    try {
      await adopt.mutateAsync(guardianId);
      toast.success(`Adoptaste a ${name} como guardián patrocinado.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al adoptar";
      toast.error(msg);
    }
  };

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

        {/* CTA por rol */}
        {!user ? (
          <div className="glass-card rounded-4xl p-5 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <p className="text-sm text-deep">Inicia sesión como <b>Marca</b> para adoptar guardianes.</p>
            <Link to="/auth"><Button variant="hero">Crear cuenta de marca</Button></Link>
          </div>
        ) : role !== "sponsor" ? (
          <div className="glass-card rounded-4xl p-5 text-sm text-muted-foreground">
            Estás como <b className="text-deep">{role}</b>. Solo las cuentas con rol <b>Marca</b> pueden adoptar guardianes.
          </div>
        ) : (
          <div className="glass-card rounded-4xl p-5 bg-gradient-to-br from-primary/10 to-eco/10">
            <p className="text-sm text-deep">
              <Sparkles className="size-4 inline text-gold mr-1" />
              Eres <b>{me?.brand_name ?? me?.display_name}</b>. Adopta al guardián que represente tu marca.
            </p>
          </div>
        )}

        {/* Top performers */}
        <section className="space-y-3">
          <h2 className="font-display font-bold text-deep flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Guardianes destacados
          </h2>
          {isLoading ? (
            <div className="grid place-items-center py-8"><Loader2 className="size-6 text-primary animate-spin" /></div>
          ) : topGuardians.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Aún no hay guardianes activos.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topGuardians.map((g, i) => {
                const sponsors = adoptionsByGuardian.get(g.id);
                return (
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
                      {g.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <p className="font-bold text-deep truncate">{g.display_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mb-2">{g.badge}</p>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-primary font-bold">{fmtKg(g.total_tons)} kg</span>
                      <span className="text-muted-foreground">{g.zones_owned} zonas</span>
                    </div>
                    {sponsors && sponsors.length > 0 && (
                      <div className="text-[10px] bg-gold/20 text-deep px-2 py-1 rounded-md font-bold text-center truncate mb-2">
                        {sponsors.join(", ")}
                      </div>
                    )}
                    {role === "sponsor" && (
                      <Button
                        size="sm"
                        variant="sea"
                        className="w-full"
                        onClick={() => handleAdopt(g.id, g.display_name)}
                        disabled={adopt.isPending}
                      >
                        Adoptar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Marcas activas */}
        <section className="space-y-3">
          <h2 className="font-display font-bold text-deep flex items-center gap-2">
            <Crown className="size-4 text-gold" /> Adopciones activas
          </h2>
          {(adoptions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Ninguna marca ha adoptado a un guardián aún. ¡Sé la primera!
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {adoptions?.map((a: AdoptionWithProfiles) => (
                <div key={a.id} className="glass-card rounded-3xl p-4 flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-gradient-coral grid place-items-center text-white font-display font-bold">
                    {(a.sponsor?.brand_name ?? a.sponsor?.display_name ?? "??").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-deep truncate">{a.sponsor?.brand_name ?? a.sponsor?.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      adoptó a <b className="text-primary">{a.guardian?.display_name}</b>
                      {a.guardian && ` (${fmtKg(a.guardian.total_tons)} kg)`}
                    </p>
                    {a.sponsor?.brand_tagline && (
                      <p className="text-[10px] text-muted-foreground italic truncate">"{a.sponsor.brand_tagline}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Patrocinios;
