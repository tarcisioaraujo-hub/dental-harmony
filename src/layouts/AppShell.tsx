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
    <div className="min-h-screen bg-[#FDFBF7] text-[#222222] font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8E2D5] bg-[#FDFBF7]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FDFBF7]/80">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo Estilizada (Substitui a imagem quebrada) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#C5A25D] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              LM
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg text-[#222222] leading-tight">
                Dr. Lucas Monteiro
              </span>
              <span className="text-[10px] tracking-widest text-[#C5A25D] uppercase font-medium">
                Odontologia Especializada
              </span>
            </div>
          </Link>

          {/* Navegação */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#C5A25D] text-white shadow-sm"
                      : "text-[#555555] hover:text-[#222222] hover:bg-[#F3EFE6]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Rodapé */}
      <footer className="border-t border-[#E8E2D5] bg-[#FAF6EE] py-6 text-center text-xs text-[#777777]">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Dr. Lucas Monteiro — Odontologia Especializada. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
