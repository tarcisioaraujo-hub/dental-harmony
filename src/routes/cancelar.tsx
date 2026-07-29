import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, HeroBanner } from "@/layouts/AppShell";
import { agendaService } from "@/services/agendaService";
import { ConsultaCard } from "@/routes/consulta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, XCircle } from "lucide-react";
import type { Agendamento } from "@/types/agenda";

export const Route = createFileRoute("/cancelar")({
  head: () => ({
    meta: [
      { title: "Cancelar consulta — Dr. Lucas Monteiro" },
      { name: "description", content: "Localize seus agendamentos e cancele a consulta desejada em poucos cliques." },
      { property: "og:title", content: "Cancelar consulta — Dr. Lucas Monteiro" },
      { property: "og:description", content: "Localize seus agendamentos e cancele a consulta desejada em poucos cliques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CancelarPage,
});

function CancelarPage() {
  const [nomeCompleto, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [lista, setLista] = useState<Agendamento[] | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  const busca = useMutation({
    mutationFn: () => agendaService.buscarConsultas({ nomeCompleto, cpf }),
    onSuccess: (d) => {
      setLista(d);
      if (d.length === 0) toast.info("Nenhuma consulta encontrada com esses dados.");
    },
    onError: (e: Error) => {
      setLista(null);
      toast.error(e.message);
    },
  });

  const cancelar = useMutation({
    mutationFn: (c: Agendamento) =>
      agendaService.cancelar({
        nomeCompleto,
        cpf,
        protocolo: c.protocolo,
        dataConsulta: c.dataConsulta,
        horario: c.horario,
      }),
    onSuccess: (_d, c) => {
      toast.success("Consulta cancelada com sucesso.");
      setLista((prev) => (prev ?? []).filter((x) => x !== c));
      setCancelando(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setCancelando(null);
    },
  });

  return (
    <AppShell>
      <HeroBanner title="Cancelar consulta" subtitle="Informe nome e CPF para localizar seus agendamentos" />

      <section className="mx-auto -mt-16 max-w-3xl px-4 pb-16">
        <Card className="rounded-3xl shadow-xl">
          <CardContent className="p-6 md:p-10">
            <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); busca.mutate(); }}>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nome completo *</Label>
                <Input value={nomeCompleto} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">CPF *</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required />
              </div>
              <Button type="submit" disabled={busca.isPending}>
                {busca.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Localizar consultas
              </Button>
            </form>
          </CardContent>
        </Card>

        {lista && lista.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
              Selecione a consulta que deseja cancelar
            </h2>
            {lista.map((c, i) => {
              const id = `${c.protocolo ?? i}-${c.horario}`;
              const confirmando = cancelando === id;
              return (
                <ConsultaCard key={id} c={c}>
                  {confirmando ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-destructive/10 p-3">
                      <span className="text-sm">Confirma o cancelamento desta consulta?</span>
                      <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCancelando(null)}>
                          Voltar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancelar.isPending}
                          onClick={() => cancelar.mutate(c)}
                        >
                          {cancelar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Sim, cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="destructive" className="w-full" onClick={() => setCancelando(id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar esta consulta
                    </Button>
                  )}
                </ConsultaCard>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
