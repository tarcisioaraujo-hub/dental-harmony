import { Link, Outlet, useLocation } from "@tanstack/react-router";

const NAV_ITEMS = [
  { to: "/", label: "Início" },
  { to: "/agendar", label: "Agendar" },
  { to: "/consulta", label: "Minhas consultas" },
  { to: "/cancelar", label: "Cancelar" },
];

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-lucas.png" alt="Logotipo Dr. Lucas Monteiro" className="h-10 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight text-foreground">Dr. Lucas Monteiro</span>
              <span className="text-[10px] text-muted-foreground">ODONTOLOGIA ESPECIALIZADA</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
