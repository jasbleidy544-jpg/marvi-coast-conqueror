import { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useZones, useGuardians } from "@/lib/marvi-queries";
import { Zone, ZoneKind, statusHex, statusLabel } from "@/lib/marvi-types";
import { useAuth } from "@/hooks/useAuth";
import { ZoneSheet } from "./ZoneSheet";
import { Waves, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CENTER: [number, number] = [11.24, -74.05];

type KindFilter = "all" | ZoneKind;

const kindLabel = (k: ZoneKind) =>
  k === "coastal" ? "Costera" : k === "urban" ? "Urbana" : "Rural";

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "coastal", label: "Costeras" },
  { value: "urban", label: "Urbanas" },
  { value: "rural", label: "Rurales" },
];

// Build a divIcon for urban (square) and rural (diamond) markers.
const makeShapeIcon = (kind: "urban" | "rural", color: string, mine: boolean) => {
  const size = 22;
  const border = mine ? "#0ea5e9" : "rgba(255,255,255,0.9)";
  const borderWidth = mine ? 3 : 2;
  const shapeStyle =
    kind === "urban"
      ? `width:${size}px;height:${size}px;border-radius:4px;`
      : `width:${size}px;height:${size}px;transform:rotate(45deg);border-radius:3px;`;
  return L.divIcon({
    className: "marvi-shape-icon",
    html: `<div style="${shapeStyle}background:${color};border:${borderWidth}px solid ${border};box-shadow:0 2px 6px rgba(0,0,0,0.25);opacity:0.9"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const ConquestMap = () => {
  const { data: zones, isLoading } = useZones();
  const { data: guardians } = useGuardians();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Zone | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const guardianMap = useMemo(() => {
    const m = new Map<string, string>();
    guardians?.forEach((g) => m.set(g.id, g.display_name));
    return m;
  }, [guardians]);

  const filtered = useMemo(
    () => zones?.filter((z) => kindFilter === "all" || z.kind === kindFilter) ?? [],
    [zones, kindFilter]
  );

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

          {filtered.map((zone) => {
            const isMine = zone.guardian_id === user?.id;
            const color = statusHex(zone.status);
            const ownerName = zone.guardian_id ? guardianMap.get(zone.guardian_id) : null;
            const tooltip = (
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs">
                  <p className="font-bold text-deep">{zone.name}</p>
                  <p className="text-muted-foreground">
                    {kindLabel(zone.kind)} · {statusLabel(zone.status)} · {zone.meters}m
                  </p>
                  {ownerName && <p className="text-primary font-semibold">👑 {ownerName}</p>}
                </div>
              </Tooltip>
            );

            if (zone.kind === "coastal") {
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
                  {tooltip}
                </CircleMarker>
              );
            }

            return (
              <Marker
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={makeShapeIcon(zone.kind as "urban" | "rural", color, isMine)}
                eventHandlers={{ click: () => setSelected(zone) }}
              >
                {tooltip}
              </Marker>
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

        {/* Kind filter pills */}
        <div className="absolute bottom-4 left-4 z-[400] flex flex-wrap gap-1.5 max-w-[70%]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setKindFilter(f.value)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold transition-all backdrop-blur-md border",
                kindFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-white/70 text-deep border-white/60 hover:bg-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 z-[400] glass-card-strong rounded-2xl px-3 py-2 flex flex-col gap-1 text-[10px] font-semibold text-deep pointer-events-none">
          <Legend color="#f43f5e" label="Crítica" />
          <Legend color="#f5b301" label="Vulnerable" />
          <Legend color="#22c55e" label="Protegida" />
          <Legend color="#0ea5e9" label="Tu zona" />
          <div className="h-px bg-deep/10 my-1" />
          <ShapeLegend shape="circle" label="Costera" />
          <ShapeLegend shape="square" label="Urbana" />
          <ShapeLegend shape="diamond" label="Rural" />
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

const ShapeLegend = ({ shape, label }: { shape: "circle" | "square" | "diamond"; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span
      className="size-2.5 bg-deep/70"
      style={{
        borderRadius: shape === "circle" ? "9999px" : shape === "square" ? "2px" : "1px",
        transform: shape === "diamond" ? "rotate(45deg)" : undefined,
      }}
    />
    <span>{label}</span>
  </div>
);
