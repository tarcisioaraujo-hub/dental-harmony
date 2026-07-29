import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, Search, XCircle, Shield, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dr. Lucas Monteiro — Agendamento odontológico online" },
      { name: "description", content: "Agende, consulte ou cancele sua consulta odontológica online com o Dr. Lucas Monteiro." },
      { property: "og:title", content: "Dr. Lucas Monteiro — Agendamento odontológico online" },
      { property: "og:description", content: "Agende, consulte ou cancele sua consulta odontológica online com o Dr. Lucas Monteiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <section className="bg-hero">
        <div className="mx-auto max-w-3xl px-4 pt-16 pb-28 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-hero-foreground/60">
            Odontologia Especializada
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-primary md:text-6xl">
            Agende sua consulta
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-hero-foreground/70">
            Escolha a data, o horário e receba a confirmação na hora. Sem telefonemas, sem espera.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-20 max-w-3xl px-4 pb-16">
        <Card className="rounded-3xl shadow-xl">
          <CardContent className="grid gap-3 p-6 md:p-8">
            <Button asChild size="lg">
              <Link to="/agendar">
                <CalendarPlus className="mr-2 h-5 w-5" /> Agendar consulta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/consulta">
                <Search className="mr-2 h-5 w-5" /> Minhas consultas
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/cancelar">
                <XCircle className="mr-2 h-5 w-5" /> Cancelar consulta
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Clock, title: "Rápido", desc: "3 passos para agendar." },
            { icon: Shield, title: "Seguro", desc: "Seus dados protegidos." },
            { icon: CalendarPlus, title: "Flexível", desc: "Cancele quando precisar." },
          ].map((f) => (
            <Card key={f.title} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
