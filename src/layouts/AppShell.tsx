import { Link, Outlet, useLocation } from "@tanstack/react-router";

const NAV_ITEMS = [
  { to: "/", label: "Início" },
  { to: "/agendar", label: "Agendar" },
  { to: "/consulta", label: "Minhas consultas" },
  { to: "/cancelar", label: "Cancelar" },
];

export function HeroBanner({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#1C1814] text-white py-12 px-4 border-b border-[#2A241F]">
      <div className="container mx-auto text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[#E8C872]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#C4B29E] text-sm md:text-base max-w-xl mx-auto font-light">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {/* Logo Estilizada integrada diretamente nos estilos da marca */}
            <div className="w-10 h-10 rounded-full bg-[#E8C872] flex items-center justify-center text-[#1C1814] font-bold text-base shadow-sm">
              LM
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight text-foreground">
                Dr. Lucas Monteiro
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                ODONTOLOGIA ESPECIALIZADA
              </span>
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
