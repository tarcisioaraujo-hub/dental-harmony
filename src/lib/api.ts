import axios, { AxiosError } from "axios";

import { GAS_PROXY_PATH } from "@/lib/gas-config";

/**
 * Todas as chamadas passam pelo proxy interno (/api/public/gas), que repassa
 * para o Web App do Google Apps Script no servidor. Isso elimina CORS,
 * redirects opacos e o erro "Network Error" sem detalhes.
 */
export const api = axios.create({
  baseURL: GAS_PROXY_PATH,
  timeout: 30000,
});

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
};

function toError(e: unknown): Error {
  if (e instanceof AxiosError) {
    const payload = e.response?.data as ApiResponse<unknown> | string | undefined;
    const msg =
      (typeof payload === "object" && payload && (payload.error || payload.message)) ||
      (typeof payload === "string" ? payload.slice(0, 300) : "") ||
      e.message;
    // eslint-disable-next-line no-console
    console.error("[api] falha na requisição:", { status: e.response?.status, data: payload, message: e.message });
    return new Error(String(msg));
  }
  // eslint-disable-next-line no-console
  console.error("[api] erro inesperado:", e);
  return e instanceof Error ? e : new Error(String(e));
}

export async function apiGet<T>(action: string, params: Record<string, string> = {}) {
  try {
    const { data } = await api.get<ApiResponse<T>>("", { params: { action, ...params } });
    if (!data || typeof data !== "object") throw new Error("Resposta inválida da API.");
    if (!data.ok) throw new Error(data.error || "Erro na requisição");
    return data.data as T;
  } catch (e) {
    throw toError(e);
  }
}

export async function apiPost<T>(action: string, body: Record<string, unknown>) {
  try {
    const { data } = await api.post<ApiResponse<T>>("", JSON.stringify({ action, ...body }), {
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
    if (!data || typeof data !== "object") throw new Error("Resposta inválida da API.");
    if (!data.ok) throw new Error(data.error || "Erro na requisição");
    return data.data as T;
  } catch (e) {
    throw toError(e);
  }
}
