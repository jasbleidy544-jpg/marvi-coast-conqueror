import { fmtKg } from "@/lib/units";
import { Crown, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuardians } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";

export const LeaderboardMini = ({ limit = 5 }: { limit?: number }) => {
  const { data: guardians, isLoading } = useGuardians();
  const { user } = useAuth();
  const sorted = (guardians ?? []).slice(0, limit);

  return (
    <div className="glass-card rounded-4xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-deep flex items-center gap-2">
          <Trophy className="size-4 text-gold" /> Líderes de la Costa
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">por kilos</span>
      </div>
      {isLoading ? (
        <div className="py-6 grid place-items-center"><Loader2 className="size-5 text-primary animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Sé el primer guardián de la costa.
        </p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((g, i) => (
            <div
              key={g.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-2xl transition-colors",
                g.id === user?.id && "bg-primary/10 ring-1 ring-primary/20",
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
                <p className="text-sm font-bold text-deep truncate">{g.display_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{g.badge}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-primary">{fmtKg(g.total_tons)} kg</p>
                <p className="text-[10px] text-muted-foreground">{g.zones_owned} zonas</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
