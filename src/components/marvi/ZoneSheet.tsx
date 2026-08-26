import { fmtKg } from "@/lib/units";
import { useState } from "react";
import { Zone, statusLabel, statusColor, canConquer } from "@/lib/marvi-types";
import { useGuardians, useMyProfile, useClaimTerritory, useReportCleanup, useCheckIn } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, Flag, Swords, Calendar, Trash2, LogIn } from "lucide-react";
import { GuardianAvatar } from "./GuardianAvatar";
import { getCurrentPosition } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const ZoneSheet = ({ zone, onClose }: { zone: Zone | null; onClose: () => void }) => {
  const { user } = useAuth();
  const { data: guardians } = useGuardians();
  const { data: me } = useMyProfile();
  const claim = useClaimTerritory();
  const report = useReportCleanup();
  const checkIn = useCheckIn();
  const [kilos, setKilos] = useState("");

  if (!zone) return null;
  const owner = zone.guardian_id ? guardians?.find((g) => g.id === zone.guardian_id) : null;
  const isMine = !!user && owner?.id === user.id;
  const tone = statusColor(zone.status);
  const verdict = canConquer(me?.total_tons ?? 0, owner?.total_tons ?? null, owner?.display_name ?? null, isMine);

  const handleConquer = async () => {
    try {
      const pos = await getCurrentPosition();
      const r = await claim.mutateAsync({
        lat: pos.lat,
        lng: pos.lng,
        name: zone.name,
        radiusM: zone.radius_m,
      });
      if (r.ok) { toast.success(r.message); onClose(); }
      else toast.error(r.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "GPS requerido para retar.");
    }
  };

  const handleReport = async () => {
    const k = Number(kilos);
    if (k <= 0) return toast.error("Indica una cantidad válida.");
    try {
      const pos = await getCurrentPosition();
      const r = await report.mutateAsync({ zoneId: zone.id, kilos: k, lat: pos.lat, lng: pos.lng });
      if (r.ok) { toast.success(r.message); setKilos(""); }
      else toast.error(r.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de GPS");
    }
  };

  const handleCheckIn = async () => {
    try {
      const pos = await getCurrentPosition();
      const r = await checkIn.mutateAsync({ zoneId: zone.id, lat: pos.lat, lng: pos.lng });
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de GPS");
    }
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
          {zone.description && (
            <p className="text-sm text-muted-foreground italic">{zone.description}</p>
          )}

          {/* Guardian */}
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            {owner ? (
              <GuardianAvatar avatarUrl={owner.avatar_url} name={owner.display_name} className="size-14 text-lg" />
            ) : (
              <div className="size-14 rounded-2xl bg-gradient-sea grid place-items-center text-white">
                <Flag className="size-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
                <Crown className="size-3 text-gold" /> Guardián de {zone.name}
              </p>
              <p className="font-bold text-deep truncate text-lg">
                {owner ? owner.display_name : "Vacante — zona libre"}
              </p>
              {owner?.badge && (
                <p className="text-xs text-primary font-semibold">{owner.badge}</p>
              )}
              {owner && zone.conquered_with_tons !== null && (
                <p className="text-xs text-muted-foreground">
                  Conquistó con <b className="text-primary">{fmtKg(zone.conquered_with_tons)} kg</b>
                </p>
              )}
            </div>
            {isMine && <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">Tú</Badge>}
          </div>

          {/* Propiedad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-deep">
              <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> TERRITORIO OFICIAL</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta zona es oficialmente de su guardián desde que plantó la bandera. Solo cambia de dueño
              si alguien con <b className="text-deep">más kilos recolectados</b> la conquista estando dentro del radio.
              Los kilos de cada guardián no se pierden nunca.
            </p>
          </div>

          {/* Hazard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-deep">
              <span className="flex items-center gap-1.5"><Trash2 className="size-3.5" /> NIVEL DE CONTAMINACIÓN</span>
              <span className="tabular-nums">{Math.round(zone.hazard_level)}%</span>
            </div>
            <Progress value={zone.hazard_level} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Total recolectado en zona: <b className="text-deep">{fmtKg(zone.total_tons_collected, 1)} kg</b>
            </p>
          </div>

          {/* Actions */}
          {!user ? (
            <Link to="/auth">
              <Button variant="hero" size="lg" className="w-full">
                <LogIn className="size-4" /> Inicia sesión para conquistar
              </Button>
            </Link>
          ) : isMine ? (
            <div className="space-y-3">
              <Button onClick={handleCheckIn} variant="hero" size="lg" className="w-full" disabled={checkIn.isPending}>
                <Calendar className="size-4" /> Registrar ronda de hoy
              </Button>
              <CleanupForm kilos={kilos} setKilos={setKilos} onSubmit={handleReport} loading={report.isPending} />
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
                disabled={!verdict.canTake || claim.isPending}
              >
                <Flag className="size-4" />
                {owner ? "Retar (debes estar en el lugar)" : "Reclamar zona libre"}
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
  kilos, setKilos, onSubmit, loading,
}: { kilos: string; setKilos: (v: string) => void; onSubmit: () => void; loading: boolean }) => (
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
      <Button onClick={onSubmit} variant="sea" disabled={loading}>
        Sumar
      </Button>
    </div>
    <p className="text-[11px] text-muted-foreground">Cada kilo cuenta hacia tu poder de conquista.</p>
  </div>
);
