import { AlertTriangle } from "lucide-react";
import { useZones } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { daysSinceVisit, neglectedZones, NEGLECT_DAYS } from "@/lib/neglect";
import { cn } from "@/lib/utils";

export const NeglectWarning = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const { data: zones } = useZones();
  const risky = neglectedZones(zones, user?.id);

  if (!user || risky.length === 0) return null;

  return (
    <div className={cn("rounded-3xl border-2 border-gold/60 bg-gold/10 p-4", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 text-gold shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-display font-bold text-deep">
            ⚠️ Estás descuidando {risky.length === 1 ? "un territorio" : `${risky.length} territorios`}
          </p>
          <p className="text-xs text-muted-foreground">
            Llevas {NEGLECT_DAYS}+ días sin rondar. Un guardián con más kilos puede arrebatártelo.
          </p>
          <ul className="pt-1 space-y-1">
            {risky.slice(0, 4).map((z) => {
              const d = daysSinceVisit(z.last_visit);
              return (
                <li key={z.id} className="text-xs text-deep font-semibold">
                  📍 {z.name} · {d >= 999 ? "sin rondas" : `${d} días sin visita`}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
