/**
 * URL do Web App do Google Apps Script (deploy /exec).
 * Pode ser sobrescrita por variável de ambiente no servidor (GAS_API_URL)
 * ou no build do cliente (VITE_API_URL) — mas o valor abaixo é o padrão.
 */
export const GAS_DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbx9YMipJLaZINMp2dFaf_52B3faIGWJcwFgUh9H6fUFYJ5NYONu2HZ489eB_yvjo2Ru/exec";

/** Caminho do proxy interno usado pelo front-end (evita CORS por completo). */
export const GAS_PROXY_PATH = "/api/public/gas";
