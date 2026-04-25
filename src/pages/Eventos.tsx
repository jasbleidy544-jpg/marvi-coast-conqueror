import { AppShell } from "@/components/marvi/AppShell";
import { Calendar, Flame, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Static event roster — torneos curados por MARVI
const events = [
  {
    id: "ev-1",
    name: "Reto Limpia-Playa Tayrona",
    description: "Conquista la mayor cantidad de zonas posibles en 72 horas. ¡Patrocinado por Eco-Sud!",
    sponsor: "Eco-Sud",
    prize: "$1,200 USD + kit de buceo",
    participants: 482,
    status: "live" as const,
  },
  {
    id: "ev-2",
    name: "Gran Slam de los Arrecifes",
    description: "Torneo mensual: el guardián que recolecte más toneladas se lleva el oro.",
    sponsor: "Agua Pura",
    prize: "$2,500 USD",
    participants: 128,
    status: "upcoming" as const,
  },
  {
    id: "ev-3",
    name: "Maratón Microplástico",
    description: "Sprint relámpago contra los microplásticos en Bahía Concha.",
    sponsor: "Marina-X",
    prize: "$450 USD",
    participants: 64,
    status: "upcoming" as const,
  },
];

const Eventos = () => (
  <AppShell>
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <header>
        <div className="inline-flex items-center gap-2 bg-coral/15 text-coral px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
          <Flame className="size-3.5" /> Torneos & Retos
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-deep">Eventos especiales</h1>
        <p className="text-muted-foreground mt-2">
          Compite contra otros guardianes en retos cronometrados patrocinados.
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
              </div>
              <div className="hidden md:flex flex-col items-end shrink-0">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Premio</span>
                <span className="font-display font-bold text-primary text-lg">{ev.prize}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="size-3.5" /> {ev.participants} guardianes</span>
                <span>·</span>
                <span>Patrocina <b className="text-deep">{ev.sponsor}</b></span>
              </div>
              <Button
                variant={ev.status === "live" ? "coral" : "hero"}
                onClick={() =>
                  toast.success(
                    ev.status === "live" ? "¡Inscrito al reto!" : "Te avisaremos cuando inicie.",
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
        Los torneos en vivo se sincronizan automáticamente con tus toneladas y zonas conquistadas.
      </div>
    </div>
  </AppShell>
);

export default Eventos;
