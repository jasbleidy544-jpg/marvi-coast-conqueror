import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const SECTIONS: { emoji: string; title: string; points: string[] }[] = [
  {
    emoji: "🆕",
    title: "Crea tu cuenta",
    points: [
      "Regístrate con correo y contraseña. Sin confirmación de correo. ✉️",
      "Elige tu identidad: sube tu 📷 foto real o crea un 🎨 avatar.",
      "Recibirás un mensaje de bienvenida con los primeros pasos. 👋",
      "Puedes ser 🧹 Guardián (limpias) o 🏢 Marca (patrocinas).",
    ],
  },
  {
    emoji: "🚩",
    title: "Conquistar una zona",
    points: [
      "Toca “Conquistar mi ubicación” estando en el sitio.",
      "Elige tipo: 🌊 costera · 🏙️ urbana · 🌄 rural.",
      "Ponle nombre y queda tu bandera: “👑 Guardián + tu nombre”.",
      "¡Es tuya al instante! Sin rachas ni esperas. 🎉",
    ],
  },
  {
    emoji: "📏",
    title: "Radio de protección",
    points: [
      "Es el círculo que proteges alrededor de tu bandera: de 50 m a 1000 m.",
      "Todo lo que cae dentro del círculo es tu territorio.",
      "Nadie puede conquistar dentro de tu radio… salvo que te supere en kilos.",
      "Radio pequeño = fácil de cuidar. Radio grande = más territorio, más responsabilidad.",
      "Los radios no se pueden encimar sobre una zona ya protegida.",
    ],
  },
  {
    emoji: "📍",
    title: "Ubicación (GPS)",
    points: [
      "Activa el permiso de ubicación en tu navegador.",
      "Debes estar a menos de 500 m del centro de la zona.",
      "Si estás lejos, la app marca error: no se puede reportar ni conquistar. 🚫",
    ],
  },
  {
    emoji: "♻️",
    title: "Reportar limpieza",
    points: [
      "Sube foto de los residuos (cámara o galería) + tus kilos.",
      "La IA analiza la foto y calcula 📐 área, 🧊 volumen y ⚖️ kilos aproximados.",
      "Fotos generadas por IA se rechazan automáticamente. 🤖❌",
      "Cada 10 kg verificados baja 1 punto de contaminación de la zona.",
    ],
  },
  {
    emoji: "🏃",
    title: "Modo carrera",
    points: [
      "Toca ▶️ “Iniciar carrera” y sal a correr o caminar tu ronda.",
      "El mapa dibuja tu recorrido en vivo. 📈",
      "Cada ~180 m plantas bandera automáticamente: la zona es tuya al instante. 🚩",
      "Si el tramo ya tiene dueño con más kilos, sigues corriendo sin perder nada.",
    ],
  },
  {
    emoji: "⚖️",
    title: "Regla de oro (competencia)",
    points: [
      "Gana quien más kilos ha recolectado.",
      "Para robar una zona debes estar dentro de ella y superar los kilos del dueño.",
      "Al cambiar de dueño nadie pierde kilos: los puntos siempre se conservan. ✅",
    ],
  },
  {
    emoji: "⚠️",
    title: "Zona descuidada",
    points: [
      "Si pasas 3 días sin reportar en tu zona, se marca como en riesgo.",
      "Verás una advertencia en la app para que vuelvas a cuidarla. 🔔",
      "Otro guardián con más kilos puede quitártela si la descuidas.",
    ],
  },
  {
    emoji: "📊",
    title: "Mi Progreso",
    points: [
      "En “Mi Progreso” ves tus kilos totales, zonas y nivel. ⭐",
      "Sube de nivel: de Aprendiz 🌱 hasta Leyenda del Mar 🌊.",
      "Gráfica con tu recolección de los últimos 14 días. 📈",
    ],
  },
  {
    emoji: "🏆",
    title: "Ranking, eventos y marcas",
    points: [
      "Ranking: kilos totales y zonas conquistadas.",
      "Eventos: retos reales con marcas de Santa Marta y premios.",
      "Marcas: empresas pueden adoptar y patrocinar zonas.",
    ],
  },
];

export const HelpCenter = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Centro de ayuda"
          className={cn(
            "size-8 rounded-full grid place-items-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
            className,
          )}
        >
          <HelpCircle className="size-[18px]" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-deep">
            ❓ Cómo funciona MARVI
          </DialogTitle>
          <DialogDescription>
            Limpia, marca tu territorio y defiéndelo. Toca cada tema. 👇
          </DialogDescription>
        </DialogHeader>

        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          {SECTIONS.map((s, i) => (
            <AccordionItem key={s.title} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-bold text-deep">
                <span className="flex items-center gap-2">
                  <span aria-hidden>{s.emoji}</span>
                  {s.title}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 pl-1">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2 text-[13px] leading-snug text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};
