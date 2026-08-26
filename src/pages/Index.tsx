import { AppShell } from "@/components/marvi/AppShell";
import { StatsBar } from "@/components/marvi/StatsBar";
import { ConquestMap } from "@/components/marvi/ConquestMap";
import { MissionPanel } from "@/components/marvi/MissionPanel";
import { LeaderboardMini } from "@/components/marvi/LeaderboardMini";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const Index = () => (
  <AppShell>
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <StatsBar />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <section className="lg:col-span-9 space-y-4 md:space-y-6">
          <ConquestMap />
          <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-deep">¿Acabas de limpiar una zona?</h3>
              <p className="text-sm text-muted-foreground">
                Reporta los kilos recolectados y sube tu poder de conquista.
              </p>
            </div>
            <Link to="/reportar">
              <Button variant="hero" size="lg" className="w-full md:w-auto">
                <Plus className="size-4" /> Reportar limpieza
              </Button>
            </Link>
          </div>
        </section>
        <aside className="lg:col-span-3 space-y-4 md:space-y-6">
          <MissionPanel />
          <LeaderboardMini />
        </aside>
      </div>
    </div>
  </AppShell>
);

export default Index;
