import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { AppShell } from "@/layouts/AppShell";
import { agendaService } from "@/services/agendaService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar consulta — OdontoAgenda" },
      { name: "description", content: "Escolha data, horário e confirme sua consulta odontológica online." },
      { property: "og:title", content: "Agendar consulta — OdontoAgenda" },
      { property: "og:description", content: "Escolha data, horário e confirme sua consulta odontológica online." },
    ],
  }),
  component: AgendarPage,
});

const schema = z.object({
  nomeCompleto: z.string().trim().min(3, "Informe seu nome completo").max(120),
  cpf: z.string().trim().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
  dataNascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use dd/mm/aaaa"),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  email: z.string().trim().email("E-mail inválido").max(160),
  convenio: z.string().trim().min(1, "Selecione o convênio"),
  observacoes: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

// Helper para formatar a data ISO "YYYY-MM-DD" para "DD/MM/YYYY" na exibição
function formatarDataBR(dataIso: string) {
  if (!dataIso) return "";
  if (dataIso.includes("/")) return dataIso;
  const parts = dataIso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataIso;
}

function AgendarPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<{ data: string; horario: string } | null>(null);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  const { data: horarios = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["horarios-disponiveis"],
    queryFn: agendaService.listarHorariosDisponiveis,
  });

  // Agrupa os horários por data tratando diferenças de case ("DISPONÍVEL", "Disponível", "disponivel")
  const grouped = useMemo(() => {
    const map = new Map<string, { dia: string; horarios: string[] }>();
    
    for (const h of horarios) {
      const statusClean = String(h.status || "").trim().toLowerCase();
      // Aceita variações de escrita
      if (!statusClean.includes("dispon") && statusClean !== "livre") continue;

      const cur = map.get(h.data) ?? { dia: h.dia, horarios: [] };
      if (!cur.horarios.includes(h.horario)) {
        cur.horarios.push(h.horario);
      }
      map.set(h.data, cur);
    }
    
    return Array.from(map.entries()).map(([data, v]) => ({ data, ...v }));
  }, [horarios]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { convenio: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (!selected) throw new Error("Selecione um horário");
      return agendaService.agendar({
        ...values,
        dataConsulta: selected.data,
        horario: selected.horario,
      });
    },
    onSuccess: (res) => {
      setProtocolo(res.protocolo ?? "—");
      setStep(3);
      qc.invalidateQueries({ queryKey: ["horarios-disponiveis"] });
      toast.success("Consulta agendada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Agendar consulta</h1>
          <p className="text-muted-foreground">Siga os 3 passos abaixo.</p>
        </header>

        <Stepper step={step} />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>1. Escolha um horário</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando horários...
                </div>
              )}
              {isError && (
                <div className="text-center py-8">
                  <p className="text-destructive">Não foi possível carregar os horários.</p>
                  <Button variant="outline" className="mt-3" onClick={() => refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              )}
              {!isLoading && !isError && grouped.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum horário disponível no momento.
                </p>
              )}
              <div className="space-y-4">
                {grouped.map((g) => (
                  <div key={g.data} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-lg">{formatarDataBR(g.data)}</div>
                        <div className="text-sm text-muted-foreground capitalize">{g.dia}</div>
                      </div>
                      <Badge variant="secondary">{g.horarios.length} disponíveis</Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {g.horarios.map((h) => {
                        const isSel = selected?.data === g.data && selected.horario === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setSelected({ data: g.data, horario: h })}
                            className={cn(
                              "px-3 py-2 rounded-md border text-sm font-medium transition-colors",
                              isSel
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card hover:bg-secondary"
                            )}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button disabled={!selected} onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>2. Seus dados</CardTitle>
              {selected && (
                <p className="text-sm text-muted-foreground">
                  {formatarDataBR(selected.data)} às {selected.horario}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                className="grid md:grid-cols-2 gap-4"
              >
                <Field label="Nome completo" error={form.formState.errors.nomeCompleto?.message}>
                  <Input {...form.register("nomeCompleto")} placeholder="Como está no documento" />
                </Field>
                <Field label="CPF" error={form.formState.errors.cpf?.message}>
                  <Input {...form.register("cpf")} placeholder="000.000.000-00" />
                </Field>
                <Field label="Data de nascimento" error={form.formState.errors.dataNascimento?.message}>
                  <Input {...form.register("dataNascimento")} placeholder="dd/mm/aaaa" />
                </Field>
                <Field label="Telefone" error={form.formState.errors.telefone?.message}>
                  <Input {...form.register("telefone")} placeholder="(11) 99999-9999" />
                </Field>
                <Field label="E-mail" error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} placeholder="voce@email.com" />
                </Field>
                <Field label="Convênio" error={form.formState.errors.convenio?.message}>
                  <Select
                    value={form.watch("convenio")}
                    onValueChange={(v) => form.setValue("convenio", v, { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Particular">Particular</SelectItem>
                      <SelectItem value="Unimed">Unimed</SelectItem>
                      <SelectItem value="Amil">Amil</SelectItem>
                      <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
                      <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Observações" error={form.formState.errors.observacoes?.message}>
                    <Textarea {...form.register("observacoes")} rows={3} placeholder="Opcional" />
                  </Field>
                </div>
                <div className="md:col-span-2 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar agendamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary grid place-items-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Consulta confirmada!</h2>
              <p className="mt-2 text-muted-foreground">
                {selected && <>Sua consulta é em <strong>{formatarDataBR(selected.data)}</strong> às <strong>{selected.horario}</strong>.</>}
              </p>
              <div className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 text-sm">
                Protocolo: <strong>{protocolo}</strong>
              </div>
              <div className="mt-8">
                <Button
                  onClick={() => {
                    setStep(1);
                    setSelected(null);
                    setProtocolo(null);
                    form.reset();
                  }}
                >
                  Fazer novo agendamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </AppShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = ["Horário", "Dados", "Confirmação"];
  return (
    <ol className="mb-6 flex items-center gap-2">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "h-8 w-8 grid place-items-center rounded-full text-sm font-semibold border",
                done && "bg-primary text-primary-foreground border-primary",
                active && "bg-primary/10 text-primary border-primary",
                !done && !active && "bg-card text-muted-foreground"
              )}
            >
              {n}
            </span>
            <span className={cn("text-sm", active ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {i < items.length - 1 && <span className="w-6 h-px bg-border mx-1" />}
          </li>
        );
      })}
    </ol>
  );
}
