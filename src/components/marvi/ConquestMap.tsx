import { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useZones, useGuardians } from "@/lib/marvi-queries";
import { Zone, statusHex, statusLabel } from "@/lib/marvi-types";
import { useAuth } from "@/hooks/useAuth";
import { ZoneSheet } from "./ZoneSheet";
import { Waves, Loader2 } from "lucide-react";

// Center on Santa Marta bay
const CENTER: [number, number] = [11.24, -74.18];

export const ConquestMap = () => {
  const { data: zones, isLoading } = useZones();
  const { data: guardians } = useGuardians();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Zone | null>(null);

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
          zoom={11}
          minZoom={9}
          maxZoom={16}
          zoomControl={false}
          scrollWheelZoom
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
              <CircleMarker
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.status === "protected" ? 14 : 12}
                pathOptions={{
                  color: isMine ? "#0ea5e9" : color,
                  weight: isMine ? 4 : 2,
                  fillColor: color,
                  fillOpacity: 0.65,
                }}
                eventHandlers={{ click: () => setSelected(zone) }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                  <div className="text-xs">
                    <p className="font-bold text-deep">{zone.name}</p>
                    <p className="text-muted-foreground">
                      {statusLabel(zone.status)} · {zone.meters}m
                    </p>
                    {ownerName && <p className="text-primary font-semibold">👑 {ownerName}</p>}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating header */}
        <div className="absolute top-4 left-4 z-[400] glass-card-strong rounded-2xl px-3 py-1.5 flex items-center gap-2 pointer-events-none">
          <Waves className="size-4 text-primary" />
          <span className="text-xs font-semibold text-deep tracking-wide">
            SANTA MARTA · COSTA CARIBE
          </span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 z-[400] glass-card-strong rounded-2xl px-3 py-2 flex flex-col gap-1 text-[10px] font-semibold text-deep pointer-events-none">
          <Legend color="#f43f5e" label="Crítica" />
          <Legend color="#f5b301" label="Vulnerable" />
          <Legend color="#22c55e" label="Protegida" />
          <Legend color="#0ea5e9" label="Tu zona" />
        </div>
      </div>

      <ZoneSheet zone={selected} onClose={() => setSelected(null)} />
    </>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);
