import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, HeroBanner } from "@/layouts/AppShell";
import { agendaService } from "@/services/agendaService";
import { formatarDataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Loader2, Search } from "lucide-react";
import type { Agendamento } from "@/types/agenda";

export const Route = createFileRoute("/consulta")({
  head: () => ({
    meta: [
      { title: "Minhas consultas — Dr. Lucas Monteiro" },
      { name: "description", content: "Veja todas as suas consultas odontológicas agendadas em um só lugar." },
      { property: "og:title", content: "Minhas consultas — Dr. Lucas Monteiro" },
      { property: "og:description", content: "Veja todas as suas consultas odontológicas agendadas em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsultaPage,
});

function ConsultaPage() {
  const [nomeCompleto, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [result, setResult] = useState<Agendamento[] | null>(null);

  const mut = useMutation({
    mutationFn: () => agendaService.buscarConsultas({ nomeCompleto, cpf: cpf || undefined }),
    onSuccess: (d) => {
      setResult(d);
      if (d.length === 0) toast.info("Nenhuma consulta encontrada para este nome.");
    },
    onError: (e: Error) => {
      setResult(null);
      toast.error(e.message);
    },
  });

  return (
    <AppShell>
      <HeroBanner title="Minhas consultas" subtitle="Consulte todos os seus agendamentos" />

      <section className="mx-auto -mt-16 max-w-3xl px-4 pb-16">
        <Card className="rounded-3xl shadow-xl">
          <CardContent className="p-6 md:p-10">
            <form
              className="grid gap-4"
              onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
            >
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nome completo *</Label>
                <Input value={nomeCompleto} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">CPF (opcional)</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <Button type="submit" disabled={mut.isPending}>
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar consultas
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && result.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
              {result.length} consulta(s) encontrada(s)
            </h2>
            {result.map((c, i) => (
              <ConsultaCard key={`${c.protocolo ?? i}-${c.horario}`} c={c} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

export function ConsultaCard({ c, children }: { c: Agendamento; children?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              {formatarDataBR(c.dataConsulta)}
              <Clock className="ml-2 h-4 w-4 shrink-0 text-primary" />
              {c.horario}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{c.nomeCompleto}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{c.status ?? "Agendado"}</Badge>
        </div>

        <dl className="mt-4 grid gap-2 text-sm">
          <Row k="CPF" v={c.cpf} />
          <Row k="Telefone" v={c.telefone} />
          <Row k="E-mail" v={c.email} />
          <Row k="Convênio" v={c.convenio} />
          <Row k="Protocolo" v={c.protocolo ?? "—"} />
          {c.observacoes && <Row k="Observações" v={c.observacoes} />}
        </dl>

        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 truncate font-medium">{v}</dd>
    </div>
  );
}
