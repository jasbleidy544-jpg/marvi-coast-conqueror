import { useMarvi } from "@/lib/marvi-store";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const LeaderboardMini = ({ limit = 5 }: { limit?: number }) => {
  const guardians = useMarvi((s) => s.guardians);
  const meId = useMarvi((s) => s.meId);
  const sorted = [...guardians].sort((a, b) => b.totalTons - a.totalTons).slice(0, limit);

  return (
    <div className="glass-card rounded-4xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-deep flex items-center gap-2">
          <Trophy className="size-4 text-gold" /> Líderes de la Costa
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">por toneladas</span>
      </div>
      <div className="space-y-2.5">
        {sorted.map((g, i) => (
          <div
            key={g.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-2xl transition-colors",
              g.id === meId && "bg-primary/10 ring-1 ring-primary/20",
            )}
          >
            <div
              className={cn(
                "size-8 rounded-xl grid place-items-center font-display font-bold text-sm shrink-0",
                i === 0 && "bg-gold/30 text-deep",
                i === 1 && "bg-muted text-deep",
                i === 2 && "bg-coral/20 text-deep",
                i > 2 && "bg-secondary text-muted-foreground",
              )}
            >
              {i === 0 ? <Crown className="size-4" /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-deep truncate">{g.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{g.badge}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums text-primary">{g.totalTons.toFixed(2)}t</p>
              <p className="text-[10px] text-muted-foreground">{g.zonesOwned} zonas</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
