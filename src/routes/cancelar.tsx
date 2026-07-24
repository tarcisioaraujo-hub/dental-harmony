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
import { Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/cancelar")({
  head: () => ({
    meta: [
      { title: "Cancelar consulta — OdontoAgenda" },
      { name: "description", content: "Cancele seu agendamento odontológico de forma simples e rápida." },
      { property: "og:title", content: "Cancelar consulta — OdontoAgenda" },
      { property: "og:description", content: "Cancele seu agendamento odontológico de forma simples e rápida." },
    ],
  }),
  component: CancelarPage,
});

function CancelarPage() {
  const [nomeCompleto, setNome] = useState("");
  const [cpf, setCpf] = useState("");

  const mut = useMutation({
    mutationFn: () => agendaService.cancelar({ nomeCompleto, cpf }),
    onSuccess: () => {
      toast.success("Consulta cancelada com sucesso.");
      setNome(""); setCpf("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Cancelar consulta</h1>
        <p className="text-muted-foreground mb-6">Informe seus dados para localizar e cancelar.</p>

        <Card>
          <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={nomeCompleto} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required />
              </div>
              <Button type="submit" variant="destructive" disabled={mut.isPending}>
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancelar consulta
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
