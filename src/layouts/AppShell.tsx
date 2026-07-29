import { Outlet } from "@tanstack/react-router";

const NAV_ITEMS = [
  { href: "/", label: "Início" },
  { href: "/agendar", label: "Agendar" },
  { href: "/consulta", label: "Minhas consultas" },
  { href: "/cancelar", label: "Cancelar" },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#222222] font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8E2D5] bg-[#FDFBF7]/95 backdrop-blur">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo Estilizada Dourada */}
          <a href="/" className="flex items-center gap-3 group decoration-none">
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
          </a>

          {/* Navegação */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-[#555555] hover:text-[#222222] hover:bg-[#F3EFE6] transition-colors"
              >
                {item.label}
              </a>
            ))}
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
