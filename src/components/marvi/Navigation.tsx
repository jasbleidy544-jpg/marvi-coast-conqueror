import { NavLink } from "react-router-dom";
import { Map, Trophy, Calendar, Sparkles, FileText, Building2, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/marvi-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { HelpCenter } from "./HelpCenter";
import { toast } from "sonner";


const links = [
  { to: "/", label: "Mapa", icon: Map },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/eventos", label: "Eventos", icon: Calendar },
  { to: "/reportar", label: "Reportar", icon: FileText },
  { to: "/patrocinios", label: "Marcas", icon: Building2 },
  { to: "/perfil", label: "Perfil", icon: Sparkles },
];

export const TopNav = () => {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 hidden md:block">
      <div className="glass-card-strong mx-4 mt-4 rounded-3xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MARVI" width={40} height={40} className="size-10 object-contain" />
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-deep">MARVI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">
              Guardianes de la Costa · Santa Marta
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-sea text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
          <HelpCenter className="ml-1" />
          {user ? (

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await signOut(); toast.success("Hasta pronto, guardián."); }}
              className="ml-2"
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <NavLink to="/auth" className="ml-2">
              <Button variant="hero" size="sm"><LogIn className="size-4" />Entrar</Button>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export const BottomNav = () => (
  <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 glass-card-strong rounded-3xl px-2 py-2 flex items-center justify-around">
    {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-0",
            isActive ? "bg-gradient-sea text-white shadow-glow" : "text-muted-foreground",
          )
        }
      >
        <Icon className="size-5" />
        <span className="text-[10px] font-semibold truncate">{label}</span>
      </NavLink>
    ))}
  </nav>
);
