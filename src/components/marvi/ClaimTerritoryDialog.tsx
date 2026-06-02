import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClaimTerritory } from "@/lib/marvi-queries";
import { getCurrentPosition } from "@/hooks/useGeolocation";
import { toast } from "sonner";
import { Flag, Loader2, MapPin } from "lucide-react";

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
            Debes estar físicamente en el lugar. Tu GPS confirma la posición.
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
              Entre 50 y 1000 m. Otros guardianes no podrán conquistar dentro salvo que te superen en toneladas.
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
