import { useState } from "react";
import { BeachZone, statusLabel, statusColor, canConquer } from "@/lib/marvi-data";
import { useMarvi } from "@/lib/marvi-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, Flag, Swords, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ZoneSheet = ({ zone, onClose }: { zone: BeachZone | null; onClose: () => void }) => {
  const guardianOf = useMarvi((s) => s.guardianOf);
  const me = useMarvi((s) => s.me());
  const conquerZone = useMarvi((s) => s.conquerZone);
  const reportCleanup = useMarvi((s) => s.reportCleanup);
  const checkInZone = useMarvi((s) => s.checkInZone);
  const [kilos, setKilos] = useState("");

  if (!zone) return null;
  const owner = guardianOf(zone);
  const isMine = owner?.id === me.id;
  const tone = statusColor(zone.status);
  const verdict = canConquer(me, owner);

  const handleConquer = () => {
    const r = conquerZone(zone.id);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
    if (r.ok) onClose();
  };

  const handleReport = () => {
    const k = Number(kilos);
    const r = reportCleanup(zone.id, k);
    if (r.ok) {
      toast.success(r.message);
      setKilos("");
    } else toast.error(r.message);
  };

  const handleCheckIn = () => {
    const r = checkInZone(zone.id);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
  };

  return (
    <Sheet open={!!zone} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 bg-gradient-sand border-l">
        <div
          className={cn(
            "h-32 relative",
            tone === "coral" && "bg-gradient-coral",
            tone === "gold" && "bg-gradient-to-r from-gold to-sand-deep",
            tone === "eco" && "bg-gradient-eco",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)] opacity-20" />
          <div className="absolute bottom-3 left-5 text-white">
            <Badge className="bg-white/25 hover:bg-white/25 backdrop-blur text-white border-white/40 mb-2">
              {statusLabel(zone.status).toUpperCase()}
            </Badge>
            <h2 className="font-display text-3xl font-bold">{zone.name}</h2>
            <p className="text-white/80 text-sm">{zone.meters} m de costa</p>
          </div>
        </div>

        <SheetHeader className="sr-only">
          <SheetTitle>{zone.name}</SheetTitle>
          <SheetDescription>Detalles de la zona</SheetDescription>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* Guardian */}
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-sea grid place-items-center text-white">
              {owner ? <Crown className="size-6" /> : <Flag className="size-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Guardián</p>
              <p className="font-bold text-deep truncate">
                {owner ? owner.name : "Vacante — zona libre"}
              </p>
              {owner && (
                <p className="text-xs text-muted-foreground">
                  Conquistó con <b className="text-primary">{zone.conqueredWithTons?.toFixed(2)} t</b>
                </p>
              )}
            </div>
            {isMine && (
              <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">Tú</Badge>
            )}
          </div>

          {/* Streak */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-deep">
              <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> RACHA DE 7 DÍAS</span>
              <span className="tabular-nums">{zone.streak}/7</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all",
                    i < zone.streak ? "bg-gradient-eco shadow-eco" : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {zone.status === "protected"
                ? "Zona blindada como Protegida."
                : "Trabaja 7 días seguidos para protegerla. Si fallas, se ensucia y queda vulnerable."}
            </p>
          </div>

          {/* Hazard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-deep">
              <span className="flex items-center gap-1.5"><Trash2 className="size-3.5" /> NIVEL DE CONTAMINACIÓN</span>
              <span className="tabular-nums">{Math.round(zone.hazardLevel)}%</span>
            </div>
            <Progress value={zone.hazardLevel} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Total recolectado en zona: <b className="text-deep">{zone.totalTonsCollected.toFixed(3)} t</b>
            </p>
          </div>

          {/* Actions */}
          {isMine ? (
            <div className="space-y-3">
              <Button onClick={handleCheckIn} variant="hero" size="lg" className="w-full">
                <Calendar className="size-4" /> Registrar día de trabajo
              </Button>
              <CleanupForm kilos={kilos} setKilos={setKilos} onSubmit={handleReport} />
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={cn(
                  "rounded-2xl p-4 text-sm",
                  verdict.canTake ? "bg-eco/15 text-eco-foreground" : "bg-coral/10 text-deep",
                )}
              >
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Swords className="size-4" /> Regla de oro
                </p>
                <p>{verdict.reason}</p>
              </div>
              <Button
                onClick={handleConquer}
                variant={verdict.canTake ? "hero" : "outline"}
                size="lg"
                className="w-full"
                disabled={!verdict.canTake}
              >
                <Flag className="size-4" />
                {owner ? "Conquistar territorio" : "Reclamar zona libre"}
              </Button>
              {!verdict.canTake && owner && (
                <p className="text-xs text-center text-muted-foreground">
                  Recolecta más residuos para superar al guardián.
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const CleanupForm = ({
  kilos,
  setKilos,
  onSubmit,
}: {
  kilos: string;
  setKilos: (v: string) => void;
  onSubmit: () => void;
}) => (
  <div className="glass-card rounded-2xl p-4 space-y-3">
    <Label className="text-xs font-bold uppercase tracking-widest text-deep">
      Reportar limpieza
    </Label>
    <div className="flex gap-2">
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Kilos recolectados"
        value={kilos}
        onChange={(e) => setKilos(e.target.value)}
        className="rounded-2xl"
      />
      <Button onClick={onSubmit} variant="sea">
        Sumar
      </Button>
    </div>
    <p className="text-[11px] text-muted-foreground">
      Cada kilo cuenta hacia tu poder de conquista.
    </p>
  </div>
);
