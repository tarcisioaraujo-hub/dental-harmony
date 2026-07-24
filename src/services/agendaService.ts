import { apiGet, apiPost } from "@/lib/api";
import type { Agendamento, HorarioDisponivel } from "@/types/agenda";

export const agendaService = {
  listarHorariosDisponiveis: () =>
    apiGet<HorarioDisponivel[]>("horarios-disponiveis"),

  agendar: (payload: Omit<Agendamento, "dataAgendamento" | "status" | "protocolo">) =>
    apiPost<Agendamento>("agendar", payload),

  cancelar: (payload: { nomeCompleto: string; cpf: string }) =>
    apiPost<{ cancelado: boolean }>("cancelar", payload),

  reagendar: (payload: {
    nomeCompleto: string;
    cpf: string;
    novaData: string;
    novoHorario: string;
  }) => apiPost<Agendamento>("reagendar", payload),

  buscarConsulta: (params: { nomeCompleto: string; cpf: string }) =>
    apiGet<Agendamento>("buscar-consulta", params),
};
