import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, Search, XCircle, Shield, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5" /> Agendamento 100% online
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Cuidar do seu sorriso ficou <span className="text-primary">simples</span>.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Escolha o melhor horário, preencha seus dados e receba a confirmação
              na hora. Sem telefonemas, sem espera.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/agendar">
                  <CalendarPlus className="mr-2 h-5 w-5" /> Agendar consulta
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/consulta">
                  <Search className="mr-2 h-5 w-5" /> Minha consulta
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, title: "Rápido", desc: "3 passos para agendar." },
                { icon: Shield, title: "Seguro", desc: "Seus dados protegidos." },
                { icon: CalendarPlus, title: "Flexível", desc: "Reagende quando quiser." },
                { icon: XCircle, title: "Sem custo", desc: "Cancelamento gratuito." },
              ].map((f) => (
                <Card key={f.title} className="border-muted">
                  <CardContent className="p-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 font-semibold">{f.title}</div>
                    <div className="text-sm text-muted-foreground">{f.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
