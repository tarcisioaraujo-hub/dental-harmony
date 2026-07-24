import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

if (!baseURL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api] VITE_API_URL não definido. Configure em .env.local ou nas variáveis de ambiente do deploy.",
  );
}

/**
 * Cliente HTTP único para consumir a API REST do Google Apps Script.
 * O Apps Script publicado como Web App aceita GET e POST.
 * Para evitar preflight CORS, POSTs usam Content-Type text/plain
 * (o Apps Script lê e2.postData.contents e faz JSON.parse).
 */
export const api = axios.create({
  baseURL,
  timeout: 20000,
});

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export async function apiGet<T>(action: string, params: Record<string, string> = {}) {
  const { data } = await api.get<ApiResponse<T>>("", {
    params: { action, ...params },
  });
  if (!data.ok) throw new Error(data.error || "Erro na requisição");
  return data.data as T;
}

export async function apiPost<T>(action: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<T>>(
    "",
    JSON.stringify({ action, ...body }),
    { headers: { "Content-Type": "text/plain;charset=utf-8" } },
  );
  if (!data.ok) throw new Error(data.error || "Erro na requisição");
  return data.data as T;
}
