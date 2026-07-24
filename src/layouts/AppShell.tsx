import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar, CalendarPlus, Search, XCircle, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Início", icon: Calendar },
  { to: "/agendar", label: "Agendar", icon: CalendarPlus },
  { to: "/consulta", label: "Minha consulta", icon: Search },
  { to: "/cancelar", label: "Cancelar", icon: XCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-foreground">OdontoAgenda</div>
              <div className="text-xs text-muted-foreground">Agendamento online</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="md:hidden sticky bottom-0 border-t bg-card">
        <div className="grid grid-cols-4">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="hidden md:block border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OdontoAgenda — Sistema de agendamento
      </footer>
    </div>
  );
}
