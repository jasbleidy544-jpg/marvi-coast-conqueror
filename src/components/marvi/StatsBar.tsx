import { Trophy, Waves, MapPinned } from "lucide-react";
import { useMyProfile, useZones, useGuardians } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { fmtKg } from "@/lib/units";

export const StatsBar = () => {
  const { user } = useAuth();
  const { data: me } = useMyProfile();
  const { data: zones } = useZones();
  const { data: guardians } = useGuardians();

  const meters = zones?.filter((z) => z.guardian_id === user?.id).reduce((a, z) => a + z.meters, 0) ?? 0;
  const totalTons = me?.total_tons ?? 0;
  const rank = guardians ? guardians.findIndex((g) => g.id === user?.id) + 1 : 0;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <Stat icon={Waves} label="Recolectado" value={fmtKg(totalTons)} unit="kg" tone="sea" />
      <Stat icon={MapPinned} label="Territorio" value={meters.toLocaleString()} unit="m" tone="eco" />
      <Stat icon={Trophy} label="Ranking" value={rank > 0 ? `#${rank}` : "—"} unit="" tone="gold" />
    </div>
  );
};

const Stat = ({
  icon: Icon, label, value, unit, tone,
}: {
  icon: typeof Trophy; label: string; value: string; unit: string; tone: "sea" | "eco" | "gold";
}) => {
  const ring =
    tone === "sea" ? "from-sea/15 to-primary/10 text-primary" :
    tone === "eco" ? "from-eco/15 to-eco/5 text-eco-foreground" :
    "from-gold/20 to-coral/10 text-deep";

  return (
    <div className="glass-card rounded-3xl p-3 md:p-4 flex flex-col gap-1 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <div className={`size-8 rounded-2xl bg-gradient-to-br ${ring} grid place-items-center`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="font-display text-xl md:text-3xl font-bold text-deep tabular-nums leading-none">
        {value}
        {unit && <span className="text-xs md:text-sm ml-1 text-muted-foreground font-medium">{unit}</span>}
      </div>
    </div>
  );
};
