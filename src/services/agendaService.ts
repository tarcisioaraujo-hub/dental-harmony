import { apiGet, apiPost } from "@/lib/api";
import type { Agendamento, HorarioDisponivel } from "@/types/agenda";

export const agendaService = {
  listarHorariosDisponiveis: async () => {
    // Busca a resposta do backend
    const res: any = await apiGet("horarios-disponiveis");
    // Se a API retornou o padrão { ok: true, data: [...] }, extrai o data
    if (res && res.ok && Array.isArray(res.data)) {
      return res.data as HorarioDisponivel[];
    }
    // Se res já for o array direto (fallback)
    if (Array.isArray(res)) {
      return res as HorarioDisponivel[];
    }
    throw new Error(res?.error || "Formato de dados de horários inválido");
  },

  agendar: async (payload: Omit<Agendamento, "dataAgendamento" | "status" | "protocolo">) => {
    const res: any = await apiPost("agendar", payload);
    return (res?.data || res) as Agendamento;
  },

  cancelar: async (payload: { nomeCompleto: string; cpf: string }) => {
    const res: any = await apiPost("cancelar", payload);
    return (res?.data || res) as { cancelado: boolean };
  },

  reagendar: async (payload: {
    nomeCompleto: string;
    cpf: string;
    novaData: string;
    novoHorario: string;
  }) => {
    const res: any = await apiPost("reagendar", payload);
    return (res?.data || res) as Agendamento;
  },

  buscarConsulta: async (params: { nomeCompleto: string; cpf: string }) => {
    const res: any = await apiGet("buscar-consulta", params);
    return (res?.data || res) as Agendamento;
  },
};
