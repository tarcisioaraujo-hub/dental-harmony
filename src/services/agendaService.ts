import type { Agendamento, HorarioDisponivel } from "@/types/agenda";

const API_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbzaUC5bsk1V9-lI1dv3lau1o3chjYiPCQp08FOK9ra7TfMvf94FHBQ2hq-C1R3-HaUf/exec";

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || API_URL_FALLBACK;
  return url.trim();
};

async function postAction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const baseUrl = getApiUrl();
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, ...payload }), // Removido upperPayload para manter a escrita original
    redirect: "follow",
  });

  const result = await response.json();
  if (!result?.ok) throw new Error(result?.error || "Erro na requisição");
  return result.data as T;
}

async function getAction<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const baseUrl = getApiUrl();
  const query = new URLSearchParams({ action, ...params }).toString(); // Removido upperPayload
  
  const response = await fetch(`${baseUrl}?${query}`, { 
    method: "GET", 
    redirect: "follow" 
  });
  
  if (!response.ok) throw new Error(`Erro na rede: ${response.status}`);

  const result = await response.json();
  if (result && result.ok) return result.data as T;
  if (Array.isArray(result)) return result as unknown as T;
  if (result && result.data) return result.data as T;
  
  throw new Error(result?.error || "Formato de dados inválido retornado pela API");
}

export const agendaService = {
  async listarHorariosDisponiveis(): Promise<HorarioDisponivel[]> {
    try {
      const data = await getAction<HorarioDisponivel[]>("horarios-disponiveis");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      return [];
    }
  },

  agendar(payload: Omit<Agendamento, "dataAgendamento" | "status" | "protocolo">) {
    return postAction<Agendamento>("agendar", payload);
  },

  async buscarConsultas(params: { nomeCompleto: string; cpf?: string }): Promise<Agendamento[]> {
    const data = await getAction<Agendamento[] | Agendamento>("buscar-consultas", {
      nomeCompleto: params.nomeCompleto,
      ...(params.cpf ? { cpf: params.cpf } : {}),
    });
    if (Array.isArray(data)) return data;
    return data ? [data] : [];
  },

  cancelar(payload: {
    nomeCompleto: string;
    cpf: string;
    protocolo?: string;
    dataConsulta?: string;
    horario?: string;
  }) {
    return postAction<{ cancelado: boolean }>("cancelar", payload);
  },

  reagendar(payload: { nomeCompleto: string; cpf: string; novaData: string; novoHorario: string }) {
    return postAction<Agendamento>("reagendar", payload);
  },

  buscarConsulta(params: { nomeCompleto: string; cpf: string }) {
    return getAction<Agendamento>("buscar-consulta", params);
  },
};
