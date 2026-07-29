/**
 * URL do Web App do Google Apps Script (deploy /exec).
 * Pode ser sobrescrita por variável de ambiente no servidor (GAS_API_URL)
 * ou no build do cliente (VITE_API_URL) — mas o valor abaixo é o padrão.
 */
export const GAS_DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbzaUC5bsk1V9-lI1dv3lau1o3chjYiPCQp08FOK9ra7TfMvf94FHBQ2hq-C1R3-HaUf/exec";

/** Caminho do proxy interno usado pelo front-end (evita CORS por completo). */
export const GAS_PROXY_PATH = "/api/public/gas";
