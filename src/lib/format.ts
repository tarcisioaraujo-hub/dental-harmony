/** Converte texto para MAIÚSCULAS (usado antes de salvar na planilha). */
export function toUpper(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

/** Aplica MAIÚSCULAS em todos os campos string de um objeto. */
export function upperPayload<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    out[key] = typeof value === "string" ? toUpper(value) : value;
  }
  return out as T;
}

/** Formata "YYYY-MM-DD" para "DD/MM/YYYY" (mantém valores já em BR). */
export function formatarDataBR(dataIso: string) {
  if (!dataIso) return "";
  if (dataIso.includes("/")) return dataIso;
  const parts = dataIso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dataIso;
}
