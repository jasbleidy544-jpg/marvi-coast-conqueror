import { AppShell } from "@/components/marvi/AppShell";
import { useMarvi } from "@/lib/marvi-store";
import { Crown, Trophy, Waves, MapPinned, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const Ranking = () => {
  const guardians = useMarvi((s) => s.guardians);
  const meId = useMarvi((s) => s.meId);
  const sorted = [...guardians].sort((a, b) => b.totalTons - a.totalTons);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 bg-gold/15 text-deep px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Trophy className="size-3.5" /> Hall of Guardians
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-deep">Ranking de la Costa</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            La regla de oro: gana quien recoja más toneladas de residuos.
          </p>
        </header>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 items-end">
          {[1, 0, 2].map((idx) => {
            const g = sorted[idx];
            if (!g) return <div key={idx} />;
            const heights = ["h-24", "h-32", "h-20"];
            const colors = ["bg-muted", "bg-gradient-coral", "bg-coral/30"];
            return (
              <div key={g.id} className="flex flex-col items-center gap-2">
                <div className="size-14 rounded-full bg-gradient-sea grid place-items-center text-white font-display font-bold shadow-glow">
                  {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <p className="text-xs font-bold text-deep text-center truncate w-full">{g.name}</p>
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

        {/* List */}
        <div className="glass-card rounded-4xl p-2">
          {sorted.map((g, i) => (
            <div
              key={g.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-3xl transition-colors",
                g.id === meId && "bg-primary/10",
                i !== sorted.length - 1 && "border-b border-border/40",
              )}
            >
              <div className="w-8 text-center font-display font-bold text-muted-foreground tabular-nums">
                {i + 1}
              </div>
              <div className="size-11 rounded-2xl bg-gradient-sea grid place-items-center text-white font-bold shrink-0">
                {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-deep truncate">{g.name}</p>
                  {g.sponsor && (
                    <span className="text-[10px] bg-gold/20 text-deep px-1.5 py-0.5 rounded-md font-bold uppercase">
                      {g.sponsor}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="size-3" /> {g.badge}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPinned className="size-3" /> {g.zonesOwned}</span>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold text-primary tabular-nums">
                  {g.totalTons.toFixed(2)}<span className="text-xs text-muted-foreground ml-0.5">t</span>
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Waves className="size-2.5" /> recolectado
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Ranking;
