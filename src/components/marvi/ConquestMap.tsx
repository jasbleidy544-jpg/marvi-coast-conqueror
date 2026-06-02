import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useZones, useGuardians } from "@/lib/marvi-queries";
import { Zone, statusHex, statusLabel } from "@/lib/marvi-types";
import { useAuth } from "@/hooks/useAuth";
import { ZoneSheet } from "./ZoneSheet";
import { ClaimTerritoryDialog } from "./ClaimTerritoryDialog";
import { Button } from "@/components/ui/button";
import { Waves, Loader2, Flag, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

const CENTER: [number, number] = [11.24, -74.05];

export const ConquestMap = () => {
  const { data: zones, isLoading } = useZones();
  const { data: guardians } = useGuardians();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Zone | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  const guardianMap = useMemo(() => {
    const m = new Map<string, string>();
    guardians?.forEach((g) => m.set(g.id, g.display_name));
    return m;
  }, [guardians]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/10] md:aspect-[16/9] rounded-4xl glass-card grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full aspect-[16/10] md:aspect-[16/9] rounded-4xl overflow-hidden glass-card border-white/60">
        <MapContainer
          center={CENTER}
          zoom={10}
          minZoom={3}
          maxZoom={18}
          zoomControl={false}
          scrollWheelZoom
          worldCopyJump
          className="size-full z-0"
          style={{ background: "hsl(var(--background))" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />

          {zones?.map((zone) => {
            const isMine = zone.guardian_id === user?.id;
            const color = statusHex(zone.status);
            const ownerName = zone.guardian_id ? guardianMap.get(zone.guardian_id) : null;
            return (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius_m ?? 200}
                pathOptions={{
                  color: isMine ? "#0ea5e9" : color,
                  weight: isMine ? 4 : 2,
                  fillColor: color,
                  fillOpacity: 0.35,
                }}
                eventHandlers={{ click: () => setSelected(zone) }}
              >
                <Tooltip
                  permanent
                  direction="center"
                  className="!bg-white/90 !border-0 !shadow-md !rounded-xl !px-2 !py-1 !text-deep"
                >
                  <div className="text-[11px] leading-tight text-center">
                    <p className="font-bold">👑 Guardián {ownerName ?? "—"}</p>
                    <p className="text-muted-foreground">{zone.name} · {statusLabel(zone.status)}</p>
                  </div>
                </Tooltip>
              </Circle>
            );
          })}
        </MapContainer>

        {/* Floating header */}
        <div className="absolute top-4 left-4 z-[400] glass-card-strong rounded-2xl px-3 py-1.5 flex items-center gap-2 pointer-events-none">
          <Waves className="size-4 text-primary" />
          <span className="text-xs font-semibold text-deep tracking-wide">
            MAPA LIBRE · CONQUISTA TU ZONA
          </span>
        </div>

        {/* Conquer button */}
        <div className="absolute bottom-4 left-4 z-[400]">
          {user ? (
            <Button onClick={() => setClaimOpen(true)} variant="hero" size="lg" className="shadow-lg">
              <Flag className="size-4" /> Conquistar mi ubicación
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="lg" className="shadow-lg">
                <LogIn className="size-4" /> Inicia sesión para conquistar
              </Button>
            </Link>
          )}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 z-[400] glass-card-strong rounded-2xl px-3 py-2 flex flex-col gap-1 text-[10px] font-semibold text-deep pointer-events-none">
          <Legend color="#f43f5e" label="Crítica" />
          <Legend color="#f5b301" label="Vulnerable" />
          <Legend color="#22c55e" label="Protegida" />
          <Legend color="#0ea5e9" label="Tuya" />
        </div>
      </div>

      <ZoneSheet zone={selected} onClose={() => setSelected(null)} />
      <ClaimTerritoryDialog open={claimOpen} onOpenChange={setClaimOpen} />
    </>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);
