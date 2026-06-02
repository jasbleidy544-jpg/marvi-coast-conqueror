import { useState } from "react";
import { AppShell } from "@/components/marvi/AppShell";
import { useZones, useReportCleanup, useUploadReportPhoto, useAnalyzeWastePhoto, type WasteAnalysis } from "@/lib/marvi-queries";
import { getCurrentPosition } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, FileText, Trash2, Loader2, Sparkles, AlertTriangle, MapPin } from "lucide-react";
import { toast } from "sonner";

const Reportar = () => {
  const { data: zones } = useZones();
  const report = useReportCleanup();
  const uploadPhoto = useUploadReportPhoto();
  const analyze = useAnalyzeWastePhoto();
  const [zoneId, setZoneId] = useState("");
  const [kilos, setKilos] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WasteAnalysis | null>(null);

  if (!zoneId && zones?.length) setZoneId(zones[0].id);

  const handleFile = async (file: File) => {
    setPhotoFile(file);
    setAnalysis(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = String(ev.target?.result);
      setPhotoPreview(dataUrl);
      try {
        const r = await analyze.mutateAsync({ imageBase64: dataUrl });
        setAnalysis(r);
        if (r.is_ai_generated && r.ai_confidence >= 0.6) {
          toast.error("⚠️ La imagen parece generada por IA. No se aceptará.");
        } else if (!r.is_waste_scene) {
          toast.warning("No se detectaron residuos en la foto.");
        } else {
          setKilos(r.estimated_kilos.toFixed(2));
          toast.success(`IA estimó ${r.estimated_kilos.toFixed(1)} kg en ${r.area_m2.toFixed(1)} m².`);
        }
      } catch (err) {
        console.error("Análisis IA falló:", err);
        toast.warning("No se pudo analizar con IA, pero puedes continuar manualmente.");
      }
    };
    reader.readAsDataURL(file);
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
    e.target.value = ""; // permite re-seleccionar el mismo archivo
  };

  const aiBlocked = analysis?.is_ai_generated && (analysis.ai_confidence ?? 0) >= 0.6;
  const notWaste = analysis && !analysis.is_waste_scene;

  const submit = async () => {
    const k = Number(kilos);
    if (!zoneId) return toast.error("Selecciona una zona.");
    if (k <= 0) return toast.error("Ingresa los kilos recolectados.");
    if (!photoFile) return toast.error("Adjunta una foto de evidencia.");
    if (aiBlocked) return toast.error("La foto fue detectada como generada por IA.");
    if (notWaste) return toast.error("La foto no muestra residuos.");

    let coords: { lat: number; lng: number };
    try {
      const pos = await getCurrentPosition();
      coords = { lat: pos.lat, lng: pos.lng };
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : "GPS requerido.");
    }

    let photoUrl: string | undefined;
    try {
      const url = await uploadPhoto.mutateAsync(photoFile);
      photoUrl = url ?? undefined;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error subiendo foto";
      toast.error(msg);
      return;
    }

    const r = await report.mutateAsync({ zoneId, kilos: k, notes, photoUrl, lat: coords.lat, lng: coords.lng });
    if (r.ok) {
      toast.success(r.message);
      setKilos(""); setNotes(""); setPhotoFile(null); setPhotoPreview(null); setAnalysis(null);
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
            Adjunta la foto, la IA estima los kilos y verifica que sea real. El GPS confirma que estás en la zona.
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
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3" /> Debes estar físicamente en la zona (máx 500 m).
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Foto de evidencia</Label>
            <div className="border-2 border-dashed border-border rounded-3xl p-6 text-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Evidencia" className="max-h-48 mx-auto rounded-2xl mb-3" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground mb-3">
                  <Camera className="size-8" />
                  <p className="text-sm font-medium">Toma una foto o súbela desde tu galería</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="sea" size="lg" type="button">
                  <label className="cursor-pointer">
                    <Camera className="size-4" /> Cámara
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={onPhoto}
                      className="hidden"
                    />
                  </label>
                </Button>
                <Button asChild variant="outline" size="lg" type="button">
                  <label className="cursor-pointer">
                    <FileText className="size-4" /> Galería
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPhoto}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>

            {analyze.isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Analizando imagen con IA…
              </div>
            )}

            {analysis && (
              <div
                className={`rounded-2xl p-3 text-xs space-y-1 border ${
                  aiBlocked ? "bg-coral/15 border-coral text-deep" :
                  notWaste ? "bg-gold/15 border-gold text-deep" :
                  "bg-eco/10 border-eco/40 text-deep"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {aiBlocked ? <AlertTriangle className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  {aiBlocked ? "Imagen generada por IA detectada" :
                   notWaste ? "No se detectaron residuos" :
                   "Análisis IA"}
                </div>
                {!aiBlocked && !notWaste && (
                  <>
                    <p>Peso estimado: <b>{analysis.estimated_kilos.toFixed(2)} kg</b></p>
                    <p>Área: <b>{analysis.area_m2.toFixed(2)} m²</b> · Volumen: <b>{analysis.volume_m3.toFixed(3)} m³</b></p>
                    {analysis.waste_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.waste_types.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {analysis.description && <p className="italic opacity-80">{analysis.description}</p>}
                {analysis.reason && <p className="opacity-70">{analysis.reason}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">
              Kilos recolectados {analysis && !aiBlocked && !notWaste && <span className="text-eco">(autollenado por IA, puedes ajustar)</span>}
            </Label>
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
            <Label className="text-xs font-bold uppercase tracking-widest text-deep">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué tipo de residuos? ¿Hubo voluntarios?"
              className="rounded-2xl min-h-24"
            />
          </div>

          <Button onClick={submit} variant="hero" size="xl" className="w-full" disabled={loading || aiBlocked || notWaste || analyze.isPending}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {loading ? "Enviando…" : "Enviar reporte"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

export default Reportar;
