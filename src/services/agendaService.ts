import type { Agendamento, HorarioDisponivel } from "@/types/agenda";
import { upperPayload } from "@/lib/format";

// Pega a URL da variável de ambiente com Fallback seguro
const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "";
  return url.trim();
};

async function postAction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const baseUrl = getApiUrl();
  if (!baseUrl) throw new Error("URL da API não configurada no VITE_API_URL");

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    // REGRA: tudo que vai para a planilha é enviado em MAIÚSCULAS
    body: JSON.stringify({ action, ...upperPayload(payload) }),
    redirect: "follow",
  });

  const result = await response.json();
  if (!result?.ok) throw new Error(result?.error || "Erro na requisição");
  return result.data as T;
}

async function getAction<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const baseUrl = getApiUrl();
  if (!baseUrl) throw new Error("URL da API não configurada no VITE_API_URL");

  const query = new URLSearchParams({ action, ...upperPayload(params) }).toString();
  const response = await fetch(`${baseUrl}?${query}`, { method: "GET", redirect: "follow" });
  if (!response.ok) throw new Error(`Erro na rede: ${response.status}`);

  const result = await response.json();
  if (result && result.ok) return result.data as T;
  if (Array.isArray(result)) return result as unknown as T;
  throw new Error(result?.error || "Formato de dados inválido retornado pela API");
}

export const agendaService = {
  async listarHorariosDisponiveis(): Promise<HorarioDisponivel[]> {
    const data = await getAction<HorarioDisponivel[]>("horarios-disponiveis");
    return Array.isArray(data) ? data : [];
  },

  agendar(payload: Omit<Agendamento, "dataAgendamento" | "status" | "protocolo">) {
    return postAction<Agendamento>("agendar", payload);
  },

  /** Retorna TODAS as consultas do paciente (nome obrigatório, CPF opcional). */
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
