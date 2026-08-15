import { fmtKg } from "@/lib/units";
import { AppShell } from "@/components/marvi/AppShell";
import { Crown, Trophy, Waves, MapPinned, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuardians } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";

const Ranking = () => {
  const { data: guardians, isLoading } = useGuardians();
  const { user } = useAuth();
  const sorted = guardians ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 bg-gold/15 text-deep px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Trophy className="size-3.5" /> Hall of Guardians
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-deep">Ranking de la Costa</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            La regla de oro: gana quien recoja más kilos de residuos.
          </p>
        </header>

        {isLoading ? (
          <div className="grid place-items-center py-12"><Loader2 className="size-8 text-primary animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aún no hay guardianes registrados.</p>
        ) : (
          <>
            {sorted.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 items-end">
                {[1, 0, 2].map((idx) => {
                  const g = sorted[idx];
                  if (!g) return <div key={idx} />;
                  const heights = ["h-24", "h-32", "h-20"];
                  const colors = ["bg-muted", "bg-gradient-coral", "bg-coral/30"];
                  return (
                    <div key={g.id} className="flex flex-col items-center gap-2">
                      <div className="size-14 rounded-full bg-gradient-sea grid place-items-center text-white font-display font-bold shadow-glow">
                        {g.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <p className="text-xs font-bold text-deep text-center truncate w-full">{g.display_name}</p>
                      <div
                        className={cn(
                          "w-full rounded-t-2xl flex items-center justify-center text-white font-display font-bold",
                          heights[idx === 1 ? 1 : idx === 0 ? 0 : 2],
                          colors[idx === 1 ? 1 : idx === 0 ? 0 : 2],
                        )}
                      >
                        {idx === 1 ? <Crown className="size-7" /> : <span className="text-2xl">{idx + 1}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="glass-card rounded-4xl p-2">
              {sorted.map((g, i) => (
                <div
                  key={g.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-3xl transition-colors",
                    g.id === user?.id && "bg-primary/10",
                    i !== sorted.length - 1 && "border-b border-border/40",
                  )}
                >
                  <div className="w-8 text-center font-display font-bold text-muted-foreground tabular-nums">
                    {i + 1}
                  </div>
                  <div className="size-11 rounded-2xl bg-gradient-sea grid place-items-center text-white font-bold shrink-0">
                    {g.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-deep truncate">{g.display_name}</p>
                      {g.brand_name && (
                        <span className="text-[10px] bg-gold/20 text-deep px-1.5 py-0.5 rounded-md font-bold uppercase">
                          {g.brand_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Award className="size-3" /> {g.badge ?? "Aprendiz"}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPinned className="size-3" /> {g.zones_owned}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-primary tabular-nums">
                      {fmtKg(g.total_tons)}<span className="text-xs text-muted-foreground ml-0.5">kg</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Waves className="size-2.5" /> recolectado
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Ranking;
