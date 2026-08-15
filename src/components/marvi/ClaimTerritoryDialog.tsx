import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClaimTerritory } from "@/lib/marvi-queries";
import { getCurrentPosition } from "@/hooks/useGeolocation";
import { toast } from "sonner";
import { Building2, Flag, Loader2, MapPin, Trees, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "coastal" | "urban" | "rural";
const KINDS: { id: Kind; label: string; icon: typeof Waves; hint: string }[] = [
  { id: "coastal", label: "Costera", icon: Waves, hint: "Playa, río, manglar" },
  { id: "urban", label: "Urbana", icon: Building2, hint: "Calles, barrios, parques" },
  { id: "rural", label: "Rural", icon: Trees, hint: "Sierra, vereda, finca" },
];

export const ClaimTerritoryDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const claim = useClaimTerritory();
  const [name, setName] = useState("");
  const [radius, setRadius] = useState("200");
  const [kind, setKind] = useState<Kind>("coastal");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const getGps = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.lat, lng: pos.lng });
      toast.success(`GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de GPS");
    } finally {
      setGpsLoading(false);
    }
  };

  const submit = async () => {
    if (!coords) return toast.error("Primero captura tu ubicación GPS.");
    if (!name.trim()) return toast.error("Ponle un nombre al territorio.");
    const r = await claim.mutateAsync({
      lat: coords.lat,
      lng: coords.lng,
      name: name.trim(),
      radiusM: Number(radius) || 200,
      kind,
    });
    if (r.ok) {
      toast.success(r.message);
      setName("");
      setCoords(null);
      onOpenChange(false);
    } else {
      toast.error(r.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-deep flex items-center gap-2">
            <Flag className="size-5 text-primary" /> Conquistar mi ubicación
          </DialogTitle>
          <DialogDescription>
            Sirve para playa, ciudad o campo. Tu GPS confirma que estás en el lugar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Ubicación GPS</Label>
            <Button
              onClick={getGps}
              variant={coords ? "outline" : "sea"}
              className="w-full"
              disabled={gpsLoading}
            >
              {gpsLoading ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (toca para refrescar)`
                : "Capturar mi ubicación"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Nombre del territorio</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Playa Norte de mi barrio"
              className="h-12 rounded-2xl"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Tipo de zona</Label>
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map((k) => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "rounded-2xl border-2 p-3 text-left transition-all",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <Icon className={cn("size-4 mb-1", active ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-sm font-bold text-deep">{k.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{k.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">
              Radio de protección (m)
            </Label>
            <Input
              type="number"
              min={50}
              max={1000}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="h-12 rounded-2xl"
            />
            <p className="text-[11px] text-muted-foreground">
              Entre 50 y 1000 m. Otros guardianes no podrán conquistar dentro salvo que te superen en kilos.
            </p>
          </div>

          <Button
            onClick={submit}
            variant="hero"
            size="xl"
            className="w-full"
            disabled={claim.isPending || !coords || !name.trim()}
          >
            {claim.isPending ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
            {claim.isPending ? "Conquistando…" : "Plantar bandera"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
