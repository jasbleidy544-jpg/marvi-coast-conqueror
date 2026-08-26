import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Tooltip, ZoomControl, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useZones, useGuardians } from "@/lib/marvi-queries";
import { Zone, statusHex, statusLabel } from "@/lib/marvi-types";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { ZoneSheet } from "./ZoneSheet";
import { ClaimTerritoryDialog } from "./ClaimTerritoryDialog";
import { useRunTracker } from "@/hooks/useRunTracker";
import { Button } from "@/components/ui/button";
import { Waves, Loader2, Flag, LogIn, Play, Square, Footprints } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const CENTER: [number, number] = [11.18, -74.13];

const FollowRunner = ({ position }: { position: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16), { animate: true });
  }, [position, map]);
  return null;
};

export const ConquestMap = () => {
  const { data: zones, isLoading } = useZones();
  const { data: guardians } = useGuardians();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Zone | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  const run = useRunTracker({
    onZoneChange: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["guardians"] });
    },
    onMessage: (msg, ok) => (ok ? toast.success(msg) : toast.message(msg)),
  });

  const guardianMap = useMemo(() => {
    const m = new Map<string, string>();
    guardians?.forEach((g) => m.set(g.id, g.display_name));
    return m;
  }, [guardians]);

  if (isLoading) {
    return (
      <div className="w-full h-[75dvh] md:h-[80dvh] rounded-4xl glass-card grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  const km = (run.distance / 1000).toFixed(2);

  return (
    <>
      <div className="relative w-full h-[75dvh] md:h-[80dvh] min-h-[420px] rounded-4xl overflow-hidden glass-card border-white/60">
        <MapContainer
          center={CENTER}
          zoom={12}
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
          {run.running && <FollowRunner position={run.position} />}

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

          {/* Ruta de la carrera */}
          {run.path.length > 1 && (
            <Polyline
              positions={run.path.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: "#0ea5e9", weight: 5, opacity: 0.9 }}
            />
          )}
          {run.position && (
            <CircleMarker
              center={[run.position.lat, run.position.lng]}
              radius={7}
              pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0ea5e9", fillOpacity: 1 }}
            />
          )}
        </MapContainer>

        {/* Floating header */}
        <div className="absolute top-4 left-4 z-[400] glass-card-strong rounded-2xl px-3 py-1.5 flex items-center gap-2 pointer-events-none">
          <Waves className="size-4 text-primary" />
          <span className="text-xs font-semibold text-deep tracking-wide">
            MAPA LIBRE · CORRE Y CONQUISTA
          </span>
        </div>

        {/* Marcador de carrera en vivo */}
        {run.running && (
          <div className="absolute top-16 left-4 z-[400] glass-card-strong rounded-2xl px-3 py-2 text-[11px] font-bold text-deep flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-primary">
              <Footprints className="size-3.5" /> {km} km
            </span>
            <span className="flex items-center gap-1.5">
              <Flag className="size-3.5 text-eco" /> {run.conquered} zonas
            </span>
          </div>
        )}

        {/* Acciones */}
        <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-2 items-start">
          {user ? (
            <>
              {run.running ? (
                <Button onClick={run.stop} variant="destructive" size="lg" className="shadow-lg">
                  <Square className="size-4" /> Terminar carrera
                </Button>
              ) : (
                <Button onClick={run.start} variant="hero" size="lg" className="shadow-lg">
                  <Play className="size-4" /> Iniciar carrera
                </Button>
              )}
              <Button onClick={() => setClaimOpen(true)} variant="outline" size="sm" className="shadow-lg bg-background/90">
                <Flag className="size-4" /> Conquistar aquí
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="lg" className="shadow-lg">
                <LogIn className="size-4" /> Inicia sesión para correr
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
