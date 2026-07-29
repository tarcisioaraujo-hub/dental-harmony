import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar, CalendarPlus, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Início", icon: Calendar },
  { to: "/agendar", label: "Agendar", icon: CalendarPlus },
  { to: "/consulta", label: "Minhas consultas", icon: Search },
  { to: "/cancelar", label: "Cancelar", icon: XCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            
            {/* Logo Estilizada (Substitui o JSON que estava quebrando) */}
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm">
              LM
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate font-semibold text-foreground">Dr. Lucas Monteiro</div>
              <div className="truncate text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                Odontologia Especializada
              </div>
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
                      ? "bg-primary/15 text-foreground"
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

      <nav className="md:hidden sticky bottom-0 z-40 border-t bg-card">
        <div className="grid grid-cols-4">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px]",
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

      <footer className="hidden md:block border-t bg-hero py-6 text-center text-xs text-hero-foreground/70">
        © {new Date().getFullYear()} Dr. Lucas Monteiro — Odontologia Especializada
      </footer>
    </div>
  );
}

/** Faixa escura de topo com título dourado, igual ao modelo de referência. */
export function HeroBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-24 text-center">
        <h1 className="text-3xl md:text-5xl font-semibold text-primary">{title}</h1>
        {subtitle && <p className="mt-3 text-sm md:text-base text-hero-foreground/70">{subtitle}</p>}
      </div>
    </div>
  );
}
