import { useState } from "react";
import { AppShell } from "@/components/marvi/AppShell";
import { useZones, useReportCleanup, useUploadReportPhoto } from "@/lib/marvi-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Reportar = () => {
  const { data: zones } = useZones();
  const report = useReportCleanup();
  const uploadPhoto = useUploadReportPhoto();
  const [zoneId, setZoneId] = useState("");
  const [kilos, setKilos] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Set default zone once data arrives
  if (!zoneId && zones?.length) setZoneId(zones[0].id);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(String(ev.target?.result));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    const k = Number(kilos);
    if (!zoneId) return toast.error("Selecciona una zona.");
    if (k <= 0) return toast.error("Ingresa los kilos recolectados.");

    let photoUrl: string | undefined;
    if (photoFile) {
      try {
        const url = await uploadPhoto.mutateAsync(photoFile);
        photoUrl = url ?? undefined;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error subiendo foto";
        toast.error(msg);
        return;
      }
    }

    const r = await report.mutateAsync({ zoneId, kilos: k, notes, photoUrl });
    if (r.ok) {
      toast.success(r.message);
      setKilos(""); setNotes(""); setPhotoFile(null); setPhotoPreview(null);
    } else toast.error(r.message);
  };

  const loading = report.isPending || uploadPhoto.isPending;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        <header>
          <div className="inline-flex items-center gap-2 bg-eco/15 text-eco-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <FileText className="size-3.5" /> Reporte de Limpieza
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-deep">Registra tu jornada</h1>
          <p className="text-muted-foreground mt-2">
            Sube evidencia y los kilos recolectados. Cada gramo cuenta para tu poder de conquista.
          </p>
        </header>

        <div className="glass-card rounded-4xl p-5 md:p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Zona</Label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full h-12 rounded-2xl bg-background border border-input px-4 text-sm font-medium"
            >
              {zones?.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} · {z.meters}m
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Kilos recolectados</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="ej. 12.5"
              value={kilos}
              onChange={(e) => setKilos(e.target.value)}
              className="h-12 rounded-2xl text-lg font-display"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Foto de evidencia</Label>
            <label className="block">
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              <div className="border-2 border-dashed border-border rounded-3xl p-6 text-center cursor-pointer hover:bg-white/40 transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} alt="Evidencia" className="max-h-48 mx-auto rounded-2xl" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="size-8" />
                    <p className="text-sm font-medium">Toca para subir foto</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué tipo de residuos? ¿Hubo voluntarios?"
              className="rounded-2xl min-h-24"
            />
          </div>

          <Button onClick={submit} variant="hero" size="xl" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {loading ? "Enviando…" : "Enviar reporte"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

export default Reportar;
