import { AppShell } from "@/components/marvi/AppShell";
import { Calendar, Flame, MapPin, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Eventos reales y viables con marcas y aliados de Santa Marta, Colombia.
// Premios pensados en COP y especie (mercancía, hospedaje, experiencias) — alcanzables para marcas locales.
const events = [
  {
    id: "ev-1",
    name: "Reto Bahía Limpia · Playa Blanca",
    description:
      "72 horas para conquistar la mayor cantidad de metros de costa entre Playa Blanca y Bahía Concha. Pesaje oficial en el muelle turístico.",
    sponsor: "Hotel Irotama Resort",
    location: "Bahía de Santa Marta",
    dates: "14–16 jun 2026",
    prize: "$3.500.000 COP + fin de semana todo incluido para 2",
    participants: 184,
    status: "live" as const,
  },
  {
    id: "ev-2",
    name: "Sierra a Mar · Río Manzanares",
    description:
      "Jornada de limpieza desde el barrio Pescaíto hasta la desembocadura. Categorías individual y colectivo barrial.",
    sponsor: "Cervecería Devs Magdalena & Alcaldía de Santa Marta",
    location: "Río Manzanares",
    dates: "29 jun 2026 · 6:00 am",
    prize: "$2.000.000 COP + dotación de kayaks comunitarios",
    participants: 96,
    status: "upcoming" as const,
  },
  {
    id: "ev-3",
    name: "Guardianes del Tayrona",
    description:
      "Expedición autorizada por Parques Nacionales: 5 zonas dentro del PNN Tayrona, transporte y guía incluidos para los 30 primeros inscritos.",
    sponsor: "Aviatur Ecoturismo + Parques Nacionales Naturales",
    location: "PNN Tayrona — Cabo San Juan",
    dates: "13 jul 2026",
    prize: "Beca de buceo PADI Open Water con Poseidon Dive Center",
    participants: 42,
    status: "upcoming" as const,
  },
  {
    id: "ev-4",
    name: "Maratón Microplástico · Taganga",
    description:
      "Sprint de 4 horas en la bahía de Taganga junto a pescadores artesanales. Se entrega kit de tamizado a cada equipo.",
    sponsor: "Poseidon Dive Center & Restaurante Ouzo",
    location: "Taganga",
    dates: "27 jul 2026 · 7:00 am",
    prize: "$1.200.000 COP + cena para 4 en Ouzo",
    participants: 58,
    status: "upcoming" as const,
  },
  {
    id: "ev-5",
    name: "Ciénaga Viva · Pueblo Palafítico",
    description:
      "Alianza con pescadores de Nueva Venecia para retirar residuos del espejo de agua. Embarcaciones provistas por la cooperativa local.",
    sponsor: "Fundación Ciénaga Grande + Bavaria Voluntarios",
    location: "Ciénaga Grande de Santa Marta",
    dates: "10 ago 2026",
    prize: "$2.500.000 COP para la cooperativa ganadora + mercados",
    participants: 70,
    status: "upcoming" as const,
  },
];

const Eventos = () => (
  <AppShell>
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <header>
        <div className="inline-flex items-center gap-2 bg-coral/15 text-coral px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
          <Flame className="size-3.5" /> Torneos en Santa Marta
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-deep">Eventos especiales</h1>
        <p className="text-muted-foreground mt-2">
          Retos reales con marcas, hoteles y fundaciones de la región Caribe — costa, ciudad y sierra. Inscripción gratuita; los premios se entregan en eventos presenciales con pesaje verificado.
        </p>
      </header>

      <div className="grid gap-4">
        {events.map((ev) => (
          <article
            key={ev.id}
            className={cn(
              "glass-card rounded-4xl p-5 md:p-6 relative overflow-hidden",
              ev.status === "live" && "ring-2 ring-coral/50 shadow-coral",
            )}
          >
            {ev.status === "live" && (
              <div className="absolute -right-10 -top-10 size-40 bg-coral/15 blur-3xl rounded-full" />
            )}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <Badge
                  className={cn(
                    "uppercase font-bold text-[10px] mb-2 border-0",
                    ev.status === "live" && "bg-coral text-white animate-pulse-glow",
                    ev.status === "upcoming" && "bg-sea/15 text-primary",
                  )}
                >
                  {ev.status === "live" ? "● EN VIVO" : "Próximo"}
                </Badge>
                <h3 className="font-display text-xl md:text-2xl font-bold text-deep">{ev.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {ev.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {ev.dates}</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end shrink-0 max-w-[180px] text-right">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Premio</span>
                <span className="font-display font-bold text-primary text-sm leading-tight">{ev.prize}</span>
              </div>
            </div>

            <div className="md:hidden mb-3 bg-sea/5 rounded-2xl p-3">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Premio</span>
              <p className="font-display font-bold text-primary text-sm leading-tight">{ev.prize}</p>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><Users className="size-3.5" /> {ev.participants} guardianes</span>
                <span>·</span>
                <span>Patrocina <b className="text-deep">{ev.sponsor}</b></span>
              </div>
              <Button
                variant={ev.status === "live" ? "coral" : "hero"}
                onClick={() =>
                  toast.success(
                    ev.status === "live" ? "¡Inscrito al reto! Te llegará el punto de pesaje." : "Te avisaremos cuando abra inscripciones.",
                  )
                }
              >
                {ev.status === "live" ? "Unirme ahora" : "Recordarme"}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="glass-card rounded-4xl p-5 text-center text-sm text-muted-foreground">
        <Trophy className="size-5 text-gold mx-auto mb-2" />
        Los pesajes se hacen en puntos oficiales junto a la marca patrocinadora. Tus kilos y zonas conquistadas suman automáticamente al ranking del torneo.
      </div>
    </div>
  </AppShell>
);

export default Eventos;
