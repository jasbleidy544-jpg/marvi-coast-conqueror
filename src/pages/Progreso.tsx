import { useMemo } from "react";
import { AppShell } from "@/components/marvi/AppShell";
import { NeglectWarning } from "@/components/marvi/NeglectWarning";
import { GuardianAvatar } from "@/components/marvi/GuardianAvatar";
import { useMyProfile, useMyReports, useMyCheckIns, useZones, useGuardians } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { fmtKg, tonsToKg } from "@/lib/units";
import { Flag, Footprints, Recycle, TrendingUp, Trophy, Target } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const LEVELS = [
  { name: "Aprendiz del Mar", kg: 0 },
  { name: "Guardián Costero", kg: 50 },
  { name: "Defensor de la Bahía", kg: 250 },
  { name: "Rey de la Costa", kg: 1000 },
  { name: "Leyenda MARVI", kg: 5000 },
];

const Progreso = () => {
  const { user } = useAuth();
  const { data: me } = useMyProfile();
  const { data: reports } = useMyReports();
  const { data: checkIns } = useMyCheckIns();
  const { data: zones } = useZones();
  const { data: guardians } = useGuardians();

  const myKg = tonsToKg(me?.total_tons);
  const myZones = (zones ?? []).filter((z) => z.guardian_id === user?.id);

  const rank = useMemo(() => {
    const idx = (guardians ?? []).findIndex((g) => g.id === user?.id);
    return idx >= 0 ? idx + 1 : null;
  }, [guardians, user?.id]);

  const chart = useMemo(() => {
    const days: { label: string; kg: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const kg = (reports ?? [])
        .filter((r) => r.created_at.slice(0, 10) === key)
        .reduce((s, r) => s + Number(r.kilos), 0);
      days.push({ label: d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }), kg });
    }
    return days;
  }, [reports]);

  const level = [...LEVELS].reverse().find((l) => myKg >= l.kg) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.kg > myKg);
  const pct = next ? Math.min(100, Math.round(((myKg - level.kg) / (next.kg - level.kg)) * 100)) : 100;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <header className="glass-card rounded-4xl p-6 flex items-center gap-4">
          <GuardianAvatar avatarUrl={me?.avatar_url} name={me?.display_name} className="size-16 rounded-3xl" />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-deep">Mi progreso 📈</h1>
            <p className="text-sm text-muted-foreground">
              {me?.display_name ?? "Guardián"} · nivel <b className="text-deep">{level.name}</b>
            </p>
          </div>
        </header>

        <NeglectWarning />

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric icon={Recycle} label="Kilos recogidos" value={fmtKg(me?.total_tons)} tone="eco" />
          <Metric icon={Flag} label="Territorios" value={String(myZones.length)} tone="sea" />
          <Metric icon={Footprints} label="Rondas" value={String(checkIns?.length ?? 0)} tone="sea" />
          <Metric icon={Trophy} label="Puesto" value={rank ? `#${rank}` : "—"} tone="gold" />
        </section>

        <section className="glass-card rounded-4xl p-5 space-y-3">
          <h2 className="font-display font-bold text-deep flex items-center gap-2">
            <Target className="size-4 text-primary" /> Camino al siguiente nivel
          </h2>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-sea transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {next
              ? `Te faltan ${(next.kg - myKg).toLocaleString("es-CO", { maximumFractionDigits: 0 })} kg para ser ${next.name} 🏅`
              : "¡Alcanzaste el nivel máximo! 👑"}
          </p>
        </section>

        <section className="glass-card rounded-4xl p-5">
          <h2 className="font-display font-bold text-deep mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-eco" /> Recolección últimos 14 días (kg)
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Recogido"]} />
                <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card rounded-4xl p-5">
          <h2 className="font-display font-bold text-deep mb-3">Historial de reportes</h2>
          {(reports ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aún no registras recolecciones. Sube tu primera evidencia 📸
            </p>
          ) : (
            <ul className="space-y-2">
              {(reports ?? []).slice(0, 15).map((r) => {
                const zone = zones?.find((z) => z.id === r.zone_id);
                return (
                  <li key={r.id} className="flex items-center justify-between p-3 bg-white/60 rounded-2xl">
                    <div className="min-w-0">
                      <p className="font-bold text-deep truncate">{zone?.name ?? "Territorio"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long" })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-eco shrink-0">
                      +{Number(r.kilos).toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
};

const Metric = ({
  icon: Icon, label, value, tone,
}: { icon: typeof Flag; label: string; value: string; tone: "sea" | "eco" | "gold" }) => (
  <div className="glass-card rounded-3xl p-4">
    <div
      className={cn(
        "size-9 rounded-2xl grid place-items-center mb-2 text-white",
        tone === "sea" && "bg-gradient-sea",
        tone === "eco" && "bg-gradient-eco",
        tone === "gold" && "bg-gradient-coral",
      )}
    >
      <Icon className="size-4" />
    </div>
    <p className="font-display text-2xl font-bold text-deep leading-none">{value}</p>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
  </div>
);

export default Progreso;
