import { useMarvi } from "@/lib/marvi-store";
import { Calendar, Flame, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const MissionPanel = () => {
  const events = useMarvi((s) => s.events);
  const liveEvent = events.find((e) => e.status === "live");
  const me = useMarvi((s) => s.me());

  if (!liveEvent) return null;
  const remaining = useCountdown(liveEvent.endsAt);

  return (
    <div className="glass-card rounded-4xl p-5 border-l-4 border-l-sea">
      <div className="flex items-start justify-between mb-3">
        <span className="bg-coral/15 text-coral text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
          <Flame className="size-3" /> Evento en vivo
        </span>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Cierra en</p>
          <p className="text-sm font-bold tabular-nums text-coral font-display">{remaining}</p>
        </div>
      </div>
      <h3 className="font-display text-xl font-bold text-deep leading-tight mb-1">
        {liveEvent.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{liveEvent.description}</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Mini icon={Trophy} label="Premio" value={liveEvent.prize} />
        <Mini icon={Calendar} label="Tu rango" value={`#${me.rank}`} />
      </div>
      <Link to="/eventos">
        <Button variant="hero" className="w-full">
          Ver torneo completo
        </Button>
      </Link>
    </div>
  );
};

const Mini = ({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) => (
  <div className="bg-white/60 rounded-2xl p-2.5">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
      <Icon className="size-3" /> {label}
    </div>
    <div className="text-sm font-bold text-deep truncate">{value}</div>
  </div>
);

function useCountdown(iso: string) {
  const end = new Date(iso).getTime();
  const diff = Math.max(0, end - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
}
