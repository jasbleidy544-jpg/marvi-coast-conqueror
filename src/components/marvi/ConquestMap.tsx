import { useState } from "react";
import { useMarvi } from "@/lib/marvi-store";
import { BeachZone, statusColor } from "@/lib/marvi-data";
import coastImg from "@/assets/coast-map.jpg";
import { ZoneSheet } from "./ZoneSheet";
import { cn } from "@/lib/utils";
import { Waves, ShieldAlert, Crown } from "lucide-react";

export const ConquestMap = () => {
  const zones = useMarvi((s) => s.zones);
  const guardianOf = useMarvi((s) => s.guardianOf);
  const meId = useMarvi((s) => s.meId);
  const [selected, setSelected] = useState<BeachZone | null>(null);

  return (
    <>
      <div className="relative w-full aspect-[16/10] md:aspect-[16/9] rounded-4xl overflow-hidden glass-card border-white/60">
        {/* Map background */}
        <img
          src={coastImg}
          alt="Costa de Santa Marta"
          width={1536}
          height={1024}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-sand/20 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sea)/0.10),transparent_55%)]" />

        {/* Map label */}
        <div className="absolute top-4 left-4 glass-card-strong rounded-2xl px-3 py-1.5 flex items-center gap-2">
          <Waves className="size-4 text-primary" />
          <span className="text-xs font-semibold text-deep tracking-wide">SANTA MARTA · COSTA CARIBE</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 glass-card-strong rounded-2xl px-3 py-2 flex flex-col gap-1 text-[10px] font-semibold text-deep">
          <Legend dotClass="bg-coral shadow-coral" label="Crítica" />
          <Legend dotClass="bg-gold" label="Vulnerable" />
          <Legend dotClass="bg-eco shadow-eco" label="Protegida" />
        </div>

        {/* Zones */}
        {zones.map((zone) => {
          const tone = statusColor(zone.status);
          const isMine = zone.guardianId === meId;
          const owner = guardianOf(zone);
          return (
            <button
              key={zone.id}
              onClick={() => setSelected(zone)}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none",
                "transition-transform duration-300 hover:scale-110 active:scale-95",
              )}
            >
              <div
                className={cn(
                  "relative size-12 md:size-16 rounded-2xl border-2 backdrop-blur-md flex items-center justify-center -rotate-6",
                  tone === "coral" && "bg-coral/30 border-coral animate-pulse-glow",
                  tone === "gold" && "bg-gold/30 border-gold",
                  tone === "eco" && "bg-eco/30 border-eco shadow-eco",
                )}
              >
                {tone === "coral" && <ShieldAlert className="size-5 md:size-6 text-coral-foreground" />}
                {tone === "eco" && <Crown className="size-5 md:size-6 text-eco-foreground" />}
                {tone === "gold" && <Waves className="size-5 md:size-6 text-deep" />}
                {isMine && (
                  <span className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-primary border-2 border-white" />
                )}
              </div>
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap glass-card-strong rounded-full px-2 py-0.5 text-[10px] font-bold text-deep",
                  "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                )}
              >
                {zone.name}
                {owner && <span className="text-muted-foreground font-medium ml-1">· {owner.name}</span>}
              </div>
            </button>
          );
        })}

        {/* Sheen */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
      </div>

      <ZoneSheet zone={selected} onClose={() => setSelected(null)} />
    </>
  );
};

const Legend = ({ dotClass, label }: { dotClass: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={cn("size-2 rounded-full", dotClass)} />
    <span>{label}</span>
  </div>
);
