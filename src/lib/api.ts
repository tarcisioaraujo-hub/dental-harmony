import { GAS_API_URL } from "@/lib/gas-config";

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// URL direta do Google Apps Script vinda do gas-config.ts
const getTargetUrl = () => {
  return GAS_API_URL || "https://script.google.com/macros/s/AKfycbzaUC5bsk1V9-lI1dv3lau1o3chjYiPCQp08FOK9ra7TfMvf94FHBQ2hq-C1R3-HaUf/exec";
};

export async function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  try {
    const baseUrl = getTargetUrl();
    const query = new URLSearchParams({ action, ...params }).toString();
    const url = `${baseUrl}?${query}`;

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data as unknown as T;
    }

    if (data && typeof data === "object") {
      if (data.ok === false) {
        throw new Error(data.error || data.message || "Erro retornado pela API");
      }
      if ("data" in data) {
        return data.data as T;
      }
    }

    return data as T;
  } catch (e) {
    console.error("[apiGet] Falha na requisição:", e);
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function apiPost<T>(action: string, body: Record<string, unknown>): Promise<T> {
  try {
    const baseUrl = getTargetUrl();

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, ...body }),
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }

    const data = await response.json();

    if (data && typeof data === "object") {
      if (data.ok === false) {
        throw new Error(data.error || data.message || "Erro retornado pela API");
      }
      if ("data" in data) {
        return data.data as T;
      }
    }

    return data as T;
  } catch (e) {
    console.error("[apiPost] Falha na requisição:", e);
    throw e instanceof Error ? e : new Error(String(e));
  }
}
