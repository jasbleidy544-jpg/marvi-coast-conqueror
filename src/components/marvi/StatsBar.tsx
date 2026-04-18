import { useMarvi } from "@/lib/marvi-store";
import { Trophy, Waves, MapPinned } from "lucide-react";

export const StatsBar = () => {
  const me = useMarvi((s) => s.me());
  const zones = useMarvi((s) => s.zones);
  const meters = zones.filter((z) => z.guardianId === me.id).reduce((acc, z) => acc + z.meters, 0);

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <Stat icon={Waves} label="Recolectado" value={`${me.totalTons.toFixed(2)}`} unit="t" tone="sea" />
      <Stat icon={MapPinned} label="Territorio" value={meters.toLocaleString()} unit="m²" tone="eco" />
      <Stat icon={Trophy} label="Ranking" value={`#${me.rank}`} unit="" tone="gold" />
    </div>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  unit: string;
  tone: "sea" | "eco" | "gold";
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
