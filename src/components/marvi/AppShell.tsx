import { TopNav, BottomNav } from "./Navigation";

export const AppShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-dvh w-full pb-24 md:pb-8">
    <TopNav />
    {/* Mobile header */}
    <header className="md:hidden flex items-center justify-between px-5 pt-5 pb-2">
      <div>
        <div className="font-display text-2xl font-bold text-deep tracking-tight">MARVI</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-1">
          Guardianes de la Costa
        </div>
      </div>
      <div className="size-10 rounded-2xl bg-gradient-sea grid place-items-center text-white font-bold shadow-glow">
        TÚ
      </div>
    </header>
    <main className="px-4 md:px-8 pt-3 md:pt-6">{children}</main>
    <BottomNav />
  </div>
);
