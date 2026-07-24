import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/layouts/AppShell";
import { agendaService } from "@/services/agendaService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import type { Agendamento } from "@/types/agenda";

export const Route = createFileRoute("/consulta")({
  head: () => ({
    meta: [
      { title: "Minha consulta — OdontoAgenda" },
      { name: "description", content: "Consulte os dados do seu agendamento odontológico." },
      { property: "og:title", content: "Minha consulta — OdontoAgenda" },
      { property: "og:description", content: "Consulte os dados do seu agendamento odontológico." },
    ],
  }),
  component: ConsultaPage,
});

function ConsultaPage() {
  const [nomeCompleto, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [result, setResult] = useState<Agendamento | null>(null);

  const mut = useMutation({
    mutationFn: () => agendaService.buscarConsulta({ nomeCompleto, cpf }),
    onSuccess: (d) => setResult(d),
    onError: (e: Error) => {
      setResult(null);
      toast.error(e.message);
    },
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Minha consulta</h1>
        <p className="text-muted-foreground mb-6">Informe seus dados para localizar o agendamento.</p>

        <Card>
          <CardHeader><CardTitle>Buscar</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
            >
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={nomeCompleto} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required />
              </div>
              <Button type="submit" disabled={mut.isPending}>
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader><CardTitle>Dados da consulta</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Row k="Data" v={result.dataConsulta} />
              <Row k="Horário" v={result.horario} />
              <Row k="Nome" v={result.nomeCompleto} />
              <Row k="CPF" v={result.cpf} />
              <Row k="Telefone" v={result.telefone} />
              <Row k="E-mail" v={result.email} />
              <Row k="Convênio" v={result.convenio} />
              <Row k="Status" v={result.status ?? "—"} />
              <Row k="Protocolo" v={result.protocolo ?? "—"} />
              {result.observacoes && <Row k="Observações" v={result.observacoes} />}
            </CardContent>
          </Card>
        )}
      </section>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
