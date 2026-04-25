import { TopNav, BottomNav } from "./Navigation";
import { useMyProfile } from "@/lib/marvi-queries";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { data: me } = useMyProfile();
  const initials = me?.display_name?.slice(0, 2).toUpperCase() ?? (user ? "TÚ" : "?");

  return (
    <div className="min-h-dvh w-full pb-24 md:pb-8">
      <TopNav />
      <header className="md:hidden flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <div className="font-display text-2xl font-bold text-deep tracking-tight">MARVI</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-1">
            Guardianes de la Costa
          </div>
        </div>
        <Link
          to={user ? "/perfil" : "/auth"}
          className="size-10 rounded-2xl bg-gradient-sea grid place-items-center text-white font-bold shadow-glow text-xs"
        >
          {initials}
        </Link>
      </header>
      <main className="px-4 md:px-8 pt-3 md:pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
