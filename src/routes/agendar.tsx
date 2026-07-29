import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { AppShell, HeroBanner } from "@/layouts/AppShell";
import { agendaService } from "@/services/agendaService";
import { formatarDataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckCircle2, Clock, Loader2, UserRound } from "lucide-react";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar consulta — Dr. Lucas Monteiro" },
      { name: "description", content: "Escolha a data, o horário e confirme sua consulta odontológica online." },
      { property: "og:title", content: "Agendar consulta — Dr. Lucas Monteiro" },
      { property: "og:description", content: "Escolha a data, o horário e confirme sua consulta odontológica online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  convenio: z.string().trim().min(2, "Informe o convênio ou Particular"),
  observacoes: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

function AgendarPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ data: string; horario: string } | null>(null);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  const { data: horarios = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["horarios-disponiveis"],
    queryFn: agendaService.listarHorariosDisponiveis,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, { dia: string; horarios: string[] }>();
    for (const h of horarios) {
      const statusClean = String(h.status || "").trim().toLowerCase();
      if (!statusClean.includes("dispon") && statusClean !== "livre") continue;
      const cur = map.get(h.data) ?? { dia: h.dia, horarios: [] };
      if (!cur.horarios.includes(h.horario)) cur.horarios.push(h.horario);
      map.set(h.data, cur);
    }
    return Array.from(map.entries()).map(([data, v]) => ({
      data,
      ...v,
      horarios: [...v.horarios].sort(),
    }));
  }, [horarios]);

  const diaAtual = grouped.find((g) => g.data === dataSelecionada);

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
      <HeroBanner title="Agende sua consulta" />

      <section className="mx-auto -mt-16 max-w-3xl px-4 pb-16">
        <Card className="rounded-3xl shadow-xl">
          <CardContent className="p-6 md:p-10">
            <Stepper step={step} />

            {step === 1 && (
              <div className="mt-8">
                <SectionTitle icon={CalendarDays} title="Escolha a data" />

                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando datas...
                  </div>
                )}
                {isError && (
                  <div className="py-10 text-center">
                    <p className="text-destructive">Não foi possível carregar as datas.</p>
                    <Button variant="outline" className="mt-3" onClick={() => refetch()}>
                      Tentar novamente
                    </Button>
                  </div>
                )}
                {!isLoading && !isError && grouped.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground">Nenhuma data disponível no momento.</p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {grouped.map((g) => {
                    const active = dataSelecionada === g.data;
                    return (
                      <button
                        key={g.data}
                        type="button"
                        onClick={() => {
                          setDataSelecionada(g.data);
                          setSelected(null);
                        }}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-colors",
                          active ? "border-primary bg-primary/10" : "bg-muted/40 hover:bg-muted",
                        )}
                      >
                        <div className="font-semibold">{formatarDataBR(g.data)}</div>
                        <div className="text-sm capitalize text-muted-foreground">{g.dia}</div>
                        <Badge variant="secondary" className="mt-2">
                          {g.horarios.length} horários
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {/* Horários aparecem apenas depois da data escolhida */}
                {diaAtual && (
                  <div className="mt-8">
                    <SectionTitle icon={Clock} title="Horários disponíveis" />
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {diaAtual.horarios.map((h) => {
                        const isSel = selected?.data === diaAtual.data && selected.horario === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setSelected({ data: diaAtual.data, horario: h })}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                              isSel
                                ? "border-primary bg-primary text-primary-foreground"
                                : "bg-muted/40 hover:bg-muted",
                            )}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <Button disabled={!selected} onClick={() => setStep(2)}>
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8">
                <SectionTitle icon={UserRound} title="Identificação do Paciente" />
                {selected && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatarDataBR(selected.data)} às {selected.horario}
                  </p>
                )}

                <form
                  onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                  className="mt-6 grid gap-4 md:grid-cols-2"
                >
                  <Field label="Nome completo *" error={form.formState.errors.nomeCompleto?.message}>
                    <Input {...form.register("nomeCompleto")} placeholder="Como deseja ser chamado?" />
                  </Field>
                  <Field label="CPF *" error={form.formState.errors.cpf?.message}>
                    <Input {...form.register("cpf")} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="Nascimento *" error={form.formState.errors.dataNascimento?.message}>
                    <Input {...form.register("dataNascimento")} placeholder="dd/mm/aaaa" />
                  </Field>
                  <Field label="Telefone *" error={form.formState.errors.telefone?.message}>
                    <Input {...form.register("telefone")} placeholder="(11) 99999-9999" />
                  </Field>
                  <Field label="E-mail *" error={form.formState.errors.email?.message}>
                    <Input type="email" {...form.register("email")} placeholder="voce@email.com" />
                  </Field>
                  <Field label="Convênio *" error={form.formState.errors.convenio?.message}>
                    <Input {...form.register("convenio")} placeholder="Ex: Particular, Unimed, Amil..." />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Observações" error={form.formState.errors.observacoes?.message}>
                      <Textarea {...form.register("observacoes")} rows={3} placeholder="Opcional" />
                    </Field>
                  </div>
                  <div className="flex justify-between md:col-span-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar agendamento
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="py-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-foreground">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-bold">Consulta confirmada!</h2>
                <p className="mt-2 text-muted-foreground">
                  {selected && (
                    <>Sua consulta é em <strong>{formatarDataBR(selected.data)}</strong> às <strong>{selected.horario}</strong>.</>
                  )}
                </p>
                <div className="mt-4 inline-block rounded-lg bg-muted px-4 py-2 text-sm">
                  Protocolo: <strong>{protocolo}</strong>
                </div>
                <div className="mt-8">
                  <Button
                    onClick={() => {
                      setStep(1);
                      setSelected(null);
                      setDataSelecionada(null);
                      setProtocolo(null);
                      form.reset();
                    }}
                  >
                    Fazer novo agendamento
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Clock; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = ["Data", "Dados", "Confirmação"];
  return (
    <ol className="grid grid-cols-3 gap-2 border-b pb-4">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border text-sm font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary/15 text-foreground",
                !done && !active && "bg-card text-muted-foreground",
              )}
            >
              {n}
            </span>
            <span
              className={cn(
                "text-[10px] uppercase tracking-widest",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
