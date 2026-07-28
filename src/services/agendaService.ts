import type { Agendamento, HorarioDisponivel } from "@/types/agenda";

// Pega a URL da variável de ambiente com Fallback seguro
const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "";
  return url.trim();
};

export const agendaService = {
  async listarHorariosDisponiveis(): Promise<HorarioDisponivel[]> {
    const baseUrl = getApiUrl();
    if (!baseUrl) {
      throw new Error("URL da API não configurada no VITE_API_URL");
    }

    // Monta a requisição apontando diretamente para o Google Apps Script
    const response = await fetch(`${baseUrl}?action=horarios-disponiveis`, {
      method: "GET",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Erro na rede: ${response.status}`);
    }

    const result = await response.json();

    // Trata o encapsulamento { ok: true, data: [...] } retornado pelo Apps Script
    if (result && result.ok && Array.isArray(result.data)) {
      return result.data as HorarioDisponivel[];
    }

    if (Array.isArray(result)) {
      return result as HorarioDisponivel[];
    }

    throw new Error(result?.error || "Formato de dados inválido retornado pela API");
  },

  async agendar(
    payload: Omit<Agendamento, "dataAgendamento" | "status" | "protocolo">
  ): Promise<Agendamento> {
    const baseUrl = getApiUrl();
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "agendar", ...payload }),
      redirect: "follow",
    });

    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Erro ao agendar");
    return result.data as Agendamento;
  },

  async cancelar(payload: { nomeCompleto: string; cpf: string }): Promise<{ cancelado: boolean }> {
    const baseUrl = getApiUrl();
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "cancelar", ...payload }),
      redirect: "follow",
    });

    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Erro ao cancelar");
    return result.data as { cancelado: boolean };
  },

  async reagendar(payload: {
    nomeCompleto: string;
    cpf: string;
    novaData: string;
    novoHorario: string;
  }): Promise<Agendamento> {
    const baseUrl = getApiUrl();
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "reagendar", ...payload }),
      redirect: "follow",
    });

    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Erro ao reagendar");
    return result.data as Agendamento;
  },

  async buscarConsulta(params: { nomeCompleto: string; cpf: string }): Promise<Agendamento> {
    const baseUrl = getApiUrl();
    const query = new URLSearchParams({
      action: "buscar-consulta",
      nomeCompleto: params.nomeCompleto,
      cpf: params.cpf,
    }).toString();

    const response = await fetch(`${baseUrl}?${query}`, {
      method: "GET",
      redirect: "follow",
    });

    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Consulta não encontrada");
    return result.data as Agendamento;
  },
};
